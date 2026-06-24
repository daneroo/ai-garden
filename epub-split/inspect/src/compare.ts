import {
  comparisonResultSchema,
  COMPARISON_RESULT_SCHEMA_VERSION,
  type ComparisonResult,
  type FieldComparison,
  type ManifestComparison,
  type ManifestItem,
  type ParserOutput,
  type SpineComparison,
  type SpineHashComparison,
  type SpineHashItem,
  type SpineItem,
} from "./schema.ts";

export function compareBook(a: ParserOutput, b: ParserOutput): ComparisonResult {
  if (!a.content || !b.content) {
    throw new Error("compareBook requires both outputs to be opened (content present)");
  }
  return comparisonResultSchema.parse({
    schemaVersion: COMPARISON_RESULT_SCHEMA_VERSION,
    parserA: a.meta.parser,
    parserB: b.meta.parser,
    metadata: {
      title: compareField(a.content.metadata.title, b.content.metadata.title),
      creator: compareField(a.content.metadata.creator, b.content.metadata.creator),
      date: compareField(a.content.metadata.date, b.content.metadata.date),
    },
    spine: compareSpine(a.content.spine, b.content.spine),
    manifest: compareManifest(a.content.manifest, b.content.manifest),
    spineHashes: compareSpineHashes(a.content.spineHashes, b.content.spineHashes),
  });
}

function compareField(a: string | null, b: string | null): FieldComparison {
  if (a !== null && b !== null) {
    return { status: a === b ? "agree" : "differ", a, b };
  }
  if (a !== null) return { status: "a-only", a, b: null };
  if (b !== null) return { status: "b-only", a: null, b };
  return { status: "both-null", a: null, b: null };
}

function compareSpine(a: SpineItem[], b: SpineItem[]): SpineComparison {
  const aHrefs = a.map((item) => item.href);
  const bHrefs = b.map((item) => item.href);
  const bSet = new Set(bHrefs);
  const aSet = new Set(aHrefs);
  const onlyInA = aHrefs.filter((href) => !bSet.has(href));
  const onlyInB = bHrefs.filter((href) => !aSet.has(href));
  const agree = aHrefs.length === bHrefs.length && aHrefs.every((href, i) => href === bHrefs[i]);
  return { status: agree ? "agree" : "differ", countA: aHrefs.length, countB: bHrefs.length, onlyInA, onlyInB };
}

function compareSpineHashes(a: SpineHashItem[], b: SpineHashItem[]): SpineHashComparison {
  const len = Math.max(a.length, b.length);
  let matchCount = 0;
  let mismatchCount = 0;
  for (let i = 0; i < len; i++) {
    // A missing position (one side shorter) is never a match. Only coalescing the
    // sentinel would conflate "no item here" with "item present but unreadable" — two
    // books that both genuinely fail the same item agree, but a missing position must
    // not. undefined !== any string, so the guard keeps the two cases distinct.
    const aHash = a[i]?.sha256;
    const bHash = b[i]?.sha256;
    if (aHash !== undefined && aHash === bHash) {
      matchCount += 1;
    } else {
      mismatchCount += 1;
    }
  }
  const agree = mismatchCount === 0 && a.length === b.length;
  return { status: agree ? "agree" : "differ", matchCount, mismatchCount };
}

function compareManifest(a: ManifestItem[], b: ManifestItem[]): ManifestComparison {
  const aHrefs = a.map((item) => item.href);
  const bHrefs = b.map((item) => item.href);
  const bSet = new Set(bHrefs);
  const aSet = new Set(aHrefs);
  const onlyInA = aHrefs.filter((href) => !bSet.has(href));
  const onlyInB = bHrefs.filter((href) => !aSet.has(href));
  const agree = aSet.size === bSet.size && aHrefs.every((href) => bSet.has(href));
  return { status: agree ? "agree" : "differ", countA: aHrefs.length, countB: bHrefs.length, onlyInA, onlyInB };
}

// ── Parity projection ────────────────────────────────────────────────────────
//
// The baseline (Gate 0A) recorded a three-parser comparison histogram using the
// legacy 8-way FieldComparison statuses. This projection collapses that 8-way
// histogram into the expected pairwise mismatch counts for each new pair
// (node×browser, node×storyteller) so Daniel can verify that a full corpus run
// produces matching numbers, confirming parity.
//
// Once parity is confirmed, `baseline/` is removed (git retains history).

export interface BaselineField {
  "all-agree": number;
  "node-differs": number;
  "storyteller-differs": number;
  "browser-differs": number;
  "all-differ": number;
  "browser-node-agree": number;
  "browser-node-differ": number;
  "unavailable": number;
}

export interface BaselineHistogram {
  title: BaselineField;
  creator: BaselineField;
  date: BaselineField;
}

export interface PairMismatches {
  title: number;
  creator: number;
  date: number;
}

// Collapse the 8-way baseline onto the node×browser pair.
// node ≠ browser in: node-differs, browser-differs, all-differ, browser-node-differ.
export function projectNodeBrowserMismatches(hist: BaselineHistogram): PairMismatches {
  return {
    title: projectNB(hist.title),
    creator: projectNB(hist.creator),
    date: projectNB(hist.date),
  };
}

function projectNB(f: BaselineField): number {
  return f["node-differs"] + f["browser-differs"] + f["all-differ"] + f["browser-node-differ"];
}

// Collapse the 8-way baseline onto the node×storyteller pair.
// node ≠ storyteller in: node-differs, storyteller-differs, all-differ.
// browser-node-* books are EPUB 2 (storyteller did not open them) — excluded.
export function projectNodeStorytellerMismatches(hist: BaselineHistogram): PairMismatches {
  return {
    title: projectNS(hist.title),
    creator: projectNS(hist.creator),
    date: projectNS(hist.date),
  };
}

function projectNS(f: BaselineField): number {
  return f["node-differs"] + f["storyteller-differs"] + f["all-differ"];
}
