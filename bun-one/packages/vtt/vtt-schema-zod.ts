import { z } from "zod";

/**
 * 1. SHARED COMPONENTS
 */
export const VttCueSchema = z.object({
  startTime: z.string(),
  endTime: z.string(),
  text: z.string(),
});

/**
 * The foundation for all metadata.
 */
const ProvenanceBaseSchema = z.object({
  input: z.string(),
  model: z.string(),
  wordTimestamps: z.boolean(),
  generated: z.iso.datetime(),
  elapsedMs: z.number(),
});

/**
 * 2. PROVENANCE DERIVATIVES (DRY)
 */

// Transcription Provenance
export const ProvenanceTranscriptionSchema = ProvenanceBaseSchema.extend({
  durationSec: z.number().optional(),
});

// Segment Provenance
export const ProvenanceSegmentSchema = ProvenanceBaseSchema.extend({
  segment: z.number(),
  startSec: z.number(),
  durationSec: z.number().optional(),
});

// Composition Provenance
export const ProvenanceCompositionSchema = ProvenanceBaseSchema.extend({
  segments: z.number(),
  durationSec: z.number().optional(),
});

/**
 * 3. ARTIFACT SCHEMAS
 */

export const VttRawSchema = z.object({
  cues: z.array(VttCueSchema),
});

export const VttTranscriptionSchema = z.object({
  provenance: ProvenanceTranscriptionSchema,
  cues: z.array(VttCueSchema),
});

export const VttSegmentSchema = z.object({
  provenance: ProvenanceSegmentSchema,
  cues: z.array(VttCueSchema),
});

export const VttCompositionSchema = z.object({
  provenance: ProvenanceCompositionSchema,
  segments: z.array(VttSegmentSchema),
});

/**
 * 4. MASTER UNION (Standard Schema Compliant)
 * Zod checks these in order; Composition is most specific.
 */
export const VttFileSchema = z.union([
  VttCompositionSchema,
  VttTranscriptionSchema,
  VttRawSchema,
]);

/**
 * 5. DERIVED TYPES (DRY)
 */

// Provenance Types
export type ProvenanceBase = z.infer<typeof ProvenanceBaseSchema>;
export type ProvenanceTranscription = z.infer<
  typeof ProvenanceTranscriptionSchema
>;
export type ProvenanceSegment = z.infer<typeof ProvenanceSegmentSchema>;
export type ProvenanceComposition = z.infer<typeof ProvenanceCompositionSchema>;
// Type-only union — no ProvenanceSchema because the parser always knows which
// subtype to validate from the artifact context (unlike VttFile where the
// parser must discriminate).
export type Provenance =
  | ProvenanceTranscription
  | ProvenanceSegment
  | ProvenanceComposition;

// Root Types
export type VttCue = z.infer<typeof VttCueSchema>;
export type VttRaw = z.infer<typeof VttRawSchema>;
export type VttTranscription = z.infer<typeof VttTranscriptionSchema>;
export type VttSegment = z.infer<typeof VttSegmentSchema>;
export type VttComposition = z.infer<typeof VttCompositionSchema>;

// The polymorphic file type
export type VttFile = z.infer<typeof VttFileSchema>;
