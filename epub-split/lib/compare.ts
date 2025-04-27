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

interface ComparisonWarning {
  // could also have a severity, like info,warn,error?
  type:
    | "toc.presence" // One or both TOCs are empty
    | "toc.label.set" // Labels present in one TOC but not the other
    | "toc.href.set" // Hrefs present in one TOC but not the other
    | "toc.label.order" // Labels appear in different order in the two TOCs
    | "toc.label.depth"; // Labels have different nesting depths in the two TOCs
  message: string;
}

export function compareToc(
  tocLingo: Toc,
  tocEpubjs: Toc,
  options: Partial<CompareOptions> = {}
): boolean {
  const opts = { ...defaultOptions, ...options } as CompareOptions;

  const warnings: ComparisonWarning[] = [];
  // - quick guard – empty TOC on either side
  const emptyLingo = tocLingo.length === 0;
  const emptyEpub = tocEpubjs.length === 0;
  if (emptyLingo || emptyEpub) {
    if (emptyLingo && emptyEpub) {
      warnings.push({
        type: "toc.presence",
        message:
          "Both parsers produced an empty TOC - no further comparisons possible",
      });
    } else {
      const emptyName = emptyLingo ? "lingo" : "epubjs";
      const otherName = emptyLingo ? "epubjs" : "lingo";
      warnings.push({
        type: "toc.presence",
        message: `${emptyName} produced an empty TOC while ${otherName} has entries`,
      });
    }
    showWarnings(warnings);
    return false; // no meaningful comparisons beyond this point
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
    orderDiff.length === 0 &&
    depthDiff.length === 0;

  if (allPass) {
    console.log(``);
    ok("All validations passed");
    return true;
  }

  if (opts.verbosity > 0) {
    showSideBySideTOC(lingoEntries, epubEntries, "label");
    showSideBySideTOC(lingoEntries, epubEntries, "href");
  }

  //- 3 – warnings based reporting
  warnings.push(
    ...diffToWarnings(labelDiff, "toc.label.set"),
    ...diffToWarnings(hrefDiff, "toc.href.set"),
    ...orderDiff,
    ...depthDiff
  );
  showWarnings(warnings);

  // - 3 – report
  // showLabelSetDiff(labelDiff, opts);
  // showHrefSetDiff(hrefDiff, opts);
  // showLabelOrderDiff(orderDiff, opts);
  // showDepthDiff(depthDiff, opts);

  return false;
}

// -- Critical Normalization Functions

/**
 * Normalizes an href by applying these transformations in order:
 * 1. Removes the 'epub:' protocol prefix (case-insensitive)
 *    e.g., "epub:OEBPS/file.html" -> "OEBPS/file.html"
 * 2. Strips directory paths, keeping only the filename
 *    e.g., "OEBPS/Text/file.html" -> "file.html"
 * 3. URL-decodes the filename (preserving any fragment identifier after #)
 *    e.g., "Time_of_Contempt_%28The_Witcher%29.html" -> "Time_of_Contempt_(The_Witcher).html"
 *
 * Note: Fragment identifiers (#section) are preserved as they are significant for navigation
 * e.g., "epub:OEBPS/chapter1.xhtml#section2" -> "chapter1.xhtml#section2"
 *
 * @param href The href string to normalize
 * @returns The normalized href
 */
function normalizeHref(href: string): string {
  // Split href into base and fragment (if any)
  const [base, ...fragments] = href.split("#");
  const fragment = fragments.length ? "#" + fragments.join("#") : "";

  // Apply transformations to base part only
  const normalized = base
    .replace(/^epub:/i, "") // Remove epub: prefix
    .replace(/.*\//, ""); // Keep only filename

  // Decode the filename part but not the fragment
  return decodeURIComponent(normalized) + fragment;
  // return normalized + fragment;
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
): ComparisonWarning[] {
  const isCommon = (lbl: string) =>
    !diff.onlyInLingo.includes(lbl) && !diff.onlyInEpubjs.includes(lbl);
  const seqLingo = lingo.filter((e) => isCommon(e.label)).map((e) => e.label);
  const seqEpub = epub.filter((e) => isCommon(e.label)).map((e) => e.label);
  const warnings: ComparisonWarning[] = [];
  for (let i = 0; i < Math.min(seqLingo.length, seqEpub.length); i++) {
    if (seqLingo[i] !== seqEpub[i]) {
      warnings.push({
        type: "toc.label.order",
        message: `#${i}: lingo:"${seqLingo[i]}" vs epubjs:"${seqEpub[i]}"`,
      });
    }
  }
  return warnings;
}

function compareTreeDepth(
  lingo: FlatEntry[],
  epub: FlatEntry[],
  diff: DiffResult<string>
): ComparisonWarning[] {
  const isCommon = (lbl: string) =>
    !diff.onlyInLingo.includes(lbl) && !diff.onlyInEpubjs.includes(lbl);
  const depthLingo = lingo.filter((e) => isCommon(e.label)).map((e) => e.depth);
  const depthEpub = epub.filter((e) => isCommon(e.label)).map((e) => e.depth);
  const maxL = Math.max(...depthLingo);
  const maxE = Math.max(...depthEpub);

  const warnings: ComparisonWarning[] = [];

  // Handle flat vs nested case
  if ((maxL === 0 && maxE > 0) || (maxE === 0 && maxL > 0)) {
    const flatSide = maxL === 0 ? "lingo" : "epubjs";
    const otherSide = maxL === 0 ? "epubjs" : "lingo";
    const otherMaxDepth = maxL === 0 ? maxE : maxL;
    warnings.push({
      type: "toc.label.depth",
      message: `${flatSide} is flat while ${otherSide} has depth ${otherMaxDepth}`,
    });
    return warnings;
  }

  // Handle depth mismatches
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

  mismatches.forEach((m) => {
    warnings.push({
      type: "toc.label.depth",
      message: `${m.label} - depth lingo:${m.lingoDepth}, epubjs:${m.epubjsDepth}`,
    });
  });

  return warnings;
}

// Abstracted Presentation layer

function diffToWarnings(
  diff: DiffResult<string>,
  type: "toc.label.set" | "toc.href.set"
): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];
  if (diff.onlyInLingo.length > 0) {
    warnings.push({
      type,
      message: `Only in Lingo: ${diff.onlyInLingo.join(", ")}`,
    });
  }
  if (diff.onlyInEpubjs.length > 0) {
    warnings.push({
      type,
      message: `Only in EpubJS: ${diff.onlyInEpubjs.join(", ")}`,
    });
  }
  return warnings;
}

// -- Presentation layer

function showWarnings(warnings: ComparisonWarning[]) {
  if (warnings.length === 0) return;
  console.log("\nWarnings:");
  warnings.forEach((w) => fail(`${w.type}: ${w.message}`));
}

// Just a utility to show the TOC side by side
function showSideBySideTOC(
  lingoEntries: FlatEntry[],
  epubEntries: FlatEntry[],
  foi: keyof FlatEntry = "label" // field of interest, defaulting to "label"
) {
  console.log(`\nSide by Side: ${foi} w/depth\n`);
  console.log("| # | D | Lingo | D | EpubJS |");
  console.log("|---|---|-------|---|--------|");
  const maxLength = Math.max(lingoEntries.length, epubEntries.length);

  function formatEntry(entry: FlatEntry | undefined): string {
    if (!entry) return "-";
    const indentChar = "┄"; // Unicode box drawing character (U+2504)
    const indent = indentChar.repeat(entry.depth * 2);
    // TODO(daneroo): must/could/should escape special characters [|] with .toString().replace(/[|]/g, "\\|");
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
