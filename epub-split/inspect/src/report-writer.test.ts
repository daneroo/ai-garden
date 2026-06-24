import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildInventory, type HashedOccurrence } from "./corpus.ts";
import {
  comparisonResultSchema,
  parserOutputSchema,
  type ComparisonResult,
  type ParserName,
  type ParserOutput,
} from "./schema.ts";
import {
  writeReport,
  type ParserPair,
  type ReportInput,
  type RunProvenance,
} from "./report-writer.ts";

// 64-char content hashes for five distinct books.
const SHA = {
  happy: "a".repeat(64),
  entity: "b".repeat(64),
  epub2: "c".repeat(64),
  failed: "d".repeat(64),
  jsdom: "e".repeat(64),
};

// 'entity' appears in both space and drop (deduped under drop).
const OCCURRENCES: HashedOccurrence[] = [
  { root: "test", relativePath: "happy.epub", size: 100, sha256: SHA.happy },
  { root: "space", relativePath: "Travis Baldree - Legends/Legends.epub", size: 200, sha256: SHA.entity },
  { root: "space", relativePath: "Ancient Tome.epub", size: 300, sha256: SHA.epub2 },
  { root: "space", relativePath: "Broken Book.epub", size: 400, sha256: SHA.failed },
  { root: "drop", relativePath: "dupes/Legends copy.epub", size: 200, sha256: SHA.entity },
  { root: "drop", relativePath: "Hangs On Linkedom.epub", size: 500, sha256: SHA.jsdom },
];

function metadata(title: string | null, creator: string | null, date: string | null) {
  return { title, creator, date };
}

function opened(
  parser: ParserName,
  version: string,
  md: ReturnType<typeof metadata>,
  domParser?: "linkedom" | "jsdom"
): ParserOutput {
  return parserOutputSchema.parse({
    schemaVersion: 1,
    meta: { parser, parserVersion: version, openStatus: "opened", ...(domParser ? { domParser } : {}) },
    content: { metadata: md },
  });
}

function openFailed(parser: ParserName, version: string): ParserOutput {
  return parserOutputSchema.parse({
    schemaVersion: 1,
    meta: {
      parser,
      parserVersion: version,
      openStatus: "open-failed",
      openFailure: { category: "EocdNotFound", message: "EOCD not found" },
    },
  });
}

function epub2Unsupported(parser: ParserName, version: string): ParserOutput {
  return parserOutputSchema.parse({
    schemaVersion: 1,
    meta: { parser, parserVersion: version, openStatus: "epub2-unsupported" },
  });
}

function field(status: string, a: string | null, b: string | null) {
  return { status, a, b };
}

function comparison(
  a: ParserName,
  b: ParserName,
  fields: { title: ReturnType<typeof field>; creator: ReturnType<typeof field>; date: ReturnType<typeof field> }
): ComparisonResult {
  return comparisonResultSchema.parse({ schemaVersion: 1, parserA: a, parserB: b, metadata: fields });
}

const NODE = "epubts-node";
const BROWSER = "epubts-browser";
const STORY = "storyteller";

const parserOutputs = new Map<string, Map<ParserName, ParserOutput>>();
function put(sha: string, parser: ParserName, output: ParserOutput): void {
  const existing = parserOutputs.get(sha) ?? new Map<ParserName, ParserOutput>();
  existing.set(parser, output);
  parserOutputs.set(sha, existing);
}

const happyMd = metadata("Happy Path", "Ada Lovelace", "2020");
put(SHA.happy, NODE, opened(NODE, "0.6.7", happyMd, "linkedom"));
put(SHA.happy, BROWSER, opened(BROWSER, "0.6.7", happyMd));
put(SHA.happy, STORY, opened(STORY, "0.6.2", happyMd));

// LinkeDOM truncates the title at '&' on the node path only.
put(SHA.entity, NODE, opened(NODE, "0.6.7", metadata("Legends", "Travis Baldree", "2022"), "linkedom"));
put(SHA.entity, BROWSER, opened(BROWSER, "0.6.7", metadata("Legends & Lattes", "Travis Baldree", "2022")));
put(SHA.entity, STORY, opened(STORY, "0.6.2", metadata("Legends & Lattes", "Travis Baldree", "2022")));

const tomeMd = metadata("Ancient Tome", "Old Author", "1999");
put(SHA.epub2, NODE, opened(NODE, "0.6.7", tomeMd, "linkedom"));
put(SHA.epub2, BROWSER, opened(BROWSER, "0.6.7", tomeMd));
put(SHA.epub2, STORY, epub2Unsupported(STORY, "0.6.2"));

