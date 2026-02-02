import type { AudioMetadata } from "./ffprobe.js";

export interface ProgressState {
  total: number;
  processed: number;
  running: number;
  elapsed: number;
  inFlight: string[];
}

export interface AppState {
  files: AudioMetadata[];
  progress: ProgressState;
  phase: "scanning" | "extracting" | "results";
}
