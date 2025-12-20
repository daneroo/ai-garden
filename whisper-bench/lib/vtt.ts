import { readFile } from "node:fs/promises";

/**
 * A single VTT cue (subtitle segment)
 */
export interface VttCue {
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Parse VTT file content into an array of cues
 * @param vtt - The VTT file content as a string
 * @returns Array of cues
 */
export function parseVtt(vtt: string): VttCue[] {
  const lines = vtt.split("\n");
  const cues: VttCue[] = [];
  let currentCue: VttCue = {
    startTime: "",
    endTime: "",
    text: "",
  };

  lines.forEach((line) => {
    if (line.startsWith("WEBVTT") || line.startsWith("NOTE")) {
      // Skip the header and notes
      return;
    }
    if (line.includes("-->")) {
      if (currentCue.text) {
        // Push the previous cue and reset
        cues.push(currentCue);
        currentCue = { startTime: "", endTime: "", text: "" };
      }
      const times = line.split("-->");
      currentCue.startTime = times[0].trim();
      currentCue.endTime = times[1].trim();
    } else if (line.trim() === "") {
      if (currentCue.text) {
        // Push the current cue if it has text and reset
        cues.push(currentCue);
        currentCue = { startTime: "", endTime: "", text: "" };
      }
    } else {
      currentCue.text += line.trim() + "\n"; // Append trimmed line and newline to text
    }
  });

  // Push the last cue if it has content
  if (currentCue.text.trim()) {
    cues.push(currentCue);
  }

  // Trim the resulting cue text
  return cues.map((cue) => ({
    startTime: cue.startTime,
    endTime: cue.endTime,
    text: cue.text.trim(),
  }));
}

/**
 * Read and parse a VTT file
 * @param path - Path to the VTT file
 * @returns Array of cues
 */
export async function readVtt(path: string): Promise<VttCue[]> {
  const content = await readFile(path, "utf-8");
  return parseVtt(content);
}

/**
 * Convert VTT timestamp (HH:MM:SS.mmm) to seconds
 */
export function vttTimeToSeconds(time: string): number {
  const parts = time.split(":");
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return (
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)
    );
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts;
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
}

export function summarizeVtt(cues: VttCue[]): VttSummary {
  if (cues.length === 0) {
    return { cueCount: 0, firstCueStart: "", lastCueEnd: "", durationSec: 0 };
  }
  const firstCueStart = cues[0].startTime;
  const lastCueEnd = cues[cues.length - 1].endTime;
  const durationSec = vttTimeToSeconds(lastCueEnd) -
    vttTimeToSeconds(firstCueStart);
  return {
    cueCount: cues.length,
    firstCueStart,
    lastCueEnd,
    durationSec,
  };
}