put(SHA.failed, NODE, openFailed(NODE, "0.6.7"));
put(SHA.failed, BROWSER, openFailed(BROWSER, "0.6.7"));
put(SHA.failed, STORY, openFailed(STORY, "0.6.2"));

const hangMd = metadata("Hang Book", "Lin Dom", "2010");
put(SHA.jsdom, NODE, opened(NODE, "0.6.7", hangMd, "jsdom"));
put(SHA.jsdom, BROWSER, opened(BROWSER, "0.6.7", hangMd));
put(SHA.jsdom, STORY, opened(STORY, "0.6.2", hangMd));

const NODE_BROWSER = "epubts-node--epubts-browser";
const NODE_STORY = "epubts-node--storyteller";

const comparisons = new Map<string, Map<string, ComparisonResult>>();
function compare(sha: string, key: string, result: ComparisonResult): void {
  const existing = comparisons.get(sha) ?? new Map<string, ComparisonResult>();
  existing.set(key, result);
  comparisons.set(sha, existing);
}

const agreeHappy = { title: field("agree", "Happy Path", "Happy Path"), creator: field("agree", "Ada Lovelace", "Ada Lovelace"), date: field("agree", "2020", "2020") };
compare(SHA.happy, NODE_BROWSER, comparison(NODE, BROWSER, agreeHappy));
compare(SHA.happy, NODE_STORY, comparison(NODE, STORY, agreeHappy));

const entityNB = { title: field("differ", "Legends", "Legends & Lattes"), creator: field("agree", "Travis Baldree", "Travis Baldree"), date: field("agree", "2022", "2022") };
compare(SHA.entity, NODE_BROWSER, comparison(NODE, BROWSER, entityNB));
compare(SHA.entity, NODE_STORY, comparison(NODE, STORY, entityNB));

const tomeNB = { title: field("agree", "Ancient Tome", "Ancient Tome"), creator: field("agree", "Old Author", "Old Author"), date: field("agree", "1999", "1999") };
compare(SHA.epub2, NODE_BROWSER, comparison(NODE, BROWSER, tomeNB));
// no node--storyteller comparison for epub2: storyteller did not open it.

const hangAgree = { title: field("agree", "Hang Book", "Hang Book"), creator: field("agree", "Lin Dom", "Lin Dom"), date: field("agree", "2010", "2010") };
compare(SHA.jsdom, NODE_BROWSER, comparison(NODE, BROWSER, hangAgree));
compare(SHA.jsdom, NODE_STORY, comparison(NODE, STORY, hangAgree));

const PROVENANCE: RunProvenance = {
  runner: { name: "epub-inspect", version: "0.1.0", bun: "1.3.14" },
  packages: { epubts: "0.6.7", storyteller: "0.6.2", playwright: "1.61.0" },
  browser: { name: "chromium", version: "149.0.7827.55" },
};

const PAIRS: ParserPair[] = [
  { a: NODE, b: BROWSER },
  { a: NODE, b: STORY },
];

const INPUT: ReportInput = {
  provenance: PROVENANCE,
  inventory: buildInventory(["test", "space", "drop"], OCCURRENCES),
  ranParsers: [BROWSER, NODE, STORY],
  pairs: PAIRS,
  parserOutputs,
  comparisons,
};

async function readTree(dir: string): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  async function walk(rel: string): Promise<void> {
    const entries = await readdir(join(dir, rel), { withFileTypes: true });
    for (const entry of entries.sort((l, r) => l.name.localeCompare(r.name, "en"))) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await walk(childRel);
      else out.set(childRel, await readFile(join(dir, childRel), "utf8"));
    }
  }
  await walk("");
  return out;
}

const workDir = await mkdtemp(join(tmpdir(), "epub-validate-report-"));
const reportsDir = join(workDir, "reports");
await writeReport(reportsDir, INPUT);
const firstTree = await readTree(reportsDir);
await writeReport(reportsDir, INPUT);
const secondTree = await readTree(reportsDir);

