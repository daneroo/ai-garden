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
  HashedBook,
  RootInventory,
  RunReport,
} from "./types.ts";

const RUNNER_VERSION = "0.1.0";

export async function generateReports(
  books: HashedBook[],
  roots: RootInventory[]
): Promise<void> {
  await rm(TEMP_REPORTS_DIRECTORY, { recursive: true, force: true });
  await mkdir(join(TEMP_REPORTS_DIRECTORY, "books"), { recursive: true });
  await mkdir(join(TEMP_REPORTS_DIRECTORY, "details"), { recursive: true });

  const inventory: BookInventoryEntry[] = [];
  for (const book of books) {
    const observation = createBookObservation(book);
    const report = `books/${book.reportFilename}`;
    await writeJson(join(TEMP_REPORTS_DIRECTORY, report), observation);
    inventory.push({
      root: book.root,
      relativePath: book.relativePath,
      size: book.size,
      sha256: book.sha256,
      shortSha: book.shortSha,
      report,
      detail: null,
    });
  }

  const runReport: RunReport = {
    schemaVersion: REPORT_SCHEMA_VERSION,
    runner: {
      name: "epub-inspect",
      version: RUNNER_VERSION,
      bun: Bun.version,
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
      "epubts-browser": { status: "not-implemented" },
      "epubts-node": { status: "not-implemented" },
      "storyteller-node": { status: "not-implemented" },
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
    `- Books: ${run.books.length}`,
    "",
  ];

  for (const root of run.roots) {
    lines.push(`## ${root.name}`, "", `Books: ${root.count}`, "");
    lines.push("| SHA | Book | Parser state |", "|---|---|---|");
    for (const book of run.books.filter((entry) => entry.root === root.name)) {
      lines.push(
        `| ${book.shortSha} | [${escapeTable(book.relativePath)}](${book.report}) | not implemented |`
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
    const parsed = JSON.parse(await readFile(reportPath, "utf8")) as BookObservation;
    if (
      parsed.book.sha256 !== book.sha256 ||
      parsed.book.relativePath !== book.relativePath ||
      parsed.book.root !== book.root
    ) {
      throw new Error(`Book identity mismatch: ${book.report}`);
    }
    for (const parserName of PARSER_NAMES) {
      if (parsed.parsers[parserName]?.status !== "not-implemented") {
        throw new Error(`Missing parser placeholder: ${book.report} ${parserName}`);
      }
    }
  }

  const index = await readFile(join(TEMP_REPORTS_DIRECTORY, "index.md"), "utf8");
  for (const book of run.books) {
    if (!index.includes(`](${book.report})`)) {
      throw new Error(`Index does not link report: ${book.report}`);
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

export function reportPathForDisplay(): string {
  return relative(process.cwd(), REPORTS_DIRECTORY) || ".";
}
