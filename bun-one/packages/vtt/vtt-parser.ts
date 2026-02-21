/**
 * VTT PARSER (semantic layer)
 *
 * Transforms raw VTT text into typed artifacts (VttRaw, VttTranscription,
 * VttComposition) via block parsing, convention checking, provenance JSON
 * parsing, segment grouping, and schema validation.
 *
 * Schema validation uses the Standard Schema interface (~validate), so the
 * caller decides which library (zod or valibot) backs it.
 */
import type { StandardSchemaV1 } from "@standard-schema/spec";
import {
  aggregateBlocks,
  checkNoRegionBlocksConvention,
  checkNoStyleBlocksConvention,
  checkOnlyProvenanceNotesConvention,
  validateBlocks,
  type BlockChecker,
  type VttBlock,
} from "./vtt-block-parser.ts";
import type {
  VttComposition,
  VttCue,
  VttFile,
  VttRaw,
  VttTranscription,
} from "./vtt-schema-zod.ts";
import { vttTimeToSeconds } from "./vtt-time.ts";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ParseResult<T = VttFile> {
  value: T;
  warnings: string[];
}

export interface ParseOptions {
  strict?: boolean;
  schema?: StandardSchemaV1<unknown, VttFile>;
}

export type SchemaImpl = "zod" | "valibot";

export type ClassifiedVttFile =
  | { type: "composition"; value: VttComposition }
  | { type: "transcription"; value: VttTranscription }
  | { type: "raw"; value: VttRaw };

// ---------------------------------------------------------------------------
// Sugar — strict, narrowed, just give me the thing or throw
// ---------------------------------------------------------------------------

export function parseTranscription(
  input: string,
  schema: StandardSchemaV1<unknown, VttFile>,
): VttTranscription {
  const { value } = parseVttFile(input, { strict: true, schema });
  if (!isTranscription(value)) {
    throw new Error(
      "Expected VttTranscription, got a different artifact type.",
    );
  }
  return value;
}

export function parseComposition(
  input: string,
  schema: StandardSchemaV1<unknown, VttFile>,
): VttComposition {
  const { value } = parseVttFile(input, { strict: true, schema });
  if (!isComposition(value)) {
    throw new Error("Expected VttComposition, got a different artifact type.");
  }
  return value;
}

export function parseRaw(
  input: string,
  schema: StandardSchemaV1<unknown, VttFile>,
): VttRaw {
  const { value } = parseVttFile(input, { strict: true, schema });
  if (!isRaw(value)) {
    throw new Error("Expected VttRaw, got a different artifact type.");
  }
  return value;
}

// ---------------------------------------------------------------------------
// Generic parser
// ---------------------------------------------------------------------------

type ArtifactChecker = (artifact: VttFile) => string[];

const BLOCK_CHECKERS: BlockChecker[] = [
  checkNoStyleBlocksConvention,
  checkNoRegionBlocksConvention,
  checkOnlyProvenanceNotesConvention,
];

const ARTIFACT_CHECKERS: ArtifactChecker[] = [
  checkCueMonotonicity,
  checkSegmentIndices,
  checkSegmentCount,
  checkDurationSecPlacement,
];

export function parseVttFile(
  input: string,
  options: ParseOptions = {},
): ParseResult {
  const { strict = false, schema } = options;
  const warnings: string[] = [];

  // 1. Syntactic: text → blocks
  const blocks = aggregateBlocks(input);

  // 2. Block-level convention checks
  warnings.push(...validateBlocks(blocks, BLOCK_CHECKERS, false));

  // 3. Determine artifact type from blocks
  const artifact = buildArtifact(blocks, warnings);

  // 3b. Artifact-level semantic checks
  for (const checker of ARTIFACT_CHECKERS) {
    warnings.push(...checker(artifact));
  }

  // 4. Schema validation (if provided)
  if (schema) {
    const result = schema["~standard"].validate(artifact);
    if ("issues" in result && result.issues) {
      const msgs = result.issues.map(
        (issue) =>
          `Schema: ${issue.path?.map((p) => (typeof p === "object" && "key" in p ? p.key : p)).join(".") ?? "root"}: ${issue.message}`,
      );
      warnings.push(...msgs);
    }
  }

  // 5. Strict: throw if any warnings accumulated
  if (strict && warnings.length > 0) {
    throw new Error(`[VTT PARSE ERRORS]\n${warnings.join("\n")}`);
  }

  return { value: artifact, warnings };
}

