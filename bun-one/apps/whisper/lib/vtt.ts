import { readFile } from "node:fs/promises";

/**
 * A single VTT cue (subtitle segment)
 */
export interface VttCue {
  startTime: string;
  endTime: string;
  text: string;
}

export type VttHeaderProvenance = {
  input: string;
  model: string;
  generated: string;
  segments?: number;
  startSec?: number;
  durationSec?: number;
  durationMs?: number;
  elapsedMs?: number;
  wordTimestamps?: boolean;
  digest?: string;
} & Record<string, unknown>;

export type VttSegmentProvenance = {
  segment: number;
  startSec: number;
  input: string;
} & Record<string, unknown>;

export type VttProvenance = VttHeaderProvenance | VttSegmentProvenance;

export interface VttFile {
  cues: VttCue[];
  provenance: VttProvenance[];
}

export function isVttSegmentProvenance(
  value: VttProvenance,
): value is VttSegmentProvenance {
  return "segment" in value;
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
  return (
    parseSegmentProvenance(parsedObject) ?? parseHeaderProvenance(parsedObject)
  );
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

function parseSegmentProvenance(
  parsed: Record<string, unknown>,
): VttSegmentProvenance | undefined {
  const segment = asFiniteNumber(parsed.segment);
  const startSec = asFiniteNumber(parsed.startSec);
  const input = asString(parsed.input);

  if (segment === undefined || startSec === undefined || input === undefined) {
    return undefined;
  }

  return {
    ...parsed,
    input,
    segment,
    startSec,
  };
}

function parseHeaderProvenance(
  parsed: Record<string, unknown>,
): VttHeaderProvenance | undefined {
  const input = asString(parsed.input);
  const model = asString(parsed.model);
  const generated = asString(parsed.generated);
  const digest = asOptionalString(parsed.digest);
  const segments = asOptionalFiniteNumber(parsed.segments);
  const startSec = asOptionalFiniteNumber(parsed.startSec);
  const durationSec = asOptionalFiniteNumber(parsed.durationSec);
  const durationMs = asOptionalFiniteNumber(parsed.durationMs);
  const elapsedMs = asOptionalFiniteNumber(parsed.elapsedMs);
  const wordTimestamps = asOptionalBoolean(parsed.wordTimestamps);

  if (
    input === undefined ||
    model === undefined ||
    generated === undefined ||
    segments === null ||
    startSec === null ||
    durationSec === null ||
    durationMs === null ||
    elapsedMs === null ||
    wordTimestamps === null ||
    digest === null
  ) {
    return undefined;
  }

  return {
    ...parsed,
    input,
    model,
    generated,
    ...(segments !== undefined ? { segments } : {}),
    ...(startSec !== undefined ? { startSec } : {}),
    ...(durationSec !== undefined ? { durationSec } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
    ...(elapsedMs !== undefined ? { elapsedMs } : {}),
    ...(wordTimestamps !== undefined ? { wordTimestamps } : {}),
    ...(digest !== undefined ? { digest } : {}),
  };
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

function asOptionalFiniteNumber(value: unknown): number | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  return isFiniteNumber(value) ? value : null;
}

function asOptionalBoolean(value: unknown): boolean | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "boolean" ? value : null;
}

function asOptionalString(value: unknown): string | undefined | null {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "string" ? value : null;
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
): VttHeaderProvenance | undefined {
  return provenance.find((p) => !isVttSegmentProvenance(p)) as
    | VttHeaderProvenance
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
