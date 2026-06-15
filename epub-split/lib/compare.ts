/*
  This need to be replaced with an accurate description when we are done
 */

import { ParserResult, Toc, Manifest, ComparisonWarning } from "./types.ts";
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

export function compareBook(
  reference: ParserResult,
  candidate: ParserResult,
  options: Partial<CompareOptions> = {}
): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];

  if (reference.failure) {
    warnings.push({
      type: "parse.failure",
      message: `reference (${reference.parser}) ${reference.failure.category}: ${reference.failure.message}`,
    });
  }
  if (candidate.failure) {
    warnings.push({
      type: "parse.failure",
      message: `candidate (${candidate.parser}) ${candidate.failure.category}: ${candidate.failure.message}`,
    });
  }
  if (reference.failure || candidate.failure) {
    return warnings;
  }

  const manifestWarnings = compareManifest(
    reference.manifest,
    candidate.manifest,
    reference.parser,
    candidate.parser,
    options
  );
  warnings.push(...manifestWarnings);

  // const spineWarnings = compareSpine(reference.spine, candidate.spine, options);
  // warnings.push(...spineWarnings);

  // const tocWarnings = compareToc(reference.toc, candidate.toc, options);
  // warnings.push(...tocWarnings);

  return warnings;
}

export function compareManifest(
  reference: Manifest,
  candidate: Manifest,
  referenceName: string = "reference",
  candidateName: string = "candidate",
  options: Partial<CompareOptions> = {}
): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];

  // Compare the Manifest length: i.e. the number of entries
  if (
    Object.keys(reference).length !== Object.keys(candidate).length
  ) {
    warnings.push({
      type: "manifest.length",
      message: `Manifest length mismatch ${referenceName}:${
        Object.keys(reference).length
      } ${candidateName}:${Object.keys(candidate).length}`,
    });
    return warnings;
  }
  // since we had an early return when lengths do not match
  // we can assume the lengths match
  for (const key in reference) {
    if (!(key in candidate)) {
      warnings.push({
        type: "manifest.missing.key",
        message: `Manifest entry missing in ${candidateName}: ${key}`,
      });
      continue;
    }
    // now we have both reference and candidate entries
    const referenceEntry = reference[key];
    const candidateEntry = candidate[key];
    // I think this is impossible, but just in case!!
    if (referenceEntry.id !== candidateEntry.id) {
      warnings.push({
        type: "manifest.id.mismatch",
        message: `key:${key} ${referenceName}:${referenceEntry.id} ${candidateName}:${candidateEntry.id}`,
      });
    }
    // compare hrefs, as they are.
    if (referenceEntry.href !== candidateEntry.href) {
      warnings.push({
        type: "manifest.href.mismatch",
        message: `key:${key} ${referenceName}:${referenceEntry.href} ${candidateName}:${candidateEntry.href}`,
      });
    }
    if (referenceEntry.mediaType !== candidateEntry.mediaType) {
      warnings.push({
        type: "manifest.mediaType.mismatch",
        message: `key:${key} ${referenceName}:${referenceEntry.mediaType} ${candidateName}:${candidateEntry.mediaType}`,
      });
    }
  }

  return warnings;
}

