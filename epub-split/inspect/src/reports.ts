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
  FieldComparison,
  HashedBook,
  MetadataComparison,
  MetadataFields,
  DOMParserImpl,
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
  const observations: BookObservation[] = [];
  for (const book of books) {
    const observation = createBookObservation(book);
    observations.push(observation);
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
      nodeEngine: nodeEngineUsed(observation),
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
    metadataHistogram: buildMetadataHistogram(books),
    comparisonHistogram: buildComparisonHistogram(observations),
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
  const parsers = {
    "epubts-browser":
      book.parserAttempts["epubts-browser"] ?? notImplemented(),
    "epubts-node": book.parserAttempts["epubts-node"] ?? notImplemented(),
    "storyteller-node":
      book.parserAttempts["storyteller-node"] ?? notImplemented(),
  };
  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    book: {
      root: book.root,
      relativePath: book.relativePath,
      size: book.size,
      sha256: book.sha256,
      shortSha: book.shortSha,
    },
    parsers,
    comparison: compareMetadata(
      metadataFor(parsers["epubts-browser"]),
      metadataFor(parsers["epubts-node"]),
      metadataFor(parsers["storyteller-node"])
    ),
  };
}

function compareMetadata(
  browser: MetadataFields | null,
  node: MetadataFields | null,
  storyteller: MetadataFields | null
): MetadataComparison {
  const storytellerAvailable = storyteller !== null;
  return {
    title: compareField(browser?.title ?? null, node?.title ?? null, storytellerAvailable, storyteller?.title ?? null),
    creator: compareField(browser?.creator ?? null, node?.creator ?? null, storytellerAvailable, storyteller?.creator ?? null),
    date: compareField(browser?.date ?? null, node?.date ?? null, storytellerAvailable, storyteller?.date ?? null),
  };
}

