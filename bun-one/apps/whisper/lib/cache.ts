import { existsSync, mkdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

// Cache directory for converted audio files (relative to whisper app)
const CACHE_DIR = join(import.meta.dir, "..", "data", "cache");

/**
 * Ensure the cache directory exists, creating it if necessary.
 */
export function ensureCacheDir(): void {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Get the cache path for a converted audio file.
 * Uses basename only - collisions possible if two source files share a name.
 *
 * @param inputPath - Path to the original audio file
 * @param format - Target format (e.g., "wav", "mp3")
 * @returns Absolute path to the cached file
 */
export function getCachePath(inputPath: string, format: string): string {
  const inputName = basename(inputPath, extname(inputPath));
  return join(CACHE_DIR, `${inputName}.${format}`);
}
