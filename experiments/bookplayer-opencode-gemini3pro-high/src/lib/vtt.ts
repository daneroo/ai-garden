export interface VttCue {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
}

export function parseVtt(vttContent: string): VttCue[] {
  const cues: VttCue[] = [];
  const lines = vttContent.trim().split(/\r?\n/);

  let currentCue: Partial<VttCue> = {};
  let state: "header" | "id" | "time" | "text" = "header";

  // Regex for VTT timestamp: 00:00:00.000 or 00:00.000
  const timeRegex =
    /((?:\d{2}:)?\d{2}:\d{2}\.\d{3})\s+-->\s+((?:\d{2}:)?\d{2}:\d{2}\.\d{3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "WEBVTT") continue;
    if (line === "") {
      if (currentCue.startTime !== undefined && currentCue.text) {
        cues.push(currentCue as VttCue);
        currentCue = {};
      }
      state = "id"; // Expecting new cue
      continue;
    }

    if (line.includes("-->")) {
      const match = line.match(timeRegex);
      if (match) {
        currentCue.startTime = parseTime(match[1]);
        currentCue.endTime = parseTime(match[2]);
        state = "text";
      }
      continue;
    }

    if (state === "text") {
      currentCue.text = currentCue.text ? currentCue.text + "\n" + line : line;
    } else if (state === "id" && !line.includes("-->")) {
      // Optional ID line
      currentCue.id = line;
    }
  }

  // Push last cue if exists
  if (currentCue.startTime !== undefined && currentCue.text) {
    cues.push(currentCue as VttCue);
  }

  return cues;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(":");
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parseInt(parts[0], 10) * 3600;
    seconds += parseInt(parts[1], 10) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds += parseInt(parts[0], 10) * 60;
    seconds += parseFloat(parts[1]);
  }
  return seconds;
}
