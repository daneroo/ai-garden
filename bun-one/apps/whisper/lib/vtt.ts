import { readFile } from "node:fs/promises";

/**
 * A single VTT cue (subtitle segment)
 */
export interface VttCue {
  startTime: string;
  endTime: string;
  text: string;
}

/** Shared fields present on all provenance variants. */
export type VttProvenanceBase = {
  input: string;
  model: string;
  wordTimestamps: boolean;
  generated: string;
  elapsedMs: number;
  // future: digest
};

/** Provenance for a single transcribe output (segment-local VTT). */
export type VttRunProvenance = VttProvenanceBase & {
  /** Clipped segment duration (>0); omitted for full-segment transcription. */
  durationSec?: number;
};

/** Header provenance for a composed (stitched) VTT output. */
export type VttComposedHeaderProvenance = VttProvenanceBase & {
  segments: number; // segment count
  /** Present only when the final segment is clipped; refers to original input. */
  durationSec?: number;
};

/** Per-segment provenance entry inside a composed (stitched) VTT output. */
export type VttComposedSegmentProvenance = VttProvenanceBase & {
  segment: number;
  startSec: number;
  /** Present only on the clipped final segment (>0 remainder). */
  durationSec?: number;
};

export type VttProvenance =
  | VttRunProvenance
  | VttComposedHeaderProvenance
  | VttComposedSegmentProvenance;

export interface VttFile {
  cues: VttCue[];
  provenance: VttProvenance[];
}

export function isVttSegmentProvenance(
  value: VttProvenance,
): value is VttComposedSegmentProvenance {
  return "segment" in value;
}

export function isVttComposedHeaderProvenance(
  value: VttProvenance,
): value is VttComposedHeaderProvenance {
  return "segments" in value;
}

export function isVttRunProvenance(
  value: VttProvenance,
): value is VttRunProvenance {
  return (
    !isVttSegmentProvenance(value) && !isVttComposedHeaderProvenance(value)
  );
}

/**
 * Parse VTT file content into cues and provenance metadata.
 * NOTE blocks are consumed as full blocks; malformed NOTE Provenance JSON is ignored.
 */
export function parseVttFile(vtt: string): VttFile {
  const lines = vtt.split(/\r?\n/);
  const cues: VttCue[] = [];
  const provenance: VttProvenance[] = [];
  let currentCue: VttCue | undefined;

  function pushCurrentCue(): void {
    if (!currentCue) {
      return;
    }
    const text = currentCue.text.trim();
    if (text.length > 0) {
      cues.push({
        startTime: currentCue.startTime,
        endTime: currentCue.endTime,
        text,
      });
    }
    currentCue = undefined;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      pushCurrentCue();
      continue;
    }

    if (trimmed.startsWith("WEBVTT")) {
      continue;
    }

    if (trimmed.startsWith("NOTE")) {
      const noteHeader = trimmed;
      const noteLines: string[] = [];

      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1] ?? "";
        if (nextLine.trim().length === 0) {
          break;
        }
        noteLines.push(nextLine);
        i++;
      }

      if (noteHeader === "NOTE Provenance") {
        const parsed = parseProvenancePayload(noteLines.join("\n").trim());
        if (parsed) {
          provenance.push(parsed);
        }
      }
      continue;
    }

    if (line.includes("-->")) {
      pushCurrentCue();

      const [startPart = "", endPart = ""] = line.split("-->");
      const startTime = startPart.trim().split(/\s+/)[0] ?? "";
      const endTime = endPart.trim().split(/\s+/)[0] ?? "";
      currentCue = {
        startTime,
        endTime,
        text: "",
      };
      continue;
    }

    const nextLine = lines[i + 1] ?? "";
    if (!currentCue && nextLine.includes("-->")) {
      // Cue identifier line.
      continue;
    }

    if (currentCue) {
      const textLine = trimmed;
      currentCue.text = currentCue.text
        ? `${currentCue.text}\n${textLine}`
        : textLine;
    }
  }

  pushCurrentCue();

  return { cues, provenance };
}

