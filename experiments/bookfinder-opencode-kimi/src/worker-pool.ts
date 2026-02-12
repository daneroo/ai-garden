import type { AudioFile } from "./scanner.js";
import { extractMetadata, type AudioMetadata } from "./ffprobe.js";

export interface ProgressCallback {
  (processed: number, total: number, running: number, inFlight: string[]): void;
}

export async function extractAllMetadata(
  files: AudioFile[],
  concurrency: number,
  onProgress?: ProgressCallback
): Promise<AudioMetadata[]> {
  const results: AudioMetadata[] = [];
  const inFlight = new Set<string>();
  let nextIndex = 0;
  let completed = 0;
  const total = files.length;

  async function worker(): Promise<void> {
    while (nextIndex < files.length) {
      const file = files[nextIndex]!;
      nextIndex++;

      inFlight.add(file.relativePath);
      onProgress?.(completed, total, inFlight.size, Array.from(inFlight));

      const metadata = await extractMetadata(file.path, file.relativePath, file.size);

      inFlight.delete(file.relativePath);
      completed++;

      if (metadata) {
        results.push(metadata);
      }

      onProgress?.(completed, total, inFlight.size, Array.from(inFlight));
    }
  }

  // Spawn N workers that compete for files
  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker());
  await Promise.all(workers);

  return results;
}
