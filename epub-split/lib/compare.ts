/*
  This need to be replaced with an accurate description when we are done
 */

import {
  Chapter,
  Chapters,
  ParserResult,
  Toc,
  Manifest,
  ComparisonWarning,
  Metadata,
  Spine,
} from "./types.ts";
import { createHash } from "node:crypto";
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
  warnings.push(...compareMetadata(reference.metadata, candidate.metadata));
  warnings.push(...compareChapters(reference.chapters, candidate.chapters));

  return warnings;
}

export function compareChapters(
  reference: Chapters,
  candidate: Chapters
): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];
  if (reference.length !== candidate.length) {
    warnings.push({
      type: "chapter.length",
      message: `reference:${reference.length} candidate:${candidate.length}`,
    });
  }

  const commonLength = Math.min(reference.length, candidate.length);
  for (let index = 0; index < commonLength; index++) {
    const referenceChapter = reference[index];
    const candidateChapter = candidate[index];
    if (
      referenceChapter.idref !== candidateChapter.idref ||
      referenceChapter.href !== candidateChapter.href
    ) {
      warnings.push({
        type: "chapter.identity.mismatch",
        message: `index:${index} reference:${referenceChapter.idref}:${referenceChapter.href} candidate:${candidateChapter.idref}:${candidateChapter.href}`,
      });
    }
    if (referenceChapter.failure || candidateChapter.failure) {
      warnings.push({
        type: "chapter.load.failure",
        message: `index:${index} idref:${referenceChapter.idref} reference:${JSON.stringify(referenceChapter.failure ?? "")} candidate:${JSON.stringify(candidateChapter.failure ?? "")}`,
      });
      continue;
    }
    const contentWarning = compareChapterContent(
      index,
      referenceChapter,
      candidateChapter
    );
    if (contentWarning) warnings.push(contentWarning);
  }
  return warnings;
}

function compareChapterContent(
  index: number,
  reference: Chapter,
  candidate: Chapter
): ComparisonWarning {
  if (reference.xhtml === candidate.xhtml) {
    return {
      type: "chapter.content.raw",
      message: `index:${index} idref:${reference.idref} strictest:raw`,
    };
  }

  if (reference.canonicalXhtml === candidate.canonicalXhtml) {
    return {
      type: "chapter.content.canonical",
      message: `index:${index} idref:${reference.idref} strictest:canonical`,
    };
  }

  const referenceText = normalizeChapterText(reference.text);
  const candidateText = normalizeChapterText(candidate.text);
  if (referenceText === candidateText) {
    return {
      type: "chapter.content.text",
      message: [
        `index:${index}`,
        `idref:${reference.idref}`,
        "strictest:text",
        `referenceCanonical:length=${reference.canonicalXhtml.length},sha256=${stableHash(reference.canonicalXhtml)}`,
        `candidateCanonical:length=${candidate.canonicalXhtml.length},sha256=${stableHash(candidate.canonicalXhtml)}`,
        `canonicalDiff:${firstDifference(reference.canonicalXhtml, candidate.canonicalXhtml)}`,
      ].join(" "),
    };
  }

  return {
    type: "chapter.content.mismatch",
    message: [
      `index:${index}`,
      `idref:${reference.idref}`,
      "strictest:none",
      `reference:length=${referenceText.length},sha256=${stableHash(referenceText)}`,
      `candidate:length=${candidateText.length},sha256=${stableHash(candidateText)}`,
      `diff:${firstDifference(referenceText, candidateText)}`,
    ].join(" "),
  };
}

function normalizeChapterText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\r\n?/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

/** Comparison-only repair for linkedom textContent retaining entity syntax. */
function decodeHtmlEntities(text: string): string {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return text.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z][\da-z]+));/gi,
    (entity, decimal: string, hexadecimal: string, name: string) => {
      if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
      if (hexadecimal) {
        return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      }
      return named[name.toLowerCase()] ?? entity;
    }
  );
}

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

function firstDifference(reference: string, candidate: string): string {
  let index = 0;
  while (
    index < reference.length &&
    index < candidate.length &&
    reference[index] === candidate[index]
  ) {
    index++;
  }
  const start = Math.max(0, index - 40);
  const end = index + 80;
  return `offset=${index},reference=${JSON.stringify(reference.slice(start, end))},candidate=${JSON.stringify(candidate.slice(start, end))}`;
}

export function compareMetadata(
  reference: Metadata,
  candidate: Metadata
): ComparisonWarning[] {
  const warnings: ComparisonWarning[] = [];
  for (const field of Object.keys(reference) as Array<keyof Metadata>) {
    const referenceValue = normalizeMetadataForComparison(
      field,
      reference[field]
    );
    const candidateValue = normalizeMetadataForComparison(
      field,
      candidate[field]
    );
    if (referenceValue !== candidateValue) {
      warnings.push({
        type: "metadata.field.mismatch",
        message: `field:${field} reference:${JSON.stringify(referenceValue)} candidate:${JSON.stringify(candidateValue)}`,
      });
    }
  }
  return warnings;
}

function normalizeMetadataForComparison(
  _field: keyof Metadata,
  value: string
): string {
  return value.replace(/\r\n?/g, "\n");
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
