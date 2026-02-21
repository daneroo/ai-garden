import * as v from "valibot";

/**
 * 1. SHARED COMPONENTS
 */
export const VttCueSchema = v.object({
  startTime: v.string(),
  endTime: v.string(),
  text: v.string(),
});

/**
 * The foundation for all metadata.
 */
const ProvenanceBaseSchema = v.object({
  input: v.string(),
  model: v.string(),
  wordTimestamps: v.boolean(),
  generated: v.pipe(v.string(), v.isoTimestamp()),
  elapsedMs: v.number(),
});

/**
 * 2. PROVENANCE DERIVATIVES (DRY)
 */

// Transcription Provenance
export const ProvenanceTranscriptionSchema = v.intersect([
  ProvenanceBaseSchema,
  v.object({ durationSec: v.optional(v.number()) }),
]);

// Segment Provenance
export const ProvenanceSegmentSchema = v.intersect([
  ProvenanceBaseSchema,
  v.object({
    segment: v.number(),
    startSec: v.number(),
    durationSec: v.optional(v.number()),
  }),
]);

// Composition Provenance
export const ProvenanceCompositionSchema = v.intersect([
  ProvenanceBaseSchema,
  v.object({
    segments: v.number(),
    durationSec: v.optional(v.number()),
  }),
]);

/**
 * 3. ARTIFACT SCHEMAS
 */

export const VttRawSchema = v.object({
  cues: v.array(VttCueSchema),
});

export const VttTranscriptionSchema = v.object({
  provenance: ProvenanceTranscriptionSchema,
  cues: v.array(VttCueSchema),
});

export const VttSegmentSchema = v.object({
  provenance: ProvenanceSegmentSchema,
  cues: v.array(VttCueSchema),
});

export const VttCompositionSchema = v.object({
  provenance: ProvenanceCompositionSchema,
  segments: v.array(VttSegmentSchema),
});

/**
 * 4. MASTER UNION (Standard Schema Compliant)
 */
export const VttFileSchema = v.union([
  VttCompositionSchema, // Identified by 'segments'
  VttTranscriptionSchema, // Identified by 'provenance' + 'cues'
  VttRawSchema, // Fallback to 'cues'
]);

/**
 * 5. DERIVED TYPES (DRY)
 */

// Provenance Types
export type ProvenanceBase = v.InferOutput<typeof ProvenanceBaseSchema>;
export type ProvenanceTranscription = v.InferOutput<
  typeof ProvenanceTranscriptionSchema
>;
export type ProvenanceSegment = v.InferOutput<typeof ProvenanceSegmentSchema>;
export type ProvenanceComposition = v.InferOutput<
  typeof ProvenanceCompositionSchema
>;
// Type-only union — no ProvenanceSchema because the parser always knows which
// subtype to validate from the artifact context (unlike VttFile where the
// parser must discriminate).
export type Provenance =
  | ProvenanceTranscription
  | ProvenanceSegment
  | ProvenanceComposition;

// Root Types
export type VttCue = v.InferOutput<typeof VttCueSchema>;
export type VttRaw = v.InferOutput<typeof VttRawSchema>;
export type VttTranscription = v.InferOutput<typeof VttTranscriptionSchema>;
export type VttSegment = v.InferOutput<typeof VttSegmentSchema>;
export type VttComposition = v.InferOutput<typeof VttCompositionSchema>;

// The polymorphic file type
export type VttFile = v.InferOutput<typeof VttFileSchema>;
