import { join } from "node:path";

import { discoverInventory, type CorpusEntry } from "./corpus.ts";
import { INSPECT_DIRECTORY, REPORTS_DIRECTORY, ROOTS } from "./config.ts";
import { compareBook } from "./compare.ts";
import { BrowserTransport } from "./epubts-browser.ts";
import { openNode } from "./epubts-node.ts";
import { openStoryteller, STORYTELLER_VERSION } from "./storyteller.ts";
import { writeReport, pairKey, type ParserPair, type ReportInput, type RunProvenance } from "./report-writer.ts";
import type { ComparisonResult, ParserName, ParserOutput } from "./schema.ts";

if (process.argv.length > 2) {
  throw new Error("epub-inspect takes no arguments; every run processes all roots");
}

const runnerPkg = JSON.parse(
  await Bun.file(join(INSPECT_DIRECTORY, "package.json")).text()
) as { version: string };

console.error("Launching browser...");
const transport = await BrowserTransport.launch();

const provenance: RunProvenance = {
  runner: { name: "epub-inspect", version: runnerPkg.version, bun: Bun.version },
  packages: {
    epubts: transport.parserVersion,
    storyteller: STORYTELLER_VERSION,
    playwright: transport.playwrightVersion,
  },
  browser: { name: "chromium", version: transport.browserVersion },
};

console.error("Discovering corpus...");
const inventory = await discoverInventory(ROOTS);
const totalOcc = inventory.roots.reduce((sum, r) => sum + r.found, 0);
console.error(`  ${totalOcc} occurrences, ${inventory.entries.length} distinct books`);

const parserOutputs = new Map<string, Map<ParserName, ParserOutput>>();

console.error(`- epubts-node: ${inventory.entries.length} distinct books`);
for (let i = 0; i < inventory.entries.length; i++) {
  const entry = inventory.entries[i];
  if (!entry) throw new Error(`Missing inventory entry at index ${i}`);
  writeProgress("node", i + 1, inventory.entries.length, entry.occurrences[0]?.relativePath ?? "");
  const output = await openNode(entryAbsolutePath(entry));
  const map = parserOutputs.get(entry.sha256) ?? new Map<ParserName, ParserOutput>();
  map.set("epubts-node", output);
  parserOutputs.set(entry.sha256, map);
}
clearProgress();

console.error(`- epubts-browser: ${inventory.entries.length} distinct books`);
for (let i = 0; i < inventory.entries.length; i++) {
  const entry = inventory.entries[i];
  if (!entry) throw new Error(`Missing inventory entry at index ${i}`);
  writeProgress("browser", i + 1, inventory.entries.length, entry.occurrences[0]?.relativePath ?? "");
  const output = await transport.open(entryAbsolutePath(entry), entry.sha256, entry.size);
  const map = parserOutputs.get(entry.sha256) ?? new Map<ParserName, ParserOutput>();
  map.set("epubts-browser", output);
  parserOutputs.set(entry.sha256, map);
}
clearProgress();

await transport.close();

console.error(`- storyteller: ${inventory.entries.length} distinct books`);
for (let i = 0; i < inventory.entries.length; i++) {
  const entry = inventory.entries[i];
  if (!entry) throw new Error(`Missing inventory entry at index ${i}`);
  writeProgress("storyteller", i + 1, inventory.entries.length, entry.occurrences[0]?.relativePath ?? "");
  const output = await openStoryteller(entryAbsolutePath(entry));
  const map = parserOutputs.get(entry.sha256) ?? new Map<ParserName, ParserOutput>();
  map.set("storyteller", output);
  parserOutputs.set(entry.sha256, map);
}
clearProgress();

const PAIRS: readonly ParserPair[] = [
  { a: "epubts-node", b: "epubts-browser" },
  { a: "epubts-node", b: "storyteller" },
];

const comparisons = new Map<string, Map<string, ComparisonResult>>();
for (const entry of inventory.entries) {
  for (const pair of PAIRS) {
    const aOutput = parserOutputs.get(entry.sha256)?.get(pair.a);
    const bOutput = parserOutputs.get(entry.sha256)?.get(pair.b);
    if (aOutput?.meta.openStatus === "opened" && bOutput?.meta.openStatus === "opened") {
      const result = compareBook(aOutput, bOutput);
      const pairMap = comparisons.get(entry.sha256) ?? new Map<string, ComparisonResult>();
      pairMap.set(pairKey(pair), result);
      comparisons.set(entry.sha256, pairMap);
    }
  }
}

const input: ReportInput = {
  provenance,
  inventory,
  ranParsers: ["epubts-node", "epubts-browser", "storyteller"],
  pairs: PAIRS,
  parserOutputs,
  comparisons,
};

console.error("Writing reports...");
await writeReport(REPORTS_DIRECTORY, input);
console.log(`Wrote ${inventory.entries.length} books → ${REPORTS_DIRECTORY}`);

process.exit(0);

function entryAbsolutePath(entry: CorpusEntry): string {
  const occ = entry.occurrences[0];
  if (!occ) throw new Error(`Entry ${entry.sha256} has no occurrences`);
  const root = ROOTS.find((r) => r.name === occ.root);
  if (!root) throw new Error(`Root not found: ${occ.root}`);
  return join(root.path, occ.relativePath);
}

function writeProgress(label: string, current: number, total: number, path: string): void {
  if (!process.stderr.isTTY) {
    if (current === 1 || current === total || current % 100 === 0) {
      console.error(`  ${label}: ${current}/${total}`);
    }
    return;
  }
  const width = Math.max(20, (process.stderr.columns ?? 100) - 35);
  const name = path.length > width ? `${path.slice(0, Math.max(1, width - 1))}…` : path;
  process.stderr.write(`\r\x1b[2K${label} ${current}/${total} ${name}`);
}

function clearProgress(): void {
  if (process.stderr.isTTY) process.stderr.write("\r\x1b[2K");
}
