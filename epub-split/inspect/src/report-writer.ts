import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { CorpusEntry, CorpusInventory } from "./corpus.ts";
import {
  parserNameSchema,
  type ComparisonResult,
  type ParserName,
  type ParserOutput,
} from "./schema.ts";
import type { RootName } from "./types.ts";

// The report writer owns the on-disk layout. It is complete in Gate 2 so the
// adapters (Gates 3–5) and the comparator (Gate 6) only feed it data — they
// never touch file structure or rendering. Everything is content-addressed by
// sha256; occurrence-vs-distinct lives only in the inventory it is given.
//
// Determinism is a hard requirement: no timestamp, hostname, or run-instant is
// written anywhere, and every listing is deterministically ordered (roots in
// scan order, books by filename, entries by sha256), so two writes of the same
// input are byte-identical.

export const RUN_MANIFEST_SCHEMA_VERSION = 1;

const METADATA_FIELDS = ["title", "creator", "date"] as const;
type MetadataField = (typeof METADATA_FIELDS)[number];

export interface RunProvenance {
  runner: { name: string; version: string; bun: string };
  // storyteller and playwright are absent until their adapters land (Gates 4–5).
  packages: { epubts: string; storyteller?: string; playwright?: string };
  // Absent until the browser adapter lands in Gate 4.
  browser?: { name: string; version: string };
}

export interface ParserPair {
  a: ParserName;
  b: ParserName;
}

export interface ReportInput {
  provenance: RunProvenance;
  inventory: CorpusInventory;
  // Parsers actually run this invocation. Any configured parser not listed is
  // rendered as `not-run` (the partial-runner state of Gates 3–5).
  ranParsers: readonly ParserName[];
  pairs: readonly ParserPair[];
  // Content-addressed: sha256 -> parser -> output. Parsed once per distinct
  // content, so there is exactly one output per (sha256, parser).
  parserOutputs: ReadonlyMap<string, ReadonlyMap<ParserName, ParserOutput>>;
  // Content-addressed: sha256 -> "<a>--<b>" -> result. Present only for books
  // both parsers opened; empty until the comparator lands in Gate 6.
  comparisons: ReadonlyMap<string, ReadonlyMap<string, ComparisonResult>>;
}

export function pairKey(pair: ParserPair): string {
  return `${pair.a}--${pair.b}`;
}

// ── public entry point ──────────────────────────────────────────────────────

export async function writeReport(
  outputDir: string,
  input: ReportInput
): Promise<void> {
  const tempDir = `${outputDir}.next`;
  const backupDir = `${outputDir}.previous`;

  await rm(tempDir, { recursive: true, force: true });
  await mkdir(tempDir, { recursive: true });

  const files = renderFiles(input);
  for (const [relativePath, contents] of files) {
    const target = join(tempDir, relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, contents, "utf8");
  }

  assertNoMachinePaths(files);
  await swapIntoPlace(outputDir, tempDir, backupDir);
}

// ── rendering (pure: input -> ordered map of relative path -> file contents) ──

function renderFiles(input: ReportInput): Map<string, string> {
  const files = new Map<string, string>();

  files.set("run.json", `${json(buildManifest(input))}\n`);
  files.set("index.md", renderIndex(input));

  for (const entry of input.inventory.entries) {
    const outputs = input.parserOutputs.get(entry.sha256);
    if (outputs) {
      for (const [parser, output] of sortedByParser(outputs)) {
        files.set(`parsers/${entry.sha256}/${parser}.json`, `${json(output)}\n`);
      }
    }
    const comparisons = input.comparisons.get(entry.sha256);
    if (comparisons) {
      for (const [key, result] of sortedByKey(comparisons)) {
        files.set(
          `comparisons/${entry.sha256}/${key}.json`,
          `${json(result)}\n`
        );
      }
    }
    if (entryHasMismatch(input, entry.sha256)) {
      files.set(`details/${entry.sha256}.md`, renderDetail(input, entry));
    }
  }

  for (const pair of activePairs(input)) {
    files.set(`${pairKey(pair)}.md`, renderPairReport(input, pair));
  }

  return files;
}

