/**
 * @bun-one/vtt — public API
 *
 * Re-exports from internal modules. Consumers should import from
 * "@bun-one/vtt" rather than reaching into individual files.
 */

// Time utilities
export { vttTimeToSeconds, secondsToVttTime } from "./vtt-time.ts";

// Parser
export {
  parseVtt,
  parseVttFile,
  parseTranscription,
  parseComposition,
  parseRaw,
  classifyVttFile,
  type ParseResult,
  type ParseOptions,
  type SchemaImpl,
  type ClassifiedVttFile,
} from "./vtt-parser.ts";

// Stitcher
export {
  stitchVttConcat,
  shiftVttCues,
  type StitchOptions,
} from "./vtt-stitch.ts";

// Schema types (zod-backed, canonical)
export type {
  VttCue,
  VttRaw,
  VttTranscription,
  VttSegment,
  VttComposition,
  VttFile,
  ProvenanceBase,
  ProvenanceTranscription,
  ProvenanceSegment,
  ProvenanceComposition,
  Provenance,
} from "./vtt-schema-zod.ts";

// Schema objects (for runtime validation)
export { VttFileSchema } from "./vtt-schema-zod.ts";
export { VttFileSchema as VttFileSchemaValibot } from "./vtt-schema-valibot.ts";
