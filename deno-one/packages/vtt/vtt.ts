export interface VttCue {
  start: number;
  end: number;
  text: string;
}

export function parseVtt(_content: string): VttCue[] {
  // Minimal stub - parse WebVTT format
  const cues: VttCue[] = [];
  // TODO: Implement actual VTT parsing
  return cues;
}

export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = (seconds % 60).toFixed(3);
  return `${h.toString().padStart(2, "0")}:${
    m
      .toString()
      .padStart(2, "0")
  }:${s.padStart(6, "0")}`;
}
