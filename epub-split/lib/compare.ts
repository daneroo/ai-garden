/*
  This need to be replaced with an accurate description when we are done
 */

import { ParserResult, Toc, Manifest, ComparisonWarning, Spine } from "./types.ts";
// -- Public API

export interface CompareOptions {
  normalizeLabel: boolean;
  verbosity: number; // reserved for future use
}

const defaultOptions: CompareOptions = {
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

  warnings.push(
    ...compareSpine(
      reference.spine,
      candidate.spine,
      reference.parser,
      candidate.parser
    )
  );

  warnings.push(...compareToc(reference.toc, candidate.toc, options));

  return warnings;
}

export function compareSpine(
  reference: Spine,
  candidate: Spine,
  referenceName: string = "reference",
  candidateName: string = "candidate"
): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];

  if (reference.length !== candidate.length) {
    warnings.push({
      type: "spine.length",
      message: `Spine length mismatch ${referenceName}:${reference.length} ${candidateName}:${candidate.length}`,
    });
  }

  const commonLength = Math.min(reference.length, candidate.length);
  for (let index = 0; index < commonLength; index++) {
    const referenceItem = reference[index];
    const candidateItem = candidate[index];
    if (referenceItem.idref !== candidateItem.idref) {
      warnings.push({
        type: "spine.idref.mismatch",
        message: `index:${index} ${referenceName}:${referenceItem.idref} ${candidateName}:${candidateItem.idref}`,
      });
    }
    if (referenceItem.href !== candidateItem.href) {
      warnings.push({
        type: "spine.href.mismatch",
        message: `index:${index} ${referenceName}:${referenceItem.href} ${candidateName}:${candidateItem.href}`,
      });
    }
    if (referenceItem.linear !== candidateItem.linear) {
      warnings.push({
        type: "spine.linear.mismatch",
        message: `index:${index} ${referenceName}:${referenceItem.linear} ${candidateName}:${candidateItem.linear}`,
      });
    }
    const referenceProperties = JSON.stringify(referenceItem.properties);
    const candidateProperties = JSON.stringify(candidateItem.properties);
    if (referenceProperties !== candidateProperties) {
      warnings.push({
        type: "spine.properties.mismatch",
        message: `index:${index} ${referenceName}:${referenceProperties} ${candidateName}:${candidateProperties}`,
      });
    }
  }

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
  const referenceKeys = Object.keys(reference);
  const candidateKeys = Object.keys(candidate);

  if (referenceKeys.length !== candidateKeys.length) {
    warnings.push({
      type: "manifest.length",
      message: `Manifest length mismatch ${referenceName}:${referenceKeys.length} ${candidateName}:${candidateKeys.length}`,
    });
  }

  for (const key of referenceKeys) {
    if (!(key in candidate)) {
      warnings.push({
        type: "manifest.missing.key",
        message: `Manifest entry missing in ${candidateName}: ${key}`,
      });
    }
  }

  for (const key of candidateKeys) {
    if (!(key in reference)) {
      warnings.push({
        type: "manifest.missing.key",
        message: `Manifest entry missing in ${referenceName}: ${key}`,
      });
    }
  }

  for (const key of referenceKeys) {
    if (!(key in candidate)) continue;

    const referenceEntry = reference[key];
    const candidateEntry = candidate[key];
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
  const emptyReference = referenceToc.length === 0;
  const emptyCandidate = candidateToc.length === 0;
  if (emptyReference !== emptyCandidate) {
    warnings.push({
      type: "toc.presence",
      message: `${emptyReference ? "reference" : "candidate"} produced an empty TOC while the other parser has entries`,
    });
    return warnings;
  }

  compareTocLevel(referenceToc, candidateToc, "root", warnings, opts);
  return warnings;
}

function compareTocLevel(
  reference: Toc,
  candidate: Toc,
  path: string,
  warnings: ComparisonWarning[],
  options: CompareOptions
): void {
  if (reference.length !== candidate.length) {
    warnings.push({
      type: "toc.length",
      message: `path:${path} reference:${reference.length} candidate:${candidate.length}`,
    });
  }

  const commonLength = Math.min(reference.length, candidate.length);
  for (let index = 0; index < commonLength; index++) {
    const referenceEntry = reference[index];
    const candidateEntry = candidate[index];
    const entryPath = `${path}.${index}`;

    if (referenceEntry.id !== candidateEntry.id) {
      warnings.push({
        type: "toc.id.mismatch",
        message: `path:${entryPath} reference:${referenceEntry.id} candidate:${candidateEntry.id}`,
      });
    }
    if (referenceEntry.href !== candidateEntry.href) {
      warnings.push({
        type: "toc.href.mismatch",
        message: `path:${entryPath} reference:${referenceEntry.href} candidate:${candidateEntry.href}`,
      });
    }
    const referenceLabel = options.normalizeLabel
      ? normalizeLabel(referenceEntry.label)
      : referenceEntry.label;
    const candidateLabel = options.normalizeLabel
      ? normalizeLabel(candidateEntry.label)
      : candidateEntry.label;
    if (referenceLabel !== candidateLabel) {
      warnings.push({
        type: "toc.label.mismatch",
        message: `path:${entryPath} reference:${JSON.stringify(referenceLabel)} candidate:${JSON.stringify(candidateLabel)}`,
      });
    }

    compareTocLevel(
      referenceEntry.children ?? [],
      candidateEntry.children ?? [],
      entryPath,
      warnings,
      options
    );
  }
}

/** Comparison-only normalization for browser epub.js serialization differences. */
function normalizeLabel(label: string): string {
  return label
    .replace(/&(?:#\d+|#x[\da-f]+|[a-z][\da-z]+);/gi, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}
