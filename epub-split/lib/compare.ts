/*
 * compare.ts – reset & final (v7.0)
 * =================================
 *   – Fresh, full rewrite from the last **working** version (v4) plus:
 *       • label normalisation during flattening (trim + collapse WS)
 *       • href normalisation (already present)
 *       • flat‑vs‑nested tree summary
 *       • explicit variable names throughout
 *   – Tested with `tsc --noEmit` → passes.
 */

import { Toc } from "./types";

/*───────────────────────── Public API ─────────────────────────*/

export interface CompareOptions {
  maxLines: number; // truncate long lists; Infinity = no truncation
  normalizeHref: boolean; // strip epub:/OEBPS/ … prefixes & dirs
  normalizeLabel: boolean; // trim + collapse whitespace
  verbose: boolean; // reserved for future use
}

const defaultOptions: CompareOptions = {
  maxLines: 15,
  normalizeHref: true,
  normalizeLabel: true,
  verbose: false,
};

export function compareToc(
  tocLingo: Toc,
  tocEpubjs: Toc,
  options: Partial<CompareOptions> = {}
): void {
  const opts = { ...defaultOptions, ...options } as CompareOptions;

  /* quick guard – empty TOC on either side */
  const emptyLingo = tocLingo.length === 0;
  const emptyEpub = tocEpubjs.length === 0;
  if (emptyLingo || emptyEpub) {
    console.log("TOC presence check:");
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

  /* 1 – flatten & normalise – flatten & normalise */
  const lingoEntries = flattenToc(tocLingo, 0, opts);
  const epubEntries = flattenToc(tocEpubjs, 0, opts);

  /* 2 – compare */
  const labelDiff = compareLabelSet(lingoEntries, epubEntries);
  const hrefDiff = compareHrefSet(lingoEntries, epubEntries, opts);
  const orderDiff = compareLabelOrder(lingoEntries, epubEntries, labelDiff);
  const depthDiff = compareTreeDepth(lingoEntries, epubEntries, labelDiff);

  /* 3 – report */
  showLabelSetDiff(labelDiff, opts);
  showHrefSetDiff(hrefDiff, opts);
  showLabelOrderDiff(orderDiff, opts);
  showDepthDiff(depthDiff, opts);
}

/*──────────────────────── Logic layer ────────────────────────*/

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
  const norm = (h: string) => (opts.normalizeHref ? normaliseHref(h) : h);
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

/*──────────────────── Presentation layer ────────────────────*/

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
      (m) => `#${m.index}: “${m.lingoLabel}” vs “${m.epubjsLabel}”`
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
      `${flat} is flat (depth 0) while ${nested} has nesting (max depth ${d.otherMaxDepth})`
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

/*──────────────────── Helper utilities ──────────────────────*/

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
    opts.normalizeLabel ? normaliseLabel(s) : s;
  return toc.flatMap((e) => [
    { id: e.id, label: normLabel(e.label), href: e.href, depth },
    ...(e.children ? flattenToc(e.children, depth + 1, opts) : []),
  ]);
}

const normaliseHref = (h: string) =>
  h.replace(/^epub:/i, "").replace(/.*\//, "");
const normaliseLabel = (s: string) => s.replace(/\s+/g, " ").trim();

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
