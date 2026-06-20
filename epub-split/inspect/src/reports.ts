import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { join, relative } from "node:path";

import {
  BACKUP_REPORTS_DIRECTORY,
  PARSER_NAMES,
  REPORT_SCHEMA_VERSION,
  REPORTS_DIRECTORY,
  TEMP_REPORTS_DIRECTORY,
} from "./config.ts";
import type {
  BookInventoryEntry,
  BookObservation,
  BrowserOpenOutcome,
  BrowserRuntime,
  HashedBook,
  NodeOpenOutcome,
  ParserPathAttempt,
  RootInventory,
  RunReport,
  StorytellerOpenOutcome,
} from "./types.ts";

const RUNNER_VERSION = "0.1.0";

export async function generateReports(
  books: HashedBook[],
  roots: RootInventory[],
  browser: BrowserRuntime
): Promise<void> {
  await rm(TEMP_REPORTS_DIRECTORY, { recursive: true, force: true });
  await mkdir(join(TEMP_REPORTS_DIRECTORY, "books"), { recursive: true });
  await mkdir(join(TEMP_REPORTS_DIRECTORY, "details"), { recursive: true });

  const inventory: BookInventoryEntry[] = [];
  for (const book of books) {
    const observation = createBookObservation(book);
    const report = `books/${book.reportFilename}`;
    const detail = detailPath(observation, book.reportFilename);
    await writeJson(join(TEMP_REPORTS_DIRECTORY, report), observation);
    if (detail) {
      await writeFile(
        join(TEMP_REPORTS_DIRECTORY, detail),
        renderDetail(observation),
        "utf8"
      );
    }
    inventory.push({
      root: book.root,
      relativePath: book.relativePath,
      size: book.size,
      sha256: book.sha256,
      shortSha: book.shortSha,
      report,
      detail,
      parserStates: Object.fromEntries(
        PARSER_NAMES.map((name) => [name, observation.parsers[name].status])
      ) as BookInventoryEntry["parserStates"],
      browserOpen: browserOpenStatus(observation),
    });
  }

  const runReport: RunReport = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    runner: {
      name: "epub-inspect",
      version: RUNNER_VERSION,
      bun: Bun.version,
    },
    packages: browser.packages,
    browser: {
      name: browser.name,
      version: browser.version,
    },
    parserPaths: PARSER_NAMES,
    roots,
    books: inventory,
  };

  await writeJson(join(TEMP_REPORTS_DIRECTORY, "run.json"), runReport);
  await writeFile(
    join(TEMP_REPORTS_DIRECTORY, "index.md"),
    renderIndex(runReport),
    "utf8"
  );

  await validateReports(runReport);
  await replaceReports();
}

function createBookObservation(book: HashedBook): BookObservation {
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    book: {
      root: book.root,
      relativePath: book.relativePath,
      size: book.size,
      sha256: book.sha256,
      shortSha: book.shortSha,
    },
    parsers: {
      "epubts-browser":
        book.parserAttempts["epubts-browser"] ?? notImplemented(),
      "epubts-node": book.parserAttempts["epubts-node"] ?? notImplemented(),
      "storyteller-node":
        book.parserAttempts["storyteller-node"] ?? notImplemented(),
    },
    comparison: { status: "not-implemented" },
  };
}

