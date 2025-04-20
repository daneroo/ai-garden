/*
  This need to be replaced with an accurate description when we are done
 */

import { Toc } from "./types.ts";

// -- Public API

export interface CompareOptions {
  maxLines: number; // truncate long lists; Infinity = no truncation
  normalizeHref: boolean; // strip epub:/OEBPS/ … prefixes & dirs
  normalizeLabel: boolean; // trim + collapse whitespace
  verbosity: number; // reserved for future use
}

const defaultOptions: CompareOptions = {
  maxLines: 15,
  normalizeHref: true,
  normalizeLabel: true,
  verbosity: 0,
};

export function compareToc(
  tocLingo: Toc,
  tocEpubjs: Toc,
  options: Partial<CompareOptions> = {}
): void {
  const opts = { ...defaultOptions, ...options } as CompareOptions;

  // - quick guard – empty TOC on either side
  const emptyLingo = tocLingo.length === 0;
  const emptyEpub = tocEpubjs.length === 0;
  if (emptyLingo || emptyEpub) {
    console.log("\nTOC presence check:");
    if (emptyLingo && emptyEpub) {
      fail(
        "Both parsers produced an empty TOC - no further comparisons possible"
      );
    } else if (emptyLingo) {
      fail("Lingo produced an empty TOC while EpubJS has entries");
    } else {
      fail("EpubJS produced an empty TOC while Lingo has entries");
    }
    return; // no meaningful comparisons beyond this point
  }

  // - flatten & normalize – flatten & normalize
  const lingoEntries = flattenToc(tocLingo, 0, opts);
  const epubEntries = flattenToc(tocEpubjs, 0, opts);

  // - compare
  const labelDiff = compareLabelSet(lingoEntries, epubEntries);
  const hrefDiff = compareHrefSet(lingoEntries, epubEntries, opts);
  const orderDiff = compareLabelOrder(lingoEntries, epubEntries, labelDiff);
  const depthDiff = compareTreeDepth(lingoEntries, epubEntries, labelDiff);

  // - aggregate success check – if every diff is empty, short‑circuit with one line
  const allPass =
    labelDiff.onlyInLingo.length === 0 &&
    labelDiff.onlyInEpubjs.length === 0 &&
    hrefDiff.onlyInLingo.length === 0 &&
    hrefDiff.onlyInEpubjs.length === 0 &&
    orderDiff.mismatches.length === 0 &&
    depthDiff.flatSide === null &&
    depthDiff.mismatches.length === 0;

  if (allPass) {
    console.log(``);
    ok("All validations passed");
    return;
  }

  if (opts.verbosity > 0) {
    showSideBySideTOC(lingoEntries, epubEntries);
  }

  // - 3 – report
  showLabelSetDiff(labelDiff, opts);
  showHrefSetDiff(hrefDiff, opts);
  showLabelOrderDiff(orderDiff, opts);
  showDepthDiff(depthDiff, opts);
}

// -- Critical Normalization Functions

/**
 * Normalizes an href by:
 * 1. Removing the 'epub:' protocol prefix (case-insensitive)
 * 2. Stripping directory paths, keeping only the filename
 * @param href The href string to normalize
 * @returns The normalized href
 */
