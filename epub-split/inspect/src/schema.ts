// The parser-agnostic ParserOutput schema — the single source of truth for what
// any parser adapter produces. Every TS type below is inferred from its Zod
// schema (never hand-written in parallel), so the schema and the types cannot
// drift.
//
// This schema is the firewall: each adapter returns only a minimal raw
// open-result, and one host-side assembler (Gate 3) builds and validates the
// full object here. Parser-specific mess (LinkeDOM hang, jsdom fallback, raw
// vs. decoded entities, subprocess kills) stays sealed behind ParserOutput;
// nothing downstream — comparison, reporting — ever sees how it was produced.
//
// Shape: { schemaVersion, meta, content? }. `content` is present iff the book
// opened. The sha256 is NOT a field here — it is the on-disk directory key
// (parsers/<sha256>/<parser>.json), so storing it would be redundant.
//
// Determinism: no timestamp, hostname, or run-instant may ever appear here.
// `parserVersion` is genuine provenance (read from the library at runtime);
// wall-clock values are not. strictObject() guards this by rejecting any field
// not modelled below.
import { z } from "zod";

export const PARSER_OUTPUT_SCHEMA_VERSION = 4;

export const parserNameSchema = z.enum([
  "epubts-browser",
  "epubts-node",
  "storyteller",
]);

export const openStatusSchema = z.enum([
  "opened",
  "open-failed",
  "epub2-unsupported",
]);

// Which DOM parser opened the book on the node path. epub.ts uses LinkeDOM by
// default; a few books hang it, so those fall back to jsdom (recorded here).
export const domParserSchema = z.enum(["linkedom", "jsdom"]);

// Only the parser's own error name + message. There is deliberately no `stage`:
// transport/infra failures abort the run loudly, they are not per-book verdicts.
// strictObject() makes a stray `stage` (or any extra key) a validation error.
export const openFailureSchema = z.strictObject({
  category: z.string(),
  message: z.string(),
});

export const metaSchema = z.strictObject({
  parser: parserNameSchema,
  // Read from the library at runtime (epub.ts: ePub.VERSION; storyteller: the
  // installed package version). Never hardcoded; min(1) rejects an empty value.
  parserVersion: z.string().min(1),
  domParser: domParserSchema.optional(),
  openStatus: openStatusSchema,
  openFailure: openFailureSchema.optional(),
});

// Three metadata fields, each required and nullable. `null` means "this parser
// exposed no value". language/publisher/identifier are out of scope — too
// unreliable across parsers to compare.
export const metadataSchema = z.strictObject({
  title: z.string().nullable(),
  creator: z.string().nullable(),
  date: z.string().nullable(),
});

// href is the OPF manifest href, relative to the package document, as-is —
// both parsers read the same OPF so no normalisation is needed. linear is
// captured for future use; comparisons use href-set only for now.
export const spineItemSchema = z.strictObject({
  href: z.string(),
  linear: z.boolean(),
});

// id is the OPF manifest item id attribute. href is the content file path
// relative to the package document. mediaType is null when the parser exposes
// no value. Items are stored sorted by id for determinism (both parsers read
// the same OPF, so ids and hrefs are identical across parsers).
export const manifestItemSchema = z.strictObject({
  id: z.string(),
  href: z.string(),
  mediaType: z.string().nullable(),
});

// sha256 is hex-encoded sha256 of the raw zip entry bytes (UTF-8 string via the
// parser's archive layer). null means the item could not be read (extraction
// failure is recorded, not a hard error). Ordered parallel to content.spine.
export const spineHashItemSchema = z.strictObject({
  href: z.string(),
  sha256: z.string().nullable(),
});

export const contentSchema = z.strictObject({
  metadata: metadataSchema,
  spine: z.array(spineItemSchema),
  manifest: z.array(manifestItemSchema),
  spineHashes: z.array(spineHashItemSchema),
});

export const parserOutputSchema = z
  .strictObject({
    schemaVersion: z.literal(PARSER_OUTPUT_SCHEMA_VERSION),
    meta: metaSchema,
    content: contentSchema.optional(),
  })
  // openStatus drives the presence of content and openFailure.
  .refine((v) => v.meta.openStatus !== "opened" || v.content !== undefined, {
    message: "openStatus 'opened' requires content",
    path: ["content"],
  })
  .refine(
    (v) => v.meta.openStatus !== "opened" || v.meta.openFailure === undefined,
    {
      message: "openStatus 'opened' must not carry openFailure",
      path: ["meta", "openFailure"],
    }
  )
  .refine(
    (v) =>
      v.meta.openStatus !== "open-failed" || v.meta.openFailure !== undefined,
    {
      message: "openStatus 'open-failed' requires openFailure",
      path: ["meta", "openFailure"],
    }
  )
  .refine((v) => v.meta.openStatus !== "open-failed" || v.content === undefined, {
    message: "openStatus 'open-failed' must not carry content",
    path: ["content"],
  })
  // epub2-unsupported is self-describing: no content, and no openFailure (it is
  // expected behaviour for Storyteller, not an error).
  .refine(
    (v) => v.meta.openStatus !== "epub2-unsupported" || v.content === undefined,
    {
      message: "openStatus 'epub2-unsupported' must not carry content",
      path: ["content"],
    }
  )
  .refine(
    (v) =>
      v.meta.openStatus !== "epub2-unsupported" ||
      v.meta.openFailure === undefined,
    {
      message: "openStatus 'epub2-unsupported' must not carry openFailure",
      path: ["meta", "openFailure"],
    }
  )
  // domParser is meaningful only for an opened epubts-node book.
  .refine(
    (v) => v.meta.domParser === undefined || v.meta.parser === "epubts-node",
    {
      message: "domParser is only valid on the epubts-node parser",
      path: ["meta", "domParser"],
    }
  )
  .refine(
    (v) => v.meta.domParser === undefined || v.meta.openStatus === "opened",
    {
      message: "domParser is only valid when openStatus is 'opened'",
      path: ["meta", "domParser"],
    }
  );