afterAll(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function file(name: string): string {
  const contents = firstTree.get(name);
  if (contents === undefined) {
    throw new Error(`expected report file not written: ${name}`);
  }
  return contents;
}

describe("writeReport — determinism", () => {
  test("two writes of the same input are byte-identical", () => {
    expect([...secondTree.entries()].sort()).toEqual([...firstTree.entries()].sort());
  });
});

describe("writeReport — on-disk layout", () => {
  test("content-addressed parser outputs, one per (sha, parser)", () => {
    expect(firstTree.has(`parsers/${SHA.happy}/epubts-node.json`)).toBe(true);
    expect(firstTree.has(`parsers/${SHA.happy}/epubts-browser.json`)).toBe(true);
    expect(firstTree.has(`parsers/${SHA.happy}/storyteller.json`)).toBe(true);
    // epub2-unsupported and open-failed are still valid outputs and are written.
    expect(firstTree.has(`parsers/${SHA.epub2}/storyteller.json`)).toBe(true);
    expect(firstTree.has(`parsers/${SHA.failed}/storyteller.json`)).toBe(true);
  });

  test("comparisons written only for opened pairs", () => {
    expect(firstTree.has(`comparisons/${SHA.entity}/${NODE_BROWSER}.json`)).toBe(true);
    expect(firstTree.has(`comparisons/${SHA.entity}/${NODE_STORY}.json`)).toBe(true);
    // storyteller never opened the epub2 book -> no node--storyteller comparison.
    expect(firstTree.has(`comparisons/${SHA.epub2}/${NODE_STORY}.json`)).toBe(false);
  });

  test("a detail page is written only for a mismatching book", () => {
    expect(firstTree.has(`details/${SHA.entity}.md`)).toBe(true);
    expect(firstTree.has(`details/${SHA.happy}.md`)).toBe(false);
    expect(firstTree.has(`details/${SHA.failed}.md`)).toBe(false);
  });

  test("one pair report per active pair", () => {
    expect(firstTree.has(`${NODE_BROWSER}.md`)).toBe(true);
    expect(firstTree.has(`${NODE_STORY}.md`)).toBe(true);
  });
});

describe("writeReport — index.md", () => {
  const index = () => file("index.md");

  test("corpora discovery table follows scan order", () => {
    expect(index()).toContain("| test | 1 | 0 | 1 |");
    expect(index()).toContain("| space | 3 | 0 | 3 |");
    expect(index()).toContain("| drop | 2 | 1 | 1 |");
    expect(index()).toContain("| total | 6 | 1 | 5 |");
  });

  test("per-parser open outcomes are distinct-book counts", () => {
    expect(index()).toContain("| epubts-browser | 4 | 1 | 0 | 0 |");
    expect(index()).toContain("| epubts-node | 4 | 1 | 0 | 1 |");
    expect(index()).toContain("| storyteller | 3 | 1 | 1 | 0 |");
  });

  test("genuine open failures name the book and parsers explicitly", () => {
    expect(index()).toContain("Broken Book.epub");
    expect(index()).toContain("epubts-node (EocdNotFound)");
  });

  test("links to each pair report", () => {
    expect(index()).toContain(`[epubts-node vs epubts-browser](${NODE_BROWSER}.md)`);
    expect(index()).toContain(`[epubts-node vs storyteller](${NODE_STORY}.md)`);
  });
});

describe("writeReport — pair reports", () => {
  test("node-vs-browser both-opened denominator and title mismatch are distinct-book counts", () => {
    const report = file(`${NODE_BROWSER}.md`);
    expect(report).toContain("both-opened (distinct books): 4");
    // title: agree 3 (happy+epub2+jsdom), differ 1 (entity — 1 distinct book)
    expect(report).toContain("| title | 3 | 1 | 0 | 0 | 0 | 1 |");
  });

  test("node-vs-storyteller records the epub2 book as not-compared", () => {
    const report = file(`${NODE_STORY}.md`);
    expect(report).toContain("both-opened (distinct books): 3");
    expect(report).toContain("| storyteller not opened | 1 |");
  });

  test("mismatch list names parsers explicitly and links the detail", () => {
    const report = file(`${NODE_BROWSER}.md`);
    expect(report).toContain(`](details/${SHA.entity}.md)`);
    expect(report).toContain("title: epubts-node ≠ epubts-browser");
  });
});

describe("writeReport — detail page", () => {
  test("shows side-by-side values and an explicit verdict", () => {
    const detail = file(`details/${SHA.entity}.md`);
    expect(detail).toContain("## epubts-node vs epubts-browser");
    expect(detail).toContain('"Legends"');
    expect(detail).toContain('"Legends & Lattes"');
    expect(detail).toContain("epubts-node ≠ epubts-browser");
  });
});

describe("writeReport — determinism guards", () => {
  test("run.json carries no wall-clock value", () => {
    const manifest = file("run.json");
    expect(manifest).not.toMatch(/\d{2}:\d{2}:\d{2}/);
    expect(JSON.parse(manifest).parsers).toEqual({
      ran: [BROWSER, NODE, STORY],
      notRun: [],
    });
  });

  test("no machine paths leak into any file", () => {
    for (const contents of firstTree.values()) {
      expect(contents).not.toContain("/Users/");
      expect(contents).not.toContain("/Volumes/");
    }
  });
});