// ---------------------------------------------------------------------------
// Convenience wrapper — schema selection by name
// ---------------------------------------------------------------------------

const schemaCache = new Map<SchemaImpl, StandardSchemaV1<unknown, VttFile>>();

function resolveSchema(impl: SchemaImpl): StandardSchemaV1<unknown, VttFile> {
  const cached = schemaCache.get(impl);
  if (cached) return cached;
  // Both schema modules export VttFileSchema as a Standard Schema compliant object.
  // The cast is safe because we control both implementations.
  let schema: StandardSchemaV1<unknown, VttFile>;
  if (impl === "valibot") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    schema = require("./vtt-schema-valibot.ts")
      .VttFileSchema as StandardSchemaV1<unknown, VttFile>;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    schema = require("./vtt-schema-zod.ts").VttFileSchema as StandardSchemaV1<
      unknown,
      VttFile
    >;
  }
  schemaCache.set(impl, schema);
  return schema;
}

/**
 * Parse VTT text with schema validation and classify the result.
 * Convenience wrapper — hides StandardSchema plumbing from consumers.
 */
export function parseVtt(
  input: string,
  options: { strict?: boolean; schema?: SchemaImpl } = {},
): ParseResult<ClassifiedVttFile> {
  const { strict, schema: impl = "zod" } = options;
  const schema = resolveSchema(impl);
  const { value, warnings } = parseVttFile(input, { strict, schema });
  return { value: classifyVttFile(value), warnings };
}

// ---------------------------------------------------------------------------
// Type classification — discriminated return for exhaustive switches
// ---------------------------------------------------------------------------

export function classifyVttFile(value: VttFile): ClassifiedVttFile {
  if (isComposition(value)) return { type: "composition", value };
  if (isTranscription(value)) return { type: "transcription", value };
  return { type: "raw", value: value as VttRaw };
}

// ---------------------------------------------------------------------------
// Artifact construction from blocks
// ---------------------------------------------------------------------------

function buildArtifact(blocks: VttBlock[], warnings: string[]): VttFile {
  const headerProvenance = extractProvenance(blocks[1]);

  // No provenance at all → VttRaw
  if (!headerProvenance) {
    return { cues: extractCues(blocks) } satisfies VttRaw;
  }

  // Composition: header provenance has "segments" field
  if ("segments" in headerProvenance) {
    return buildComposition(blocks, headerProvenance);
  }

  // Transcription: provenance without "segment" or "segments"
  // (Schema validation will verify the shape; we cast here since we're
  // building from parsed JSON and the schema layer runs after construction.)
  if (!("segment" in headerProvenance)) {
    return {
      provenance: headerProvenance as VttTranscription["provenance"],
      cues: extractCues(blocks),
    };
  }

  // Unexpected: a segment provenance as root — treat as transcription with warning
  warnings.push(
    "Root provenance has 'segment' field — expected transcription or composition header.",
  );
  return {
    provenance: headerProvenance as VttTranscription["provenance"],
    cues: extractCues(blocks),
  };
}