function normalizeHref(href: string): string {
  return href.replace(/^epub:/i, "").replace(/.*\//, "");
}

/**
 * Normalizes a label by:
 * 1. Trimming leading/trailing whitespace
 * 2. Collapsing multiple whitespace characters into a single space
 * @param label The label string to normalize
 * @returns The normalized label
 */
function normalizeLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

// -- Logic layer

function compareLabelSet(
  lingo: FlatEntry[],
  epub: FlatEntry[]
): DiffResult<string> {
  const setLingo = new Set(lingo.map((e) => e.label));
  const setEpub = new Set(epub.map((e) => e.label));
  return {
    onlyInLingo: [...setLingo].filter((l) => !setEpub.has(l)),
    onlyInEpubjs: [...setEpub].filter((l) => !setLingo.has(l)),
  };
}

function compareHrefSet(
  lingo: FlatEntry[],
  epub: FlatEntry[],
  opts: CompareOptions
): DiffResult<string> {
  const norm = (h: string) => (opts.normalizeHref ? normalizeHref(h) : h);
  const setLingo = new Set(lingo.map((e) => norm(e.href)));
  const setEpub = new Set(epub.map((e) => norm(e.href)));
  return {
    onlyInLingo: [...setLingo].filter((h) => !setEpub.has(h)),
    onlyInEpubjs: [...setEpub].filter((h) => !setLingo.has(h)),
  };
}

function compareLabelOrder(
  lingo: FlatEntry[],
  epub: FlatEntry[],
  diff: DiffResult<string>
): OrderDiff {
  const isCommon = (lbl: string) =>
    !diff.onlyInLingo.includes(lbl) && !diff.onlyInEpubjs.includes(lbl);
  const seqLingo = lingo.filter((e) => isCommon(e.label)).map((e) => e.label);
  const seqEpub = epub.filter((e) => isCommon(e.label)).map((e) => e.label);
  const mismatches: OrderMismatch[] = [];
  for (let i = 0; i < Math.min(seqLingo.length, seqEpub.length); i++) {
    if (seqLingo[i] !== seqEpub[i])
      mismatches.push({
        index: i,
        lingoLabel: seqLingo[i],
        epubjsLabel: seqEpub[i],
      });
  }
  return { mismatches };
}

function compareTreeDepth(
  lingo: FlatEntry[],
  epub: FlatEntry[],
  diff: DiffResult<string>
): DepthDiff {
  const isCommon = (lbl: string) =>
    !diff.onlyInLingo.includes(lbl) && !diff.onlyInEpubjs.includes(lbl);
  const depthLingo = lingo.filter((e) => isCommon(e.label)).map((e) => e.depth);
  const depthEpub = epub.filter((e) => isCommon(e.label)).map((e) => e.depth);
  const maxL = Math.max(...depthLingo);
  const maxE = Math.max(...depthEpub);
  if ((maxL === 0 && maxE > 0) || (maxE === 0 && maxL > 0)) {
    return {
      flatSide: maxL === 0 ? "lingo" : "epubjs",
      otherMaxDepth: maxL === 0 ? maxE : maxL,
      mismatches: [],
    };
  }
  const mapL = Object.fromEntries(lingo.map((e) => [e.label, e.depth]));
  const mapE = Object.fromEntries(epub.map((e) => [e.label, e.depth]));
  const mismatches = Object.keys(mapL)
    .filter(isCommon)
    .filter((lbl) => mapL[lbl] !== mapE[lbl])
    .map((lbl) => ({
      label: lbl,
      lingoDepth: mapL[lbl],
      epubjsDepth: mapE[lbl],
    }));
  return { flatSide: null, otherMaxDepth: 0, mismatches };
}

// -- Presentation layer

// Just a utility to show the TOC side by side
function showSideBySideTOC(
  lingoEntries: FlatEntry[],
  epubEntries: FlatEntry[],
  foi: keyof FlatEntry = "label" // field of interest, defaulting to "label"
) {
  console.log("\nLabels side by side:\n");
  console.log("| # | D | Lingo Label | D | EpubJS Label |");
  console.log("|---|---|-------------|---|--------------|");
  const maxLength = Math.max(lingoEntries.length, epubEntries.length);

  function formatEntry(entry: FlatEntry | undefined): string {
    if (!entry) return "-";
    const indentChar = "┄"; // Unicode box drawing character (U+2504)
    const indent = indentChar.repeat(entry.depth * 2);
    return indent + entry[foi];
  }

  for (let i = 0; i < maxLength; i++) {
    const lingoEntry = lingoEntries?.[i];
    const epubEntry = epubEntries?.[i];

    console.log(
      `| ${i.toString().padStart(3)} | ${
        lingoEntry?.depth ?? "-"
      } | ${formatEntry(lingoEntry).padEnd(40)} | ${
        epubEntry?.depth ?? "-"
      } | ${formatEntry(epubEntry).padEnd(40)} |`
    );
  }
}

function showLabelSetDiff(d: DiffResult<string>, o: CompareOptions) {
  console.log(`\nLabel set comparison (${summary(d)}):`);
  list(d.onlyInLingo, "Lingo‑only", o);
  list(d.onlyInEpubjs, "EpubJS‑only", o);
  if (!d.onlyInLingo.length && !d.onlyInEpubjs.length)
    ok("Label sets identical");
}

function showHrefSetDiff(d: DiffResult<string>, o: CompareOptions) {
  console.log(`\nHref set comparison (${summary(d)}):`);
  list(d.onlyInLingo, "Lingo‑only", o);
  list(d.onlyInEpubjs, "EpubJS‑only", o);
  if (!d.onlyInLingo.length && !d.onlyInEpubjs.length)
    ok("Href sets identical");
}

function showLabelOrderDiff(d: OrderDiff, o: CompareOptions) {
  console.log("\nLabel order comparison:");
  if (!d.mismatches.length)
    return ok("Order identical after removing non‑common labels");
  list(
    d.mismatches.map(
      (m) => `#${m.index}: " ${m.lingoLabel} " vs " ${m.epubjsLabel}"`
    ),
    undefined,
    o
  );
}

function showDepthDiff(d: DepthDiff, o: CompareOptions) {
  console.log("\nTree depth comparison:");
  if (d.flatSide) {
    const flat = d.flatSide === "lingo" ? "Lingo" : "EpubJS";
    const nested = d.flatSide === "lingo" ? "EpubJS" : "Lingo";
    return fail(
      `${flat} is flat (depth 0) while ${nested} has nesting (max depth ${d.otherMaxDepth})`
    );
  }
  if (!d.mismatches.length) return ok("Depth identical for common labels");
  list(
    d.mismatches.map(
      (m) => `${m.label} – depth lingo:${m.lingoDepth}, epubjs:${m.epubjsDepth}`
    ),
    undefined,
    o
  );
}

// -- Helper utilities

interface FlatEntry {
  id: string;
  label: string;
  href: string;
  depth: number;
}
interface DiffResult<T> {
  onlyInLingo: T[];
  onlyInEpubjs: T[];
}
interface OrderMismatch {
  index: number;
  lingoLabel: string;
  epubjsLabel: string;
}
interface OrderDiff {
  mismatches: OrderMismatch[];
}
interface DepthMismatch {
  label: string;
  lingoDepth: number;
  epubjsDepth: number;
}
interface DepthDiff {
  flatSide: "lingo" | "epubjs" | null;
  otherMaxDepth: number;
  mismatches: DepthMismatch[];
}

function flattenToc(
  toc: Toc,
  depth: number,
  opts: CompareOptions
): FlatEntry[] {
  const normLabel = (s: string) =>
    opts.normalizeLabel ? normalizeLabel(s) : s;
  return toc.flatMap((e) => [
    { id: e.id, label: normLabel(e.label), href: e.href, depth },
    ...(e.children ? flattenToc(e.children, depth + 1, opts) : []),
  ]);
}

function summary<T>(d: DiffResult<T>): string {
  const count = d.onlyInLingo.length + d.onlyInEpubjs.length;
  return `${count} difference${count === 1 ? "" : "s"}`;
}

function list(items: string[], prefix: string | undefined, o: CompareOptions) {
  if (!items.length) return;
  const pre = prefix ? `${prefix}: ` : "";
  const shown = items.slice(0, o.maxLines);
  shown.forEach((it) => fail(pre + it));
  const remaining = items.length - shown.length;
  if (remaining > 0) fail(`… ${remaining} more`);
}

const ok = (msg: string) => console.log(`  ✓ ${msg}`);
const fail = (msg: string) => console.log(`  ✗ ${msg}`);