function renderIndex(run: RunReport): string {
  const lines = [
    "# EPUB Inspection Report",
    "",
    `- Schema: ${run.schemaVersion}`,
    `- Runner: ${run.runner.name} ${run.runner.version}`,
    `- Bun: ${run.runner.bun}`,
    `- Chromium: ${run.browser.version}`,
    `- epub.ts: ${run.packages.epubts}`,
    `- Storyteller: ${run.packages.storyteller}`,
    `- Playwright: ${run.packages.playwright}`,
    `- Books: ${run.books.length}`,
    `- epubts-browser opened: ${countOpen(run, "opened")}`,
    `- epubts-browser open-failed: ${countOpen(run, "open-failed")}`,
    `- epubts-node opened: ${countNode(run, "node-opened")}`,
    `- epubts-node open-failed: ${countNode(run, "node-open-failed")}`,
    `- storyteller opened: ${countStoryteller(run, "storyteller-opened")}`,
    `- storyteller open-failed: ${countStoryteller(run, "storyteller-open-failed")}`,
    "",
  ];

  for (const root of run.roots) {
    lines.push(`## ${root.name}`, "", `Books: ${root.count}`, "");
    lines.push("| SHA | Book | Parser state |", "|---|---|---|");
    for (const book of run.books.filter((entry) => entry.root === root.name)) {
      lines.push(
        `| ${book.shortSha} | [${escapeTable(book.relativePath)}](${book.report}) | ${renderParserStates(book)} |`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function validateReports(run: RunReport): Promise<void> {
  const filenames = await readdir(join(TEMP_REPORTS_DIRECTORY, "books"));
  if (filenames.length !== run.books.length) {
    throw new Error(
      `Report inventory mismatch: ${run.books.length} books, ${filenames.length} files`
    );
  }

  const expectedReports = new Set(run.books.map((book) => book.report));
  if (expectedReports.size !== run.books.length) {
    throw new Error("Duplicate report paths in run inventory");
  }

  const rootCounts = new Map(
    run.roots.map((root) => [root.name, root.count] as const)
  );
  for (const root of run.roots) {
    const actual = run.books.filter((book) => book.root === root.name).length;
    if (actual !== root.count) {
      throw new Error(
        `Root count mismatch for ${root.name}: expected ${root.count}, found ${actual}`
      );
    }
  }

  for (const book of run.books) {
    if (!rootCounts.has(book.root)) {
      throw new Error(`Unknown root in inventory: ${book.root}`);
    }
    const reportPath = join(TEMP_REPORTS_DIRECTORY, book.report);
    const raw = await readFile(reportPath, "utf8");
    if (raw.includes("/Users/") || raw.includes("/Volumes/")) {
      throw new Error(`Absolute machine path leaked into ${book.report}`);
    }
    const parsed = JSON.parse(raw) as BookObservation;
    if (
      parsed.book.sha256 !== book.sha256 ||
      parsed.book.relativePath !== book.relativePath ||
      parsed.book.root !== book.root
    ) {
      throw new Error(`Book identity mismatch: ${book.report}`);
    }
    const browserAttempt = parsed.parsers["epubts-browser"];
    if (
      browserAttempt.status !== "transported" &&
      browserAttempt.status !== "transport-failed"
    ) {
      throw new Error(`Missing browser transport outcome: ${book.report}`);
    }
    if (
      browserAttempt.status === "transported" &&
      (browserAttempt.byteLength !== book.size ||
        browserAttempt.sha256 !== book.sha256)
    ) {
      throw new Error(`Browser transport identity mismatch: ${book.report}`);
    }
    if (
      browserAttempt.status === "transported" &&
      browserAttempt.open.status !== "opened" &&
      browserAttempt.open.status !== "open-failed"
    ) {
      throw new Error(`Missing browser open outcome: ${book.report}`);
    }
    const nodeAttempt = parsed.parsers["epubts-node"];
    if (
      nodeAttempt.status !== "node-opened" &&
      nodeAttempt.status !== "node-open-failed"
    ) {
      throw new Error(`Missing node open outcome: ${book.report}`);
    }
    const storytellerAttempt = parsed.parsers["storyteller-node"];
    if (
      storytellerAttempt.status !== "storyteller-opened" &&
      storytellerAttempt.status !== "storyteller-open-failed"
    ) {
      throw new Error(`Missing storyteller open outcome: ${book.report}`);
    }
    if (book.detail) {
      await stat(join(TEMP_REPORTS_DIRECTORY, book.detail));
    }
  }

  const index = await readFile(join(TEMP_REPORTS_DIRECTORY, "index.md"), "utf8");
  for (const book of run.books) {
    if (!index.includes(`](${book.report})`)) {
      throw new Error(`Index does not link report: ${book.report}`);
    }
    if (book.detail && !index.includes(`](${book.detail})`)) {
      throw new Error(`Index does not link detail: ${book.detail}`);
    }
  }

  const serialized = JSON.stringify(run);
  if (serialized.includes("/Users/") || serialized.includes("/Volumes/")) {
    throw new Error("Absolute machine path leaked into run.json");
  }
}

async function replaceReports(): Promise<void> {
  await rm(BACKUP_REPORTS_DIRECTORY, { recursive: true, force: true });
  const hasCurrentReports = await isDirectory(REPORTS_DIRECTORY);

  if (hasCurrentReports) {
    await rename(REPORTS_DIRECTORY, BACKUP_REPORTS_DIRECTORY);
  }

  try {
    await rename(TEMP_REPORTS_DIRECTORY, REPORTS_DIRECTORY);
  } catch (error) {
    if (hasCurrentReports) {
      await rename(BACKUP_REPORTS_DIRECTORY, REPORTS_DIRECTORY);
    }
    throw error;
  }

  await rm(BACKUP_REPORTS_DIRECTORY, { recursive: true, force: true });
}

async function isDirectory(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined))?.isDirectory() ?? false;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function escapeTable(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\[/g, "\\[")
    .replace(/\]/g, "\\]")
    .replace(/\|/g, "\\|");
}

function notImplemented(): ParserPathAttempt {
  return { status: "not-implemented" };
}

function browserOpenStatus(
  observation: BookObservation
): BrowserOpenOutcome["status"] | null {
  const attempt = observation.parsers["epubts-browser"];
  return attempt.status === "transported" ? attempt.open.status : null;
}

function countOpen(
  run: RunReport,
  status: BrowserOpenOutcome["status"]
): number {
  return run.books.filter((book) => book.browserOpen === status).length;
}

function countNode(
  run: RunReport,
  status: NodeOpenOutcome["status"]
): number {
  return run.books.filter(
    (book) => book.parserStates["epubts-node"] === status
  ).length;
}

function countStoryteller(
  run: RunReport,
  status: StorytellerOpenOutcome["status"]
): number {
  return run.books.filter(
    (book) => book.parserStates["storyteller-node"] === status
  ).length;
}

function detailPath(
  observation: BookObservation,
  reportFilename: string
): string | null {
  const attempt = observation.parsers["epubts-browser"];
  const node = observation.parsers["epubts-node"];
  const storyteller = observation.parsers["storyteller-node"];
  const browserOpenFailed =
    attempt.status === "transported" && attempt.open.status === "open-failed";
  if (
    attempt.status === "transport-failed" ||
    browserOpenFailed ||
    (attempt.status === "transported" && attempt.diagnostics.length > 0) ||
    node.status === "node-open-failed" ||
    storyteller.status === "storyteller-open-failed"
  ) {
    return `details/${reportFilename.replace(/\.json$/, ".md")}`;
  }
  return null;
}

function renderParserStates(book: BookInventoryEntry): string {
  const states = PARSER_NAMES.map((name) => {
    if (name === "epubts-browser" && book.browserOpen) {
      return `${name}: ${book.parserStates[name]}/${book.browserOpen}`;
    }
    return `${name}: ${book.parserStates[name]}`;
  }).join("; ");
  if (!book.detail) return states;
  return `[${escapeTable(states)}](${book.detail})`;
}

function renderDetail(observation: BookObservation): string {
  const attempt = observation.parsers["epubts-browser"];
  const lines = [
    `# ${observation.book.relativePath}`,
    "",
    `- Root: ${observation.book.root}`,
    `- SHA-256: ${observation.book.sha256}`,
    `- Browser transport: ${attempt.status}`,
  ];

  if (attempt.status === "transport-failed") {
    lines.push(
      `- Failure stage: ${attempt.failure.stage}`,
      `- Failure category: ${attempt.failure.category}`,
      `- Failure message: ${attempt.failure.message}`
    );
  }
  if (attempt.status === "transported") {
    lines.push(`- Open: ${attempt.open.status}`);
    if (attempt.open.status === "opened") {
      const version = attempt.open.version;
      lines.push(
        `- Declared version: ${version.status === "exposed" ? version.value : "skipped"}`
      );
    } else {
      lines.push(
        `- Open failure stage: ${attempt.open.stage}`,
        `- Open failure category: ${attempt.open.category}`,
        `- Open failure message: ${attempt.open.message}`
      );
    }
  }
  if (
    (attempt.status === "transported" || attempt.status === "transport-failed") &&
    attempt.diagnostics.length > 0
  ) {
    lines.push("", "## Diagnostics", "");
    for (const diagnostic of attempt.diagnostics) {
      lines.push(
        `- ${diagnostic.source}/${diagnostic.level}: ${diagnostic.message}`
      );
    }
  }

  const node = observation.parsers["epubts-node"];
  lines.push(`- Node epub.ts: ${node.status}`);
  if (node.status === "node-opened") {
    lines.push(
      `- Node declared version: ${node.version.status === "exposed" ? node.version.value : "skipped"}`
    );
  }
  if (node.status === "node-open-failed") {
    lines.push(
      `- Node open failure stage: ${node.stage}`,
      `- Node open failure category: ${node.category}`,
      `- Node open failure message: ${node.message}`
    );
  }

  const storyteller = observation.parsers["storyteller-node"];
  lines.push(`- Storyteller: ${storyteller.status}`);
  if (storyteller.status === "storyteller-opened") {
    lines.push(
      `- Storyteller declared version: ${storyteller.version.status === "exposed" ? storyteller.version.value : "skipped"}`
    );
  }
  if (storyteller.status === "storyteller-open-failed") {
    lines.push(
      `- Storyteller open failure stage: ${storyteller.stage}`,
      `- Storyteller open failure category: ${storyteller.category}`,
      `- Storyteller open failure message: ${storyteller.message}`
    );
  }

  return `${lines.join("\n")}\n`;
}

export function reportPathForDisplay(): string {
  return relative(process.cwd(), REPORTS_DIRECTORY) || ".";
}
