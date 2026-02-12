import { execFile } from "node:child_process";
import { type ScannedFile } from "./scanner.ts";

const PROBE_TIMEOUT_MS = 30_000;

export interface AudioMetadata {
  relativePath: string;
  absolutePath: string;
  size: number;
  duration: number;
  bitrate: number;
  codec: string;
  title: string | null;
  artist: string | null;
}

interface FfprobeStream {
  codec_name?: string;
  codec_type?: string;
  bit_rate?: string;
  duration?: string;
}

interface FfprobeFormat {
  duration?: string;
  bit_rate?: string;
  tags?: Record<string, string>;
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: FfprobeFormat;
}

function parseProbeOutput(raw: string, file: ScannedFile): AudioMetadata | null {
  let data: FfprobeOutput;
  try {
    data = JSON.parse(raw) as FfprobeOutput;
  } catch {
    return null;
  }

  const format = data.format;
  if (!format) return null;

  const audioStream = data.streams?.find((s) => s.codec_type === "audio");

  const duration = parseFloat(format.duration ?? audioStream?.duration ?? "0");
  const bitrate = Math.round(parseInt(format.bit_rate ?? audioStream?.bit_rate ?? "0", 10) / 1000);
  const codec = audioStream?.codec_name ?? "unknown";
  const title = format.tags?.title ?? format.tags?.TITLE ?? null;
  const artist = format.tags?.artist ?? format.tags?.ARTIST ?? null;

  return {
    relativePath: file.relativePath,
    absolutePath: file.absolutePath,
    size: file.size,
    duration,
    bitrate,
    codec,
    title,
    artist,
  };
}

function probeFile(file: ScannedFile): Promise<AudioMetadata | null> {
  return new Promise((resolve) => {
    execFile(
      "ffprobe",
      ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", file.absolutePath],
      { timeout: PROBE_TIMEOUT_MS },
      (err, stdout) => {
        if (err) {
          resolve(null);
          return;
        }
        resolve(parseProbeOutput(stdout, file));
      },
    );
  });
}

export async function probeFiles(
  files: ScannedFile[],
  concurrency: number,
  onProgress?: (completed: number, total: number, inFlight: string[]) => void,
): Promise<{ results: AudioMetadata[]; errors: string[] }> {
  const results: AudioMetadata[] = [];
  const errors: string[] = [];
  const inFlight = new Set<string>();
  let completed = 0;
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < files.length) {
      const file = files[nextIndex]!;
      nextIndex++;

      inFlight.add(file.relativePath);
      onProgress?.(completed, files.length, [...inFlight]);

      const metadata = await probeFile(file);

      inFlight.delete(file.relativePath);
      completed++;

      if (metadata) {
        results.push(metadata);
      } else {
        errors.push(file.relativePath);
      }

      onProgress?.(completed, files.length, [...inFlight]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => runNext());
  await Promise.all(workers);

  results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return { results, errors };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Exported for testing
export { parseProbeOutput };