export type ParserName = z.infer<typeof parserNameSchema>;
export type OpenStatus = z.infer<typeof openStatusSchema>;
export type DomParser = z.infer<typeof domParserSchema>;
export type OpenFailure = z.infer<typeof openFailureSchema>;
export type Meta = z.infer<typeof metaSchema>;
export type Metadata = z.infer<typeof metadataSchema>;
export type Content = z.infer<typeof contentSchema>;
export type ParserOutput = z.infer<typeof parserOutputSchema>;

// ── Comparison output ───────────────────────────────────────────────────────
//
// A pairwise comparison of two successfully-opened ParserOutputs. The runner
// decides comparability from openStatus *before* calling the comparator, so a
// ComparisonResult only ever describes two opened books (open failures and
// epub2-unsupported are runner-level concerns, never comparison concerns).
//
// This is the result *shape*. The comparator logic that produces it
// (compareBook, exact-lexical compareField) and the parity projection land in
// Gate 6; the report writer (Gate 2) only renders whatever results it is given.
// Like ParserOutput, the sha256 is the on-disk path key
// (comparisons/<sha256>/<parserA>--<parserB>.json), never a stored field.

export const COMPARISON_RESULT_SCHEMA_VERSION = 4;

// Five mutually-exclusive per-field outcomes. `a`/`b` are the values from
// parserA/parserB. Human-readable reports never print a/b — they name the
// parsers explicitly (see the report writer); the a/b form is schema-internal.
export const pairFieldStatusSchema = z.enum([
  "agree", // both present, equal
  "differ", // both present, unequal
  "a-only", // a present, b null
  "b-only", // a null, b present
  "both-null", // neither present
]);

export const fieldComparisonSchema = z.strictObject({
  status: pairFieldStatusSchema,
  a: z.string().nullable(),
  b: z.string().nullable(),
});

export const metadataComparisonSchema = z.strictObject({
  title: fieldComparisonSchema,
  creator: fieldComparisonSchema,
  date: fieldComparisonSchema,
});

// Spine comparison: href-set based. "agree" = identical ordered sequence.
// "differ" = anything else. onlyInA/onlyInB list the asymmetric hrefs; both
// empty with status "differ" means same set but different order.
export const spineComparisonSchema = z.strictObject({
  status: z.enum(["agree", "differ"]),
  countA: z.number().int().nonnegative(),
  countB: z.number().int().nonnegative(),
  onlyInA: z.array(z.string()),
  onlyInB: z.array(z.string()),
});

// Manifest comparison: href-set based (unordered). "agree" = identical href
// sets. "differ" = anything else. onlyInA/onlyInB list asymmetric hrefs.
export const manifestComparisonSchema = z.strictObject({
  status: z.enum(["agree", "differ"]),
  countA: z.number().int().nonnegative(),
  countB: z.number().int().nonnegative(),
  onlyInA: z.array(z.string()),
  onlyInB: z.array(z.string()),
});

// Spine hash comparison: ordered, position by position. "agree" = all non-null
// pairs match AND counts are equal. matchCount + mismatchCount + nullCount = total.
// nullCount covers positions where at least one side failed to extract.
export const spineHashComparisonSchema = z.strictObject({
  status: z.enum(["agree", "differ"]),
  matchCount: z.number().int().nonnegative(),
  mismatchCount: z.number().int().nonnegative(),
  nullCount: z.number().int().nonnegative(),
});

export const comparisonResultSchema = z.strictObject({
  schemaVersion: z.literal(COMPARISON_RESULT_SCHEMA_VERSION),
  // Carried from each meta.parser for reporting only — the comparator itself is
  // parser-agnostic and knows nothing about which parser produced an output.
  parserA: parserNameSchema,
  parserB: parserNameSchema,
  metadata: metadataComparisonSchema,
  spine: spineComparisonSchema,
  manifest: manifestComparisonSchema,
  spineHashes: spineHashComparisonSchema,
});

export type PairFieldStatus = z.infer<typeof pairFieldStatusSchema>;
export type FieldComparison = z.infer<typeof fieldComparisonSchema>;
export type MetadataComparison = z.infer<typeof metadataComparisonSchema>;
export type SpineItem = z.infer<typeof spineItemSchema>;
export type SpineComparison = z.infer<typeof spineComparisonSchema>;
export type ManifestItem = z.infer<typeof manifestItemSchema>;
export type ManifestComparison = z.infer<typeof manifestComparisonSchema>;
export type SpineHashItem = z.infer<typeof spineHashItemSchema>;
export type SpineHashComparison = z.infer<typeof spineHashComparisonSchema>;
export type ComparisonResult = z.infer<typeof comparisonResultSchema>;