function buildComposition(
  blocks: VttBlock[],
  compositionProvenance: Record<string, unknown>,
): VttComposition {
  // Walk blocks after the composition header (index 2+), grouping by
  // NOTE Provenance boundaries into segments.
  const segments: VttComposition["segments"] = [];
  let currentSegmentProv: Record<string, unknown> | null = null;
  let currentCues: VttComposition["segments"][0]["cues"] = [];

  for (let i = 2; i < blocks.length; i++) {
    const block = blocks[i]!;

    if (
      block.type === "NOTE" &&
      block.lines[0]?.startsWith("NOTE Provenance")
    ) {
      // Flush previous segment
      if (currentSegmentProv) {
        segments.push({
          provenance:
            currentSegmentProv as VttComposition["segments"][0]["provenance"],
          cues: currentCues,
        });
      }
      currentSegmentProv = extractProvenance(block);
      currentCues = [];
    } else if (block.type === "CUE") {
      currentCues.push(parseCueBlock(block));
    }
  }
  // Flush last segment
  if (currentSegmentProv) {
    segments.push({
      provenance:
        currentSegmentProv as VttComposition["segments"][0]["provenance"],
      cues: currentCues,
    });
  }

  return {
    provenance: compositionProvenance as VttComposition["provenance"],
    segments,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractProvenance(
  block: VttBlock | undefined,
): Record<string, unknown> | null {
  if (!block || block.type !== "NOTE") return null;
  if (!block.lines[0]?.startsWith("NOTE Provenance")) return null;
  // JSON is on lines after "NOTE Provenance"
  const jsonStr = block.lines.slice(1).join("\n").trim();
  if (!jsonStr) return null;
  try {
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractCues(blocks: VttBlock[]): VttRaw["cues"] {
  return blocks.filter((b) => b.type === "CUE").map(parseCueBlock);
}

function parseCueBlock(block: VttBlock): VttRaw["cues"][0] {
  // A CUE block may have an optional identifier line before the timing line.
  // The timing line contains "-->".
  const timingIndex = block.lines.findIndex((l) => l.includes("-->"));
  if (timingIndex === -1) {
    return { startTime: "", endTime: "", text: block.lines.join("\n") };
  }
  const timingLine = block.lines[timingIndex]!;
  const [startTime = "", endTime = ""] = timingLine
    .split("-->")
    .map((s) => s.trim());
  const text = block.lines
    .slice(timingIndex + 1)
    .join("\n")
    .trim();
  return { startTime, endTime, text };
}

// ---------------------------------------------------------------------------
// Artifact checkers — semantic checks on the constructed artifact
// ---------------------------------------------------------------------------

function allCues(artifact: VttFile): VttCue[] {
  if ("segments" in artifact) return artifact.segments.flatMap((s) => s.cues);
  if ("cues" in artifact) return artifact.cues;
  return [];
}

function checkCueMonotonicity(artifact: VttFile): string[] {
  const cues = allCues(artifact);
  let violations = 0;
  let maxOverlap = 0;
  for (let i = 1; i < cues.length; i++) {
    const prevEnd = vttTimeToSeconds(cues[i - 1]!.endTime);
    const curStart = vttTimeToSeconds(cues[i]!.startTime);
    if (curStart < prevEnd) {
      violations++;
      maxOverlap = Math.max(maxOverlap, prevEnd - curStart);
    }
  }
  if (violations === 0) return [];
  return [
    `Monotonicity: ${violations} violation(s), max overlap ${maxOverlap.toFixed(3)}s.`,
  ];
}

function checkSegmentCount(artifact: VttFile): string[] {
  if (!("segments" in artifact)) return [];
  const declared = artifact.provenance.segments;
  const actual = artifact.segments.length;
  if (declared === actual) return [];
  return [
    `Segment count mismatch: header declares ${declared}, found ${actual}.`,
  ];
}

function checkSegmentIndices(artifact: VttFile): string[] {
  if (!("segments" in artifact)) return [];
  const warnings: string[] = [];
  for (let i = 0; i < artifact.segments.length; i++) {
    const idx = artifact.segments[i]!.provenance.segment;
    if (idx !== i) {
      warnings.push(`Segment ${i}: expected index ${i}, got ${idx}.`);
    }
  }
  return warnings;
}

function checkDurationSecPlacement(artifact: VttFile): string[] {
  if (!("segments" in artifact)) return [];
  const warnings: string[] = [];
  for (let i = 0; i < artifact.segments.length - 1; i++) {
    const prov = artifact.segments[i]!.provenance;
    if ("durationSec" in prov && prov.durationSec != null) {
      warnings.push(
        `Segment ${i}: durationSec is only allowed on the last segment.`,
      );
    }
  }
  return warnings;
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isComposition(value: VttFile): value is VttComposition {
  return "provenance" in value && "segments" in value;
}

function isTranscription(value: VttFile): value is VttTranscription {
  return "provenance" in value && "cues" in value && !("segments" in value);
}

function isRaw(value: VttFile): value is VttRaw {
  return !("provenance" in value) && "cues" in value;
}