export function compareToc(
  referenceToc: Toc,
  candidateToc: Toc,
  options: Partial<CompareOptions> = {}
): ComparisonWarning[] {
  const opts = { ...defaultOptions, ...options } as CompareOptions;

  const warnings: ComparisonWarning[] = [];
  // - quick guard – empty TOC on either side
  const emptyReference = referenceToc.length === 0;
  const emptyCandidate = candidateToc.length === 0;
  if (emptyReference || emptyCandidate) {
    if (emptyReference && emptyCandidate) {
      warnings.push({
        type: "toc.presence",
        message:
          "Both parsers produced an empty TOC - no further comparisons possible",
      });
    } else {
      const emptyName = emptyReference ? "reference" : "candidate";
      const otherName = emptyReference ? "candidate" : "reference";
      warnings.push({
        type: "toc.presence",
        message: `${emptyName} produced an empty TOC while ${otherName} has entries`,
      });
    }
    return warnings; // no meaningful comparisons beyond this point
  }

  // - flatten & normalize – flatten & normalize
  const referenceEntries = flattenToc(referenceToc, 0, opts);
  const candidateEntries = flattenToc(candidateToc, 0, opts);

  // - compare
  const labelDiff = compareFieldSet(referenceEntries, candidateEntries, "label");
  const hrefDiff = compareFieldSet(referenceEntries, candidateEntries, "href", (h) =>
    opts.normalizeHref ? normalizeHref(h) : h
  );
  //  Not used: comparison not useful
  // const idDiff = compareFieldSet(referenceEntries, candidateEntries, "id");
  const orderDiff = compareLabelOrder(referenceEntries, candidateEntries);
  const depthDiff = compareTreeDepth(referenceEntries, candidateEntries);

  //- aggregate warnings
  warnings.push(
    ...labelDiff,
    ...hrefDiff,
    // ...idDiff,
    ...orderDiff,
    ...depthDiff
  );

  if (opts.verbosity > 0) {
    showSideBySideTOC(referenceEntries, candidateEntries, "label");
    showSideBySideTOC(referenceEntries, candidateEntries, "href");
  }

  return warnings;
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

/**
 * Returns a Set of values that are present in both TOCs for a given field.
 *
 * @param reference - Flattened TOC entries from the reference parser
 * @param candidate - Flattened TOC entries from the candidate parser
 * @param field - The string-valued field to compare (e.g. "label" or "href")
 * @param normalize - Optional function to normalize field values before comparison
 * @returns A Set of values present in both TOCs
 */
function commonEntries(
  reference: FlatEntry[],
  candidate: FlatEntry[],
  field: keyof FlatEntry & string,
  normalize?: (value: string) => string
): Set<string> {
  const norm = normalize ?? ((x: string) => x);
  const referenceSet = new Set(reference.map((e) => norm(e[field] as string)));
  const candidateSet = new Set(candidate.map((e) => norm(e[field] as string)));
  return new Set([...referenceSet].filter((x) => candidateSet.has(x)));
}

// Map field names to their corresponding warning types
function mapFieldToWarningType(
  field: keyof Omit<FlatEntry, "depth">
): ComparisonWarning["type"] {
  const mapping: Record<
    keyof Omit<FlatEntry, "depth">,
    ComparisonWarning["type"]
  > = {
    id: "toc.id.set",
    label: "toc.label.set",
    href: "toc.href.set",
  };
  return mapping[field];
}

/**
 * Compares the sets of values for a given string field between two TOC entries.
 * TODO(daneroo): add duplicate checks
 *
 * @param reference - Flattened TOC entries from the reference parser
 * @param candidate - Flattened TOC entries from the candidate parser
 * @param field - The string-valued field to compare (e.g. "label" or "href")
 * @param normalize - Optional function to normalize field values before comparison
 * @returns Array of warnings for values only present in one set
 */
function compareFieldSet(
  reference: FlatEntry[],
  candidate: FlatEntry[],
  field: keyof Omit<FlatEntry, "depth">,
  normalize?: (value: string) => string
): ComparisonWarning[] {
  const norm = normalize ?? ((x: string) => x);
  const referenceSet = new Set(reference.map((e) => norm(e[field] as string)));
  const candidateSet = new Set(candidate.map((e) => norm(e[field] as string)));
  const common = commonEntries(reference, candidate, field, normalize);
  const warnings: ComparisonWarning[] = [];

  const onlyInReference = [...referenceSet].filter((value) => !common.has(value));
  const onlyInCandidate = [...candidateSet].filter((value) => !common.has(value));

  if (onlyInReference.length > 0) {
    warnings.push({
      type: mapFieldToWarningType(field),
      message: `Only in reference: ${onlyInReference.join(", ")}`,
    });
  }
  if (onlyInCandidate.length > 0) {
    warnings.push({
      type: mapFieldToWarningType(field),
      message: `Only in candidate: ${onlyInCandidate.join(", ")}`,
    });
  }

  return warnings;
}

function compareLabelOrder(
  reference: FlatEntry[],
  candidate: FlatEntry[]
): ComparisonWarning[] {
  const commonLabels = commonEntries(reference, candidate, "label");
  const referenceSequence = reference
    .filter((e) => commonLabels.has(e.label))
    .map((e) => e.label);
  const candidateSequence = candidate
    .filter((e) => commonLabels.has(e.label))
    .map((e) => e.label);
  const warnings: ComparisonWarning[] = [];
  for (let i = 0; i < Math.min(referenceSequence.length, candidateSequence.length); i++) {
    if (referenceSequence[i] !== candidateSequence[i]) {
      warnings.push({
        type: "toc.label.order",
        message: `#${i}: reference:"${referenceSequence[i]}" vs candidate:"${candidateSequence[i]}"`,
      });
    }
  }
  return warnings;
}

function compareTreeDepth(
  reference: FlatEntry[],
  candidate: FlatEntry[]
): ComparisonWarning[] {
  const commonLabels = commonEntries(reference, candidate, "label");
  const referenceDepths = reference
    .filter((e) => commonLabels.has(e.label))
    .map((e) => e.depth);
  const candidateDepths = candidate
    .filter((e) => commonLabels.has(e.label))
    .map((e) => e.depth);
  const maxReferenceDepth = Math.max(...referenceDepths);
  const maxCandidateDepth = Math.max(...candidateDepths);

  const warnings: ComparisonWarning[] = [];

  // Handle flat vs nested case
  if ((maxReferenceDepth === 0 && maxCandidateDepth > 0) || (maxCandidateDepth === 0 && maxReferenceDepth > 0)) {
    const flatSide = maxReferenceDepth === 0 ? "reference" : "candidate";
    const otherSide = maxReferenceDepth === 0 ? "candidate" : "reference";
    const otherMaxDepth = maxReferenceDepth === 0 ? maxCandidateDepth : maxReferenceDepth;
    warnings.push({
      type: "toc.label.depth",
      message: `${flatSide} is flat while ${otherSide} has depth ${otherMaxDepth}`,
    });
    return warnings;
  }

  // Handle depth mismatches - for common entries
  const referenceMap = Object.fromEntries(reference.map((e) => [e.label, e.depth]));
  const candidateMap = Object.fromEntries(candidate.map((e) => [e.label, e.depth]));
  const mismatches = Object.keys(referenceMap)
    .filter((lbl) => commonLabels.has(lbl))
    .filter((lbl) => referenceMap[lbl] !== candidateMap[lbl])
    .map((lbl) => ({
      label: lbl,
      referenceDepth: referenceMap[lbl],
      candidateDepth: candidateMap[lbl],
    }));

  mismatches.forEach((m) => {
    warnings.push({
      type: "toc.label.depth",
      message: `${m.label} - depth reference:${m.referenceDepth}, candidate:${m.candidateDepth}`,
    });
  });

  return warnings;
}

// -- Presentation layer

// Just a utility to show the TOC side by side
function showSideBySideTOC(
  referenceEntries: FlatEntry[],
  candidateEntries: FlatEntry[],
  foi: keyof FlatEntry = "label" // field of interest, defaulting to "label"
) {
  console.log(`\nSide by Side: ${foi} w/depth\n`);
  console.log("| # | D | Reference | D | Candidate |");
  console.log("|---|---|-------|---|--------|");
  const maxLength = Math.max(referenceEntries.length, candidateEntries.length);

  function formatEntry(entry: FlatEntry | undefined): string {
    if (!entry) return "-";
    const indentChar = "┄"; // Unicode box drawing character (U+2504)
    const indent = indentChar.repeat(entry.depth * 2);
    // TODO(daneroo): must/could/should escape special characters [|] with .toString().replace(/[|]/g, "\\|");
    return indent + entry[foi];
  }

  for (let i = 0; i < maxLength; i++) {
    const referenceEntry = referenceEntries?.[i];
    const candidateEntry = candidateEntries?.[i];

    console.log(
      `| ${i.toString().padStart(3)} | ${
        referenceEntry?.depth ?? "-"
      } | ${formatEntry(referenceEntry).padEnd(40)} | ${
        candidateEntry?.depth ?? "-"
      } | ${formatEntry(candidateEntry).padEnd(40)} |`
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