function compareField(
  browser: string | null,
  node: string | null,
  storytellerAvailable: boolean,
  storyteller: string | null
): FieldComparison {
  if (!storytellerAvailable) {
    if (browser === null && node === null) return { status: "unavailable" };
    return browser === node
      ? { status: "browser-node-agree", browser, node }
      : { status: "browser-node-differ", browser, node };
  }
  if (browser === node && node === storyteller) return { status: "all-agree", browser, node, storyteller };
  if (browser === storyteller) return { status: "node-differs", browser, node, storyteller };
  if (browser === node) return { status: "storyteller-differs", browser, node, storyteller };
  if (node === storyteller) return { status: "browser-differs", browser, node, storyteller };
  return { status: "all-differ", browser, node, storyteller };
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
    `- epubts-node opened via jsdom fallback: ${countDOMParserImpl(run, "jsdom")}`,
    `- epubts-node open-failed: ${countNode(run, "node-open-failed")}`,
    `- storyteller opened: ${countStoryteller(run, "storyteller-opened")}`,
    `- storyteller open-failed: ${countStoryteller(run, "storyteller-open-failed")}`,
    "",
    "## Metadata field multiplicity",
    "",
    "| Parser | Field | unavailable | missing | present |",
    "|---|---|---:|---:|---:|",
    ...PARSER_NAMES.flatMap((parser) =>
      (["title", "creator", "date"] as const).map((field) => {
        const counts = run.metadataHistogram[parser][field];
        return `| ${parser} | ${field} | ${counts.unavailable} | ${counts.missing} | ${counts.present} |`;
      })
    ),
    "",
    "## Metadata comparison",
    "",
    "| Status | title | creator | date |",
    "|---|---:|---:|---:|",
    ...(["all-agree", "node-differs", "storyteller-differs", "browser-differs",
         "all-differ", "browser-node-agree", "browser-node-differ", "unavailable"] as const).map((status) => {
      return `| ${status} | ${run.comparisonHistogram.title[status]} | ${run.comparisonHistogram.creator[status]} | ${run.comparisonHistogram.date[status]} |`;
    }),
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
    if (browserAttempt.status === "transported" && browserAttempt.open.status === "opened") {
      validateMetadata(browserAttempt.open.metadata, book.report);
    }
    const nodeAttempt = parsed.parsers["epubts-node"];
    if (
      nodeAttempt.status !== "node-opened" &&
      nodeAttempt.status !== "node-open-failed"
    ) {
      throw new Error(`Missing node open outcome: ${book.report}`);
    }
    if (
      nodeAttempt.status === "node-opened" &&
      nodeAttempt.engine !== "linkedom" &&
      nodeAttempt.engine !== "jsdom"
    ) {
      throw new Error(`Missing node engine: ${book.report}`);
    }
    if (nodeAttempt.status === "node-opened") validateMetadata(nodeAttempt.metadata, book.report);
    const storytellerAttempt = parsed.parsers["storyteller-node"];
    if (
      storytellerAttempt.status !== "storyteller-opened" &&
      storytellerAttempt.status !== "storyteller-open-failed"
    ) {
      throw new Error(`Missing storyteller open outcome: ${book.report}`);
    }
    if (storytellerAttempt.status === "storyteller-opened") {
      validateMetadata(storytellerAttempt.metadata, book.report);
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

function validateMetadata(metadata: MetadataFields, report: string): void {
  if (metadata.title !== null && typeof metadata.title !== "string") {
    throw new Error(`Invalid metadata title: ${report}`);
  }
  if (metadata.creator !== null && typeof metadata.creator !== "string") {
    throw new Error(`Invalid metadata creator: ${report}`);
  }
  if (metadata.date !== null && typeof metadata.date !== "string") {
    throw new Error(`Invalid metadata date: ${report}`);
  }
}

function buildMetadataHistogram(
  books: HashedBook[]
): RunReport["metadataHistogram"] {
  const histogram = Object.fromEntries(PARSER_NAMES.map((parser) => [
    parser,
    Object.fromEntries((["title", "creator", "date"] as const).map((field) => [
      field,
      { unavailable: 0, missing: 0, present: 0 },
    ])),
  ])) as RunReport["metadataHistogram"];

  for (const book of books) {
    for (const parser of PARSER_NAMES) {
      const metadata = metadataFor(book.parserAttempts[parser]);
      for (const field of ["title", "creator", "date"] as const) {
        const counts = histogram[parser][field];
        if (!metadata) counts.unavailable++;
        else if (metadata[field] === null) counts.missing++;
        else counts.present++;
      }
    }
  }
  return histogram;
}

function buildComparisonHistogram(
  observations: BookObservation[]
): RunReport["comparisonHistogram"] {
  const statuses: FieldComparison["status"][] = [
    "all-agree", "node-differs", "storyteller-differs", "browser-differs",
    "all-differ", "browser-node-agree", "browser-node-differ", "unavailable",
  ];
  const histogram = Object.fromEntries(
    (["title", "creator", "date"] as const).map((field) => [
      field,
      Object.fromEntries(statuses.map((s) => [s, 0])),
    ])
  ) as RunReport["comparisonHistogram"];

  for (const obs of observations) {
    for (const field of ["title", "creator", "date"] as const) {
      histogram[field][obs.comparison[field].status]++;
    }
  }
  return histogram;
}

function metadataFor(attempt: ParserPathAttempt | undefined): MetadataFields | null {
  if (!attempt) return null;
  if (attempt.status === "transported" && attempt.open.status === "opened") return attempt.open.metadata;
  if (attempt.status === "node-opened" || attempt.status === "storyteller-opened") return attempt.metadata;
  return null;
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

function nodeEngineUsed(observation: BookObservation): DOMParserImpl | null {
  const node = observation.parsers["epubts-node"];
  return node.status === "node-opened" ? node.engine : null;
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

function countDOMParserImpl(run: RunReport, engine: DOMParserImpl): number {
  return run.books.filter((book) => book.nodeEngine === engine).length;
}

function countStoryteller(
  run: RunReport,
  status: StorytellerOpenOutcome["status"]
): number {
  return run.books.filter(
    (book) => book.parserStates["storyteller-node"] === status
  ).length;
}

const COMPARISON_DISAGREEMENT_STATUSES = new Set<FieldComparison["status"]>([
  "node-differs", "storyteller-differs", "browser-differs", "all-differ", "browser-node-differ",
]);

function hasMetadataDisagreement(comparison: MetadataComparison): boolean {
  return (
    COMPARISON_DISAGREEMENT_STATUSES.has(comparison.title.status) ||
    COMPARISON_DISAGREEMENT_STATUSES.has(comparison.creator.status) ||
    COMPARISON_DISAGREEMENT_STATUSES.has(comparison.date.status)
  );
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
  const nodeFallback =
    node.status === "node-opened" && node.engine === "jsdom";
  if (
    attempt.status === "transport-failed" ||
    browserOpenFailed ||
    (attempt.status === "transported" && attempt.diagnostics.length > 0) ||
    node.status === "node-open-failed" ||
    nodeFallback ||
    storyteller.status === "storyteller-open-failed" ||
    hasMetadataDisagreement(observation.comparison)
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
    lines.push(`- Node parser engine: ${node.engine}`);
    if (node.engine === "jsdom") {
      lines.push(
        "- Note: opened via jsdom fallback (LinkeDOM hung on this book)"
      );
    }
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

  if (hasMetadataDisagreement(observation.comparison)) {
    lines.push("", "## Metadata disagreement", "");
    for (const field of ["title", "creator", "date"] as const) {
      const fc = observation.comparison[field];
      if (!COMPARISON_DISAGREEMENT_STATUSES.has(fc.status)) continue;
      lines.push(`### ${field} (${fc.status})`, "");
      switch (fc.status) {
        case "node-differs":
        case "storyteller-differs":
        case "browser-differs":
        case "all-differ":
          lines.push(`- browser: ${formatValue(fc.browser)}`, `- node: ${formatValue(fc.node)}`, `- storyteller: ${formatValue(fc.storyteller)}`);
          break;
        case "browser-node-differ":
          lines.push(`- browser: ${formatValue(fc.browser)}`, `- node: ${formatValue(fc.node)}`, `- storyteller: unavailable`);
          break;
      }
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function formatValue(value: string | null): string {
  return value === null ? "(null)" : JSON.stringify(value);
}

export function reportPathForDisplay(): string {
  return relative(process.cwd(), REPORTS_DIRECTORY) || ".";
}
