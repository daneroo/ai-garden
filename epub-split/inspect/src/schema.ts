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

export const PARSER_OUTPUT_SCHEMA_VERSION = 1;

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

// v1 content is three metadata fields only, each required and nullable. `null`
// means "this parser exposed no value" (distinct from "the schema does not model
// this field yet"). language/publisher/identifier are out of v1 — too unreliable
// across parsers to compare. manifest/spine/toc arrive in later schema versions.
export const metadataSchema = z.strictObject({
  title: z.string().nullable(),
  creator: z.string().nullable(),
  date: z.string().nullable(),
});

export const contentSchema = z.strictObject({
  metadata: metadataSchema,
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
