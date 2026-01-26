/**
 * VTT stitching utilities for combining segment VTTs into a final output.
 */

import { writeFile } from "node:fs/promises";
import { type VttCue, vttTimeToSeconds } from "./vtt.ts";

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

/**
 * Format VTT cues as a VTT file string.
 *
 * @param cues - Array of VTT cues
 * @returns VTT file content as string
 */
export function formatVtt(cues: VttCue[]): string {
  const lines = ["WEBVTT", ""];

  for (const cue of cues) {
    lines.push(`${cue.startTime} --> ${cue.endTime}`);
    lines.push(cue.text);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Write VTT cues to a file.
 *
 * @param path - Output file path
 * @param cues - Array of VTT cues
 */
export async function writeVtt(path: string, cues: VttCue[]): Promise<void> {
  await writeFile(path, formatVtt(cues), "utf-8");
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
