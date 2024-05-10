// parseVTT function

export type VTTCue = {
  startTime: string;
  endTime: string;
  text: string;
};
export function parseVTT(vtt: string): VTTCue[] {
  const lines = vtt.split("\n");
  const cues = [];
  let currentCue = {
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

  // trim the resulting cues
  return cues.map((cue) => ({
    startTime: cue.startTime,
    endTime: cue.endTime,
    text: cue.text.trim(),
  }));
}
