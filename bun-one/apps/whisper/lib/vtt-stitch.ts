/**
 * VTT stitching utilities for combining segment VTTs into a final output.
 */

import { writeFile } from "node:fs/promises";
import {
  isVttSegmentProvenance,
  type VttCue,
  type VttProvenance,
  type VttSegmentProvenance,
  vttTimeToSeconds,
} from "./vtt.ts";

/**
 * Convert seconds to VTT timestamp format (HH:MM:SS.mmm)
 *
 * @param sec - Time in seconds
 * @returns VTT timestamp string
 *
 * @example
 * secondsToVttTime(3661.5) // "01:01:01.500"
 * secondsToVttTime(90.123) // "00:01:30.123"
 */
export function secondsToVttTime(sec: number): string {
  if (sec < 0) {
    throw new Error("Time cannot be negative");
  }

  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = seconds.toFixed(3).padStart(6, "0"); // "SS.mmm"

  return `${hh}:${mm}:${ss}`;
}

/**
 * Shift all cue timestamps by a given offset.
 *
 * @param cues - Array of VTT cues
 * @param offsetSec - Offset in seconds to add to all timestamps
 * @returns New array of cues with shifted timestamps
 */
export function shiftVttCues(cues: VttCue[], offsetSec: number): VttCue[] {
  return cues.map((cue) => ({
    startTime: secondsToVttTime(vttTimeToSeconds(cue.startTime) + offsetSec),
    endTime: secondsToVttTime(vttTimeToSeconds(cue.endTime) + offsetSec),
    text: cue.text,
  }));
}

export interface SegmentCueBoundary {
  segment: number;
  cueIndex: number;
}

export interface VttWriteOptions {
  provenance?: VttProvenance[];
  segmentBoundaries?: SegmentCueBoundary[];
}

/**
 * Format VTT cues as a VTT file string.
 *
 * @param cues - Array of VTT cues
 * @param options - Optional provenance and segment boundary metadata
 * @returns VTT file content as string
 */
export function formatVtt(
  cues: VttCue[],
  options: VttWriteOptions = {},
): string {
  const lines = ["WEBVTT", ""];
  const provenance = options.provenance ?? [];
  const { headerProvenance, segmentProvenance } = splitProvenance(provenance);

  for (const entry of headerProvenance) {
    addProvenanceNote(lines, entry);
  }

  const segmentBoundaries = options.segmentBoundaries ?? [];
  const hasBoundaryData =
    segmentBoundaries.length > 0 && segmentProvenance.length > 0;

  if (hasBoundaryData) {
    const segmentProvenanceBySegment = new Map<
      number,
      VttSegmentProvenance[]
    >();
    for (const entry of segmentProvenance) {
      const existing = segmentProvenanceBySegment.get(entry.segment) ?? [];
      existing.push(entry);
      segmentProvenanceBySegment.set(entry.segment, existing);
    }

    const orderedBoundaries = [...segmentBoundaries].sort((a, b) => {
      if (a.cueIndex !== b.cueIndex) {
        return a.cueIndex - b.cueIndex;
      }
      return a.segment - b.segment;
    });

    let boundaryIndex = 0;
    const emitBoundaryNotes = (cueIndex: number) => {
      while (
        boundaryIndex < orderedBoundaries.length &&
        (orderedBoundaries[boundaryIndex]?.cueIndex ??
          Number.POSITIVE_INFINITY) <= cueIndex
      ) {
        const boundary = orderedBoundaries[boundaryIndex];
        boundaryIndex++;
        if (!boundary) {
          continue;
        }
        const entries = segmentProvenanceBySegment.get(boundary.segment);
        const nextEntry = entries?.shift();
        if (nextEntry) {
          addProvenanceNote(lines, nextEntry);
        }
      }
    };

    for (let i = 0; i < cues.length; i++) {
      emitBoundaryNotes(i);
      const cue = cues[i];
      if (!cue) {
        continue;
      }
      lines.push(`${cue.startTime} --> ${cue.endTime}`);
      lines.push(cue.text);
      lines.push("");
    }

    emitBoundaryNotes(cues.length);

    for (const entries of segmentProvenanceBySegment.values()) {
      for (const entry of entries) {
        addProvenanceNote(lines, entry);
      }
    }

    return lines.join("\n");
  }

  for (const entry of segmentProvenance) {
    addProvenanceNote(lines, entry);
  }

  for (const cue of cues) {
    lines.push(`${cue.startTime} --> ${cue.endTime}`);
    lines.push(cue.text);
    lines.push("");
  }

  return lines.join("\n");
}

function splitProvenance(provenance: VttProvenance[]): {
  headerProvenance: VttProvenance[];
  segmentProvenance: VttSegmentProvenance[];
} {
  const headerProvenance: VttProvenance[] = [];
  const segmentProvenance: VttSegmentProvenance[] = [];

  for (const entry of provenance) {
    if (isVttSegmentProvenance(entry)) {
      segmentProvenance.push(entry);
      continue;
    }
    headerProvenance.push(entry);
  }

  return { headerProvenance, segmentProvenance };
}

function addProvenanceNote(lines: string[], provenance: VttProvenance): void {
  lines.push("NOTE Provenance");
  lines.push(JSON.stringify(provenance));
  lines.push("");
}

/**
 * Write VTT cues to a file.
 *
 * @param path - Output file path
 * @param cues - Array of VTT cues
 * @param options - Optional provenance and segment boundary metadata
 */
export async function writeVtt(
  path: string,
  cues: VttCue[],
  options: VttWriteOptions = {},
): Promise<void> {
  await writeFile(path, formatVtt(cues, options), "utf-8");
}

/**
 * Segment info needed for stitching
 */
export interface SegmentVttInfo {
  cues: VttCue[];
  startSec: number; // Segment start time (for offset calculation)
}

/**
 * Stitch multiple segment VTTs into a single VTT.
 * Uses concat strategy (simple concatenation with timestamp offset).
 *
 * For overlap > 0, a smart stitcher will be needed (deferred).
 *
 * @param segments - Array of segment VTT info (cues and start times)
 * @returns Combined VTT cues with absolute timestamps
 */
export function stitchVttConcat(segments: SegmentVttInfo[]): VttCue[] {
  const result: VttCue[] = [];

  for (const segment of segments) {
    // Shift cues by segment start time to get absolute timestamps
    const shiftedCues = shiftVttCues(segment.cues, segment.startSec);
    result.push(...shiftedCues);
  }

  return result;
}
