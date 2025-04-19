/*
 * compare.ts – v5: flat‑vs‑nested depth diagnostics
 * =================================================
 * Enhancement
 * -----------
 * Detect the common situation where one TOC is **fully flattened** (all depth 0)
 * while the other preserves nesting.  Instead of listing every label as a
 * mismatch we now print a single summary:
 *
 *     "✗ EpubJS is flat (depth 0) while Lingo has nesting (max depth 1)"
 *
 * If both sides are nested but individual depths differ, we fall back to the
 * previous per‑label diff (respecting `maxLines`).  Depth comparison is thus
 * both concise and general‑purpose.
 */

import { Toc } from "./types";

/*─────────────────────────── Public API ──────────────────────────────*/

export interface CompareOptions {
  maxLines: number;
  normalizeHref: boolean;
  verbose: boolean;
}

const defaultOpts: CompareOptions = {
  maxLines: 15,
  normalizeHref: true,
  verbose: false,
};

export function compareToc(
  tocLingo: Toc,
  tocEpubjs: Toc,
  options: Partial<CompareOptions> = {}
): void {
  const opts: CompareOptions = { ...defaultOpts, ...options };

  const flatLingo = flattenToc(tocLingo);
  const flatEpubjs = flattenToc(tocEpubjs);

  const labelSetDiff = compareLabelSet(flatLingo, flatEpubjs);
  const hrefSetDiff = compareHrefSet(flatLingo, flatEpubjs, opts);
  const orderDiff = compareLabelOrder(flatLingo, flatEpubjs, labelSetDiff);
  const depthDiff = compareTreeDepth(flatLingo, flatEpubjs, labelSetDiff);

  showLabelSetDiff(labelSetDiff, opts);
  showHrefSetDiff(hrefSetDiff, opts);
  showLabelOrderDiff(orderDiff, opts);
  showDepthDiff(depthDiff, opts);
}

/*──────────────────── Comparison helpers (logic) ─────────────────────*/

function compareLabelSet(
  lingo: FlatEntry[],
  epubjs: FlatEntry[]
): DiffResult<string> {
  const a = new Set(lingo.map((e) => e.label));
  const b = new Set(epubjs.map((e) => e.label));
  return {
    onlyInLingo: [...a].filter((x) => !b.has(x)),
    onlyInEpubjs: [...b].filter((x) => !a.has(x)),
  };
}

function compareHrefSet(
  lingo: FlatEntry[],
  epubjs: FlatEntry[],
  opts: CompareOptions
): DiffResult<string> {
  const norm = (s: string) => (opts.normalizeHref ? normaliseHref(s) : s);
  const a = new Set(lingo.map((e) => norm(e.href)));
  const b = new Set(epubjs.map((e) => norm(e.href)));
  return {
    onlyInLingo: [...a].filter((x) => !b.has(x)),
    onlyInEpubjs: [...b].filter((x) => !a.has(x)),
  };
}

function compareLabelOrder(
  lingo: FlatEntry[],
  epubjs: FlatEntry[],
  labelDiff: DiffResult<string>
): OrderDiff {
  const common = (lbl: string) =>
    !labelDiff.onlyInLingo.includes(lbl) &&
    !labelDiff.onlyInEpubjs.includes(lbl);

  const seqA = lingo.filter((e) => common(e.label)).map((e) => e.label);
  const seqB = epubjs.filter((e) => common(e.label)).map((e) => e.label);

  const len = Math.min(seqA.length, seqB.length);
  const mismatches: {
    index: number;
    lingoLabel: string;
    epubjsLabel: string;
  }[] = [];
  for (let i = 0; i < len; i++)
    if (seqA[i] !== seqB[i])
      mismatches.push({ index: i, lingoLabel: seqA[i], epubjsLabel: seqB[i] });
  return { mismatches };
}