function buildManifest(input: ReportInput): unknown {
  const universe = parserNameSchema.options;
  return {
    schemaVersion: RUN_MANIFEST_SCHEMA_VERSION,
    runner: input.provenance.runner,
    packages: input.provenance.packages,
    browser: input.provenance.browser,
    parsers: {
      ran: universe.filter((parser) => input.ranParsers.includes(parser)),
      notRun: universe.filter((parser) => !input.ranParsers.includes(parser)),
    },
    pairs: input.pairs.map((pair) => ({ a: pair.a, b: pair.b })),
    roots: input.inventory.roots,
    inventory: input.inventory.entries,
  };
}

function renderIndex(input: ReportInput): string {
  const { provenance, inventory } = input;
  const universe = parserNameSchema.options;
  const occurrences = totalOccurrences(inventory);

  const lines: string[] = [
    "# EPUB Validate Report",
    "",
    `- Run manifest schema: ${RUN_MANIFEST_SCHEMA_VERSION}`,
    `- Runner: ${provenance.runner.name} ${provenance.runner.version}`,
    `- Bun: ${provenance.runner.bun}`,
    `- Chromium: ${provenance.browser?.version ?? "not-run"}`,
    `- epub.ts: ${provenance.packages.epubts}`,
    `- Storyteller: ${provenance.packages.storyteller ?? "not-run"}`,
    `- Playwright: ${provenance.packages.playwright ?? "not-run"}`,
    `- Occurrences: ${occurrences}`,
    `- Distinct content: ${inventory.entries.length}`,
    "",
    "## Corpora discovery",
    "",
    "deduped = sha256 already seen earlier in scan order (test, space, drop).",
    "",
    "| root | found | deduped | distinct |",
    "|---|---:|---:|---:|",
    ...inventory.roots.map(
      (root) =>
        `| ${root.name} | ${root.found} | ${root.deduped} | ${root.distinct} |`
    ),
    `| total | ${sumBy(inventory.roots, (r) => r.found)} | ${sumBy(
      inventory.roots,
      (r) => r.deduped
    )} | ${sumBy(inventory.roots, (r) => r.distinct)} |`,
    "",
    "## Parser open outcomes",
    "",
    `Distinct-content denominator: ${inventory.entries.length}.`,
    "",
    "| parser | opened | open-failed | epub2-unsupported | jsdom fallback |",
    "|---|---:|---:|---:|---:|",
  ];

  for (const parser of universe) {
    if (!input.ranParsers.includes(parser)) {
      lines.push(`| ${parser} | not-run | not-run | not-run | not-run |`);
      continue;
    }
    const counts = parserCounts(input, parser);
    lines.push(
      `| ${parser} | ${counts.opened} | ${counts.openFailed} | ${counts.epub2Unsupported} | ${counts.jsdomFallback} |`
    );
  }

  lines.push("", "## Open failures", "");
  lines.push(
    "Genuine open failures only; epub2-unsupported is expected and excluded.",
    ""
  );
  const failureLines = renderOpenFailures(input);
  lines.push(...(failureLines.length > 0 ? failureLines : ["None."]));

  lines.push("", "## Comparison pairs", "");
  const pairs = activePairs(input);
  if (pairs.length === 0) {
    lines.push("None (fewer than two parsers run).");
  } else {
    for (const pair of pairs) {
      lines.push(`- [${pair.a} vs ${pair.b}](${pairKey(pair)}.md)`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function renderOpenFailures(input: ReportInput): string[] {
  const lines: string[] = [];
  for (const [root, entries] of groupByRoot(input)) {
    const failed = entries.filter((entry) =>
      input.ranParsers.some(
        (parser) =>
          parserOutput(input, entry.sha256, parser)?.meta.openStatus ===
          "open-failed"
      )
    );
    if (failed.length === 0) continue;
    lines.push(`### ${root}`, "");
    for (const entry of failed) {
      const reasons = input.ranParsers
        .map((parser) => {
          const output = parserOutput(input, entry.sha256, parser);
          if (output?.meta.openStatus !== "open-failed") return null;
          return `${parser} (${output.meta.openFailure?.category ?? "unknown"})`;
        })
        .filter((value): value is string => value !== null);
      lines.push(`- ${displayName(entry)} — ${reasons.join(", ")}`);
    }
    lines.push("");
  }
  if (lines.length > 0) lines.pop(); // trailing spacer
  return lines;
}

function renderPairReport(input: ReportInput, pair: ParserPair): string {
  const key = pairKey(pair);
  const histogram: Record<MetadataField, Record<string, number>> = {
    title: emptyStatusCounts(),
    creator: emptyStatusCounts(),
    date: emptyStatusCounts(),
  };
  let bothOpened = 0;
  let aNotOpened = 0;
  let bNotOpened = 0;
  let neitherOpened = 0;
  let spineAgree = 0;
  let spineDiffer = 0;
  let manifestAgree = 0;
  let manifestDiffer = 0;
  let spineHashAgree = 0;
  let spineHashDiffer = 0;

  for (const entry of input.inventory.entries) {
    const aOpened = isOpened(input, entry.sha256, pair.a);
    const bOpened = isOpened(input, entry.sha256, pair.b);
    if (aOpened && bOpened) {
      bothOpened += 1;
      const result = input.comparisons.get(entry.sha256)?.get(key);
      if (result) {
        for (const field of METADATA_FIELDS) {
          const status = result.metadata[field].status;
          const counts = histogram[field];
          counts[status] = (counts[status] ?? 0) + 1;
        }
        if (result.spine.status === "agree") spineAgree += 1;
        else spineDiffer += 1;
        if (result.manifest.status === "agree") manifestAgree += 1;
        else manifestDiffer += 1;
        if (result.spineHashes.status === "agree") spineHashAgree += 1;
        else spineHashDiffer += 1;
      }
    } else if (!aOpened && !bOpened) {
      neitherOpened += 1;
    } else if (!aOpened) {
      aNotOpened += 1;
    } else {
      bNotOpened += 1;
    }
  }

  const lines: string[] = [
    `# ${pair.a} vs ${pair.b}`,
    "",
    `- parserA: ${pair.a}`,
    `- parserB: ${pair.b}`,
    `- both-opened (distinct books): ${bothOpened}`,
    "",
    "## Per-field outcomes",
    "",
    "mismatch = differ + a-only + b-only.",
    "",
    "| field | agree | differ | a-only | b-only | both-null | mismatch |",
    "|---|---:|---:|---:|---:|---:|---:|",
    ...METADATA_FIELDS.map((field) => {
      const c = histogram[field];
      const get = (status: string): number => c[status] ?? 0;
      const mismatch = get("differ") + get("a-only") + get("b-only");
      return `| ${field} | ${get("agree")} | ${get("differ")} | ${get(
        "a-only"
      )} | ${get("b-only")} | ${get("both-null")} | ${mismatch} |`;
    }),
    "",
    "## Spine comparison",
    "",
    "| status | distinct books |",
    "|---|---:|",
    `| agree | ${spineAgree} |`,
    `| differ | ${spineDiffer} |`,
    "",
    "## Manifest comparison",
    "",
    "| status | distinct books |",
    "|---|---:|",
    `| agree | ${manifestAgree} |`,
    `| differ | ${manifestDiffer} |`,
    "",
    "## Spine content hashes",
    "",
    "| status | distinct books |",
    "|---|---:|",
    `| agree | ${spineHashAgree} |`,
    `| differ | ${spineHashDiffer} |`,
    "",
    "## Not compared",
    "",
    "| reason | distinct books |",
    "|---|---:|",
    `| ${pair.a} not opened | ${aNotOpened} |`,
    `| ${pair.b} not opened | ${bNotOpened} |`,
    `| neither opened | ${neitherOpened} |`,
    "",
    "## Mismatches",
    "",
  ];

  const mismatchLines = renderPairMismatchList(input, pair);
  lines.push(...(mismatchLines.length > 0 ? mismatchLines : ["None."]));

  return `${lines.join("\n")}\n`;
}

function renderPairMismatchList(
  input: ReportInput,
  pair: ParserPair
): string[] {
  const key = pairKey(pair);
  const lines: string[] = [];
  for (const [root, entries] of groupByRoot(input)) {
    const mismatched = entries.filter((entry) => {
      const result = input.comparisons.get(entry.sha256)?.get(key);
      return result !== undefined && comparisonHasMismatch(result);
    });
    if (mismatched.length === 0) continue;
    lines.push(`### ${root}`, "");
    for (const entry of mismatched) {
      const result = input.comparisons.get(entry.sha256)?.get(key);
      if (!result) continue;
      const fields = METADATA_FIELDS.map((field) =>
        describeField(pair, field, result.metadata[field].status)
      ).filter((value): value is string => value !== null);
      if (result.spine.status === "differ") {
        fields.push(describeSpine(pair, result.spine));
      }
      if (result.manifest.status === "differ") {
        fields.push(describeManifest(pair, result.manifest));
      }
      if (result.spineHashes.status === "differ") {
        fields.push(describeSpineHashes(result.spineHashes));
      }
      lines.push(
        `- [${displayName(entry)}](details/${entry.sha256}.md) — ${fields.join("; ")}`
      );
    }
    lines.push("");
  }
  if (lines.length > 0) lines.pop();
  return lines;
}

function renderDetail(input: ReportInput, entry: CorpusEntry): string {
  const first = firstOccurrence(entry);
  const lines: string[] = [
    `# ${displayName(entry)}`,
    "",
    `- Root: ${first.root}`,
    `- SHA-256: ${entry.sha256}`,
    `- Occurrences: ${entry.occurrences.length}`,
    "",
  ];

  for (const occurrence of entry.occurrences) {
    lines.push(`  - ${occurrence.root}: ${occurrence.relativePath}`);
  }

  const comparisons = input.comparisons.get(entry.sha256);
  for (const pair of activePairs(input)) {
    const result = comparisons?.get(pairKey(pair));
    if (!result || !comparisonHasMismatch(result)) continue;
    lines.push(
      "",
      `## ${pair.a} vs ${pair.b}`,
      "",
      `| field | ${pair.a} | ${pair.b} | verdict |`,
      "|---|---|---|---|",
      ...METADATA_FIELDS.map((field) => {
        const cell = result.metadata[field];
        return `| ${field} | ${formatValue(cell.a)} | ${formatValue(
          cell.b
        )} | ${verdict(pair, cell.status)} |`;
      })
    );
    if (result.spine.status === "differ") {
      lines.push("", `### Spine`, "", describeSpineDetail(pair, result.spine));
    }
    if (result.manifest.status === "differ") {
      lines.push("", `### Manifest`, "", describeManifestDetail(pair, result.manifest));
    }
    if (result.spineHashes.status === "differ") {
      lines.push("", `### Spine content hashes`, "", describeSpineHashesDetail(result.spineHashes));
    }
  }

  return `${lines.join("\n")}\n`;
}

// ── helpers ─────────────────────────────────────────────────────────────────

interface ParserOutcomeCounts {
  opened: number;
  openFailed: number;
  epub2Unsupported: number;
  jsdomFallback: number;
}

function parserCounts(
  input: ReportInput,
  parser: ParserName
): ParserOutcomeCounts {
  const counts: ParserOutcomeCounts = {
    opened: 0,
    openFailed: 0,
    epub2Unsupported: 0,
    jsdomFallback: 0,
  };
  for (const entry of input.inventory.entries) {
    const output = parserOutput(input, entry.sha256, parser);
    if (!output) continue;
    switch (output.meta.openStatus) {
      case "opened":
        counts.opened += 1;
        if (output.meta.domParser === "jsdom") counts.jsdomFallback += 1;
        break;
      case "open-failed":
        counts.openFailed += 1;
        break;
      case "epub2-unsupported":
        counts.epub2Unsupported += 1;
        break;
    }
  }
  return counts;
}

function parserOutput(
  input: ReportInput,
  sha256: string,
  parser: ParserName
): ParserOutput | undefined {
  return input.parserOutputs.get(sha256)?.get(parser);
}

function isOpened(
  input: ReportInput,
  sha256: string,
  parser: ParserName
): boolean {
  return parserOutput(input, sha256, parser)?.meta.openStatus === "opened";
}

// A pair is active only when both its parsers ran this invocation. Comparison
// pairs that need a not-yet-implemented parser are simply not produced.
function activePairs(input: ReportInput): ParserPair[] {
  return input.pairs.filter(
    (pair) =>
      input.ranParsers.includes(pair.a) && input.ranParsers.includes(pair.b)
  );
}

function comparisonHasMismatch(result: ComparisonResult): boolean {
  if (result.spine.status === "differ") return true;
  if (result.manifest.status === "differ") return true;
  if (result.spineHashes.status === "differ") return true;
  return METADATA_FIELDS.some((field) => {
    const status = result.metadata[field].status;
    return status === "differ" || status === "a-only" || status === "b-only";
  });
}

function entryHasMismatch(input: ReportInput, sha256: string): boolean {
  const comparisons = input.comparisons.get(sha256);
  if (!comparisons) return false;
  for (const result of comparisons.values()) {
    if (comparisonHasMismatch(result)) return true;
  }
  return false;
}

// One human-readable clause for a spine mismatch in the mismatch list.
function describeSpine(
  pair: ParserPair,
  spine: ComparisonResult["spine"]
): string {
  if (spine.onlyInA.length === 0 && spine.onlyInB.length === 0) {
    return `spine: same hrefs, different order (${spine.countA} items)`;
  }
  const parts: string[] = [];
  if (spine.onlyInA.length > 0) parts.push(`${spine.onlyInA.length} only in ${pair.a}`);
  if (spine.onlyInB.length > 0) parts.push(`${spine.onlyInB.length} only in ${pair.b}`);
  return `spine: ${parts.join(", ")}`;
}

// Multi-line spine diff for detail pages.
function describeSpineDetail(pair: ParserPair, spine: ComparisonResult["spine"]): string {
  if (spine.onlyInA.length === 0 && spine.onlyInB.length === 0) {
    return `same hrefs, different order — ${spine.countA} items each`;
  }
  const lines: string[] = [];
  lines.push(`${pair.a}: ${spine.countA} items, ${pair.b}: ${spine.countB} items`);
  if (spine.onlyInA.length > 0) {
    lines.push("", `Only in ${pair.a}:`, ...spine.onlyInA.map((h) => `- ${h}`));
  }
  if (spine.onlyInB.length > 0) {
    lines.push("", `Only in ${pair.b}:`, ...spine.onlyInB.map((h) => `- ${h}`));
  }
  return lines.join("\n");
}

// One human-readable clause for a manifest mismatch in the mismatch list.
function describeManifest(
  pair: ParserPair,
  manifest: ComparisonResult["manifest"]
): string {
  const parts: string[] = [];
  if (manifest.onlyInA.length > 0) parts.push(`${manifest.onlyInA.length} only in ${pair.a}`);
  if (manifest.onlyInB.length > 0) parts.push(`${manifest.onlyInB.length} only in ${pair.b}`);
  if (parts.length === 0) return `manifest: counts differ (${manifest.countA} vs ${manifest.countB})`;
  return `manifest: ${parts.join(", ")}`;
}

// Multi-line manifest diff for detail pages.
function describeManifestDetail(pair: ParserPair, manifest: ComparisonResult["manifest"]): string {
  const lines: string[] = [];
  lines.push(`${pair.a}: ${manifest.countA} items, ${pair.b}: ${manifest.countB} items`);
  if (manifest.onlyInA.length > 0) {
    lines.push("", `Only in ${pair.a}:`, ...manifest.onlyInA.map((h) => `- ${h}`));
  }
  if (manifest.onlyInB.length > 0) {
    lines.push("", `Only in ${pair.b}:`, ...manifest.onlyInB.map((h) => `- ${h}`));
  }
  return lines.join("\n");
}

// One human-readable clause for a spine-hash mismatch in the mismatch list.
function describeSpineHashes(hashes: ComparisonResult["spineHashes"]): string {
  const total = hashes.matchCount + hashes.mismatchCount + hashes.nullCount;
  if (hashes.nullCount > 0) {
    return `spine-content: ${hashes.nullCount} item(s) unreadable of ${total}`;
  }
  return `spine-content: ${hashes.mismatchCount} hash mismatch(es) of ${total} items`;
}

function describeSpineHashesDetail(hashes: ComparisonResult["spineHashes"]): string {
  const total = hashes.matchCount + hashes.mismatchCount + hashes.nullCount;
  return [
    `${total} spine items: ${hashes.matchCount} match, ${hashes.mismatchCount} mismatch, ${hashes.nullCount} unreadable`,
  ].join("\n");
}

// One human-readable clause for a single field's outcome, naming the parsers
// explicitly. Returns null for the non-mismatch statuses (omitted from lists).
function describeField(
  pair: ParserPair,
  field: MetadataField,
  status: string
): string | null {
  switch (status) {
    case "differ":
      return `${field}: ${pair.a} ≠ ${pair.b}`;
    case "a-only":
      return `${field}: ${pair.a} only`;
    case "b-only":
      return `${field}: ${pair.b} only`;
    default:
      return null;
  }
}

// Short per-field verdict for the detail table, naming the parsers explicitly.
function verdict(pair: ParserPair, status: string): string {
  switch (status) {
    case "agree":
      return "agree";
    case "differ":
      return `${pair.a} ≠ ${pair.b}`;
    case "a-only":
      return `${pair.a} only`;
    case "b-only":
      return `${pair.b} only`;
    default:
      return "both null";
  }
}

function groupByRoot(input: ReportInput): Array<[RootName, CorpusEntry[]]> {
  const order = input.inventory.roots.map((root) => root.name);
  const groups = new Map<RootName, CorpusEntry[]>(
    order.map((name) => [name, []])
  );
  for (const entry of input.inventory.entries) {
    const root = firstOccurrence(entry).root;
    const bucket = groups.get(root);
    if (!bucket) throw new Error(`Entry root not in scan order: ${root}`);
    bucket.push(entry);
  }
  for (const bucket of groups.values()) {
    bucket.sort((left, right) =>
      firstOccurrence(left).relativePath.localeCompare(
        firstOccurrence(right).relativePath,
        "en"
      )
    );
  }
  return order.map((name) => [name, groups.get(name) ?? []]);
}

function firstOccurrence(entry: CorpusEntry): CorpusEntry["occurrences"][number] {
  const first = entry.occurrences[0];
  if (!first) throw new Error(`Corpus entry has no occurrences: ${entry.sha256}`);
  return first;
}

function displayName(entry: CorpusEntry): string {
  return firstOccurrence(entry).relativePath;
}

function emptyStatusCounts(): Record<string, number> {
  return { agree: 0, differ: 0, "a-only": 0, "b-only": 0, "both-null": 0 };
}

function totalOccurrences(inventory: CorpusInventory): number {
  return inventory.entries.reduce(
    (sum, entry) => sum + entry.occurrences.length,
    0
  );
}

function sumBy<T>(items: readonly T[], pick: (item: T) => number): number {
  return items.reduce((sum, item) => sum + pick(item), 0);
}

function sortedByParser(
  outputs: ReadonlyMap<ParserName, ParserOutput>
): Array<[ParserName, ParserOutput]> {
  return [...outputs.entries()].sort(([left], [right]) =>
    left.localeCompare(right, "en")
  );
}

function sortedByKey(
  results: ReadonlyMap<string, ComparisonResult>
): Array<[string, ComparisonResult]> {
  return [...results.entries()].sort(([left], [right]) =>
    left.localeCompare(right, "en")
  );
}

function formatValue(value: string | null): string {
  return value === null ? "(null)" : JSON.stringify(value);
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function assertNoMachinePaths(files: ReadonlyMap<string, string>): void {
  for (const contents of files.values()) {
    if (contents.includes("/Users/") || contents.includes("/Volumes/")) {
      throw new Error("Absolute machine path leaked into a report file");
    }
  }
}

async function swapIntoPlace(
  outputDir: string,
  tempDir: string,
  backupDir: string
): Promise<void> {
  await rm(backupDir, { recursive: true, force: true });
  const hadPrevious = await isDirectory(outputDir);
  if (hadPrevious) await rename(outputDir, backupDir);
  try {
    await rename(tempDir, outputDir);
  } catch (error) {
    if (hadPrevious) await rename(backupDir, outputDir);
    throw error;
  }
  await rm(backupDir, { recursive: true, force: true });
}

async function isDirectory(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined))?.isDirectory() ?? false;
}
