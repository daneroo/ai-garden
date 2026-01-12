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
      currentCue.startTime = times[0]?.trim() ?? "";
      currentCue.endTime = times[1]?.trim() ?? "";
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
    };
  }

  const { violations, maxOverlap } = checkMonotonicity(cues);

  const firstCue = cues[0]!;
  const lastCue = cues[cues.length - 1]!;
  const firstCueStart = firstCue.startTime;
  const lastCueEnd = lastCue.endTime;
  const durationSec =
    vttTimeToSeconds(lastCueEnd) - vttTimeToSeconds(firstCueStart);
  return {
    cueCount: cues.length,
    firstCueStart,
    lastCueEnd,
    durationSec,
    monotonicityViolations: violations,
    monotonicityViolationMaxOverlap: maxOverlap,
  };
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

  let prevEndTimeSec = vttTimeToSeconds(cues[0]!.endTime);

  for (let i = 1; i < cues.length; i++) {
    const cue = cues[i]!;
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

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3);
  return `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}:${s.padStart(6, "0")}`;
}