function compareTreeDepth(
  lingo: FlatEntry[],
  epubjs: FlatEntry[],
  labelDiff: DiffResult<string>
): DepthDiff {
  const common = (lbl: string) =>
    !labelDiff.onlyInLingo.includes(lbl) &&
    !labelDiff.onlyInEpubjs.includes(lbl);

  const lDepths = lingo.filter((e) => common(e.label)).map((e) => e.depth);
  const eDepths = epubjs.filter((e) => common(e.label)).map((e) => e.depth);

  const maxL = Math.max(...lDepths);
  const maxE = Math.max(...eDepths);

  // Detect fully flat vs nested
  if ((maxL === 0 && maxE > 0) || (maxE === 0 && maxL > 0)) {
    return {
      flatSide: maxL === 0 ? "lingo" : "epubjs",
      otherMaxDepth: maxL === 0 ? maxE : maxL,
      mismatches: [],
    };
  }

  // Otherwise fall back to per‑label diff
  const depthBy = (arr: FlatEntry[]) =>
    Object.fromEntries(arr.map((e) => [e.label, e.depth]));
  const lMap = depthBy(lingo);
  const eMap = depthBy(epubjs);
  const mismatches = Object.keys(lMap)
    .filter(common)
    .filter((lbl) => lMap[lbl] !== eMap[lbl])
    .map((lbl) => ({
      label: lbl,
      lingoDepth: lMap[lbl],
      epubjsDepth: eMap[lbl],
    }));

  return { flatSide: null, otherMaxDepth: 0, mismatches };
}

/*────────────────── Presentation helpers (show) ──────────────────────*/

function showLabelSetDiff(diff: DiffResult<string>, o: CompareOptions) {
  console.log("\nLabel set comparison (" + summary(diff) + "):");
  list(diff.onlyInLingo, "Lingo‑only", o);
  list(diff.onlyInEpubjs, "EpubJS‑only", o);
  if (!diff.onlyInLingo.length && !diff.onlyInEpubjs.length)
    _ok("Label sets identical");
}

function showHrefSetDiff(diff: DiffResult<string>, o: CompareOptions) {
  console.log("\nHref set comparison (" + summary(diff) + "):");
  list(diff.onlyInLingo, "Lingo‑only", o);
  list(diff.onlyInEpubjs, "EpubJS‑only", o);
  if (!diff.onlyInLingo.length && !diff.onlyInEpubjs.length)
    _ok("Href sets identical");
}

function showLabelOrderDiff(diff: OrderDiff, o: CompareOptions) {
  console.log("\nLabel order comparison:");
  if (!diff.mismatches.length) {
    _ok("Order identical after removing non‑common labels");
    return;
  }
  list(
    diff.mismatches.map(
      (m) => `#${m.index}: “${m.lingoLabel}” vs “${m.epubjsLabel}”`
    ),
    undefined,
    o
  );
}

function showDepthDiff(diff: DepthDiff, o: CompareOptions) {
  console.log("\nTree depth comparison:");
  if (diff.flatSide) {
    const flat = diff.flatSide === "lingo" ? "Lingo" : "EpubJS";
    const nested = diff.flatSide === "lingo" ? "EpubJS" : "Lingo";
    _fail(
      `${flat} is flat (depth 0) while ${nested} has nesting (max depth ${diff.otherMaxDepth})`
    );
    return;
  }
  if (!diff.mismatches.length) {
    _ok("Depth identical for common labels");
    return;
  }
  list(
    diff.mismatches.map(
      (m) => `${m.label} – depth lingo:${m.lingoDepth}, epubjs:${m.epubjsDepth}`
    ),
    undefined,
    o
  );
}

/*──────────────────────────── Utils ───────────────────────────────────*/

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
interface OrderDiff {
  mismatches: { index: number; lingoLabel: string; epubjsLabel: string }[];
}
interface DepthDiff {
  flatSide: "lingo" | "epubjs" | null;
  otherMaxDepth: number;
  mismatches: { label: string; lingoDepth: number; epubjsDepth: number }[];
}

function flattenToc(t: Toc, d = 0): FlatEntry[] {
  return t.flatMap((e) => [
    { id: e.id, label: e.label, href: e.href, depth: d },
    ...(e.children ? flattenToc(e.children, d + 1) : []),
  ]);
}
function normaliseHref(h: string) {
  return h.replace(/^epub:/i, "").replace(/.*\//, "");
}
function summary<T>(d: DiffResult<T>) {
  const n = d.onlyInLingo.length + d.onlyInEpubjs.length;
  return `${n} difference${n === 1 ? "" : "s"}`;
}
function list(a: string[], p: string | undefined, o: CompareOptions) {
  if (!a.length) return;
  const pre = p ? `${p}: ` : "";
  a.slice(0, o.maxLines).forEach((t) => _fail(pre + t));
  if (a.length > o.maxLines) _fail(`… ${a.length - o.maxLines} more`);
}
function _ok(m: string) {
  console.log(`  ✓ ${m}`);
}
function _fail(m: string) {
  console.log(`  ✗ ${m}`);
}