/**
 * Parse VTT file content into an array of cues
 * @param vtt - The VTT file content as a string
 * @returns Array of cues
 */
export function parseVtt(vtt: string): VttCue[] {
  return parseVttFile(vtt).cues;
}

export async function readVttFile(path: string): Promise<VttFile> {
  const content = await readFile(path, "utf-8");
  return parseVttFile(content);
}

/**
 * Read and parse a VTT file
 * @param path - Path to the VTT file
 * @returns Array of cues
 */
export async function readVtt(path: string): Promise<VttCue[]> {
  const file = await readVttFile(path);
  return file.cues;
}

function parseProvenancePayload(payload: string): VttProvenance | undefined {
  const parsedObject = parseJsonRecord(payload);
  if (!parsedObject) {
    return undefined;
  }

  if ("segment" in parsedObject) {
    return parseComposedSegmentProvenance(parsedObject);
  }

  if ("segments" in parsedObject) {
    return parseComposedHeaderProvenance(parsedObject);
  }

  return parseRunProvenance(parsedObject);
}

function parseJsonRecord(payload: string): Record<string, unknown> | undefined {
  if (payload.length === 0) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(payload);
    return isRecord(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function parseComposedSegmentProvenance(
  parsed: Record<string, unknown>,
): VttComposedSegmentProvenance | undefined {
  const base = parseProvenanceBase(parsed);
  const segment = asInteger(parsed.segment);
  const startSec = asNonNegativeFiniteNumber(parsed.startSec);
  const durationSec = resolveDurationSec(parsed);

  if (!base || segment === undefined || segment < 0 || startSec === undefined) {
    return undefined;
  }

  return {
    ...base,
    ...(durationSec !== undefined ? { durationSec } : {}),
    segment,
    startSec,
  };
}

function parseComposedHeaderProvenance(
  parsed: Record<string, unknown>,
): VttComposedHeaderProvenance | undefined {
  const base = parseProvenanceBase(parsed);
  const segments = asInteger(parsed.segments);
  const durationSec = resolveDurationSec(parsed);
  if (!base || segments === undefined || segments < 1) {
    return undefined;
  }

  return {
    ...base,
    ...(durationSec !== undefined ? { durationSec } : {}),
    segments,
  };
}

function parseRunProvenance(
  parsed: Record<string, unknown>,
): VttRunProvenance | undefined {
  const base = parseProvenanceBase(parsed);
  const durationSec = resolveDurationSec(parsed);
  if (!base) {
    return undefined;
  }
  return {
    ...base,
    ...(durationSec !== undefined ? { durationSec } : {}),
  };
}

function parseProvenanceBase(
  parsed: Record<string, unknown>,
): VttProvenanceBase | undefined {
  const input = asString(parsed.input);
  const model = asString(parsed.model);
  const generated = asString(parsed.generated);
  const wordTimestamps = asBoolean(parsed.wordTimestamps);
  const elapsedMs = asNonNegativeFiniteNumber(parsed.elapsedMs);

  if (
    input === undefined ||
    model === undefined ||
    generated === undefined ||
    wordTimestamps === undefined ||
    elapsedMs === undefined
  ) {
    return undefined;
  }

  return {
    input,
    model,
    wordTimestamps,
    generated,
    elapsedMs,
  };
}

function resolveDurationSec(
  parsed: Record<string, unknown>,
): number | undefined {
  const durationSec = asNonNegativeFiniteNumber(parsed.durationSec);
  if (durationSec !== undefined && durationSec > 0) {
    return durationSec;
  }

  const durationMs = asNonNegativeFiniteNumber(parsed.durationMs);
  if (durationMs !== undefined && durationMs > 0) {
    return durationMs / 1000;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function asFiniteNumber(value: unknown): number | undefined {
  return isFiniteNumber(value) ? value : undefined;
}

function asNonNegativeFiniteNumber(value: unknown): number | undefined {
  const n = asFiniteNumber(value);
  return n !== undefined && n >= 0 ? n : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function asInteger(value: unknown): number | undefined {
  const n = asFiniteNumber(value);
  return n !== undefined && Number.isInteger(n) ? n : undefined;
}

/**
 * Convert VTT timestamp (HH:MM:SS.mmm) to seconds
 */
export function vttTimeToSeconds(time: string): number {
  const parts = time.split(":");
  if (parts.length === 3) {
    const [hours = "0", minutes = "0", seconds = "0"] = parts;
    return (
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)
    );
  } else if (parts.length === 2) {
    const [minutes = "0", seconds = "0"] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }
  return parseFloat(time);
}

/**
 * Get summary info from parsed VTT cues
 */
export interface VttSummary {
  cueCount: number;
  firstCueStart: string;
  lastCueEnd: string;
  durationSec: number;
  /** Number of cues that start before the previous cue ends */
  monotonicityViolations: number;
  /** Maximum time (in seconds) that a cue overlaps with the previous one */
  monotonicityViolationMaxOverlap: number;
  /** Header + segment provenance parsed from NOTE Provenance blocks */
  provenance: VttProvenance[];
}

export function summarizeVtt(cues: VttCue[]): VttSummary {
  if (cues.length === 0) {
    return {
      cueCount: 0,
      firstCueStart: "",
      lastCueEnd: "",
      durationSec: 0,
      monotonicityViolations: 0,
      monotonicityViolationMaxOverlap: 0,
      provenance: [],
    };
  }

  const firstCue = cues[0];
  const lastCue = cues[cues.length - 1];
  if (!firstCue || !lastCue) {
    return {
      cueCount: cues.length,
      firstCueStart: "",
      lastCueEnd: "",
      durationSec: 0,
      monotonicityViolations: 0,
      monotonicityViolationMaxOverlap: 0,
      provenance: [],
    };
  }

  const firstCueStart = firstCue.startTime;
  const lastCueEnd = lastCue.endTime;
  const durationSec =
    vttTimeToSeconds(lastCueEnd) - vttTimeToSeconds(firstCueStart);

  const { violations, maxOverlap } = checkMonotonicity(cues);

  return {
    cueCount: cues.length,
    firstCueStart,
    lastCueEnd,
    durationSec,
    monotonicityViolations: violations,
    monotonicityViolationMaxOverlap: maxOverlap,
    provenance: [],
  };
}

/** Summarize a parsed VTT file, carrying through its provenance metadata */
export function summarizeVttFile(file: VttFile): VttSummary {
  return { ...summarizeVtt(file.cues), provenance: file.provenance };
}

/** Extract header provenance from a provenance array (the non-segment entry) */
export function getHeaderProvenance(
  provenance: VttProvenance[],
): VttRunProvenance | VttComposedHeaderProvenance | undefined {
  return provenance.find((p) => !isVttSegmentProvenance(p)) as
    | VttRunProvenance
    | VttComposedHeaderProvenance
    | undefined;
}

/**
 * Check for monotonicity violations in cues
 * (where a cue starts before the previous one ends)
 */
export function checkMonotonicity(cues: VttCue[]): {
  violations: number;
  maxOverlap: number;
} {
  let violations = 0;
  let maxOverlap = 0;

  if (cues.length === 0) {
    return { violations, maxOverlap };
  }

  const firstCue = cues[0];
  if (!firstCue) {
    return { violations, maxOverlap };
  }

  let prevEndTimeSec = vttTimeToSeconds(firstCue.endTime);

  for (const cue of cues.slice(1)) {
    const startTimeSec = vttTimeToSeconds(cue.startTime);
    const endTimeSec = vttTimeToSeconds(cue.endTime);

    if (startTimeSec < prevEndTimeSec) {
      violations++;
      const overlap = prevEndTimeSec - startTimeSec;
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
      }
    }
    prevEndTimeSec = endTimeSec;
  }
  return { violations, maxOverlap };
}
