import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const CACHE_ROOT = join(import.meta.dir, "..", "data", "cache");

function ensureDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get WAV cache path. Caller provides full base name (e.g., "hobbit" or "hobbit-seg00-d10m-ov0s").
 */
export function getWavCachePath(baseName: string): string {
  const dir = join(CACHE_ROOT, "wav");
  ensureDir(dir);
  return join(dir, `${baseName}.wav`);
}

/**
 * Get VTT cache path. Caller provides full base name.
 * offsetMs/durationMs are the --offset-t and --duration values passed to whisper-cli.
 */
export function getVttCachePath(
  baseName: string,
  model: string,
  wordTimestamps: boolean,
  offsetMs: number = 0,
  durationMs: number = 0,
): string {
  const dir = join(CACHE_ROOT, "vtt");
  ensureDir(dir);
  const m = model.replace(/\./g, "-");
  const wt = wordTimestamps ? "wt1" : "wt0";
  const off = offsetMs > 0 ? `-off${offsetMs}` : "";
  const dur = durationMs > 0 ? `-dur${durationMs}` : "";
  return join(dir, `${baseName}-m${m}-${wt}${off}${dur}.vtt`);
}
