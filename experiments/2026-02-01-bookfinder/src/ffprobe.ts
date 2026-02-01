import type { ProbeMetadata } from "./types";

type FfprobeJson = {
  format?: {
    duration?: string;
    bit_rate?: string;
    tags?: Record<string, string | undefined>;
  };
  streams?: Array<{
    codec_type?: string;
    codec_name?: string;
    bit_rate?: string;
    tags?: Record<string, string | undefined>;
  }>;
};

function getTag(tags: Record<string, string | undefined> | undefined, key: string): string | null {
  if (!tags) return null;
  const direct = tags[key];
  if (typeof direct === "string" && direct.trim() !== "") return direct;

  const lower = key.toLowerCase();
  for (const [k, v] of Object.entries(tags)) {
    if (k.toLowerCase() === lower && typeof v === "string" && v.trim() !== "") {
      return v;
    }
  }
  return null;
}

function parseNumber(input: string | undefined): number | null {
  if (!input) return null;
  const n = Number(input);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function parseFfprobeJson(jsonText: string): ProbeMetadata {
  const data = JSON.parse(jsonText) as FfprobeJson;
  const streams = data.streams ?? [];
  const audioStream = streams.find((s) => s.codec_type === "audio") ?? streams[0];

  const durationSeconds = parseNumber(data.format?.duration) ?? null;

  const bitrateBps =
    parseNumber(data.format?.bit_rate) ?? (audioStream ? parseNumber(audioStream.bit_rate) : null);
  const bitrateKbps = bitrateBps != null ? Math.round(bitrateBps / 1000) : null;

  const codec = audioStream?.codec_name ?? null;

  const title =
    getTag(data.format?.tags, "title") ??
    getTag(data.format?.tags, "TITLE") ??
    getTag(audioStream?.tags, "title") ??
    getTag(audioStream?.tags, "TITLE");

  const artist =
    getTag(data.format?.tags, "artist") ??
    getTag(data.format?.tags, "ARTIST") ??
    getTag(audioStream?.tags, "artist") ??
    getTag(audioStream?.tags, "ARTIST");

  return {
    durationSeconds,
    bitrateKbps,
    codec,
    title,
    artist,
  };
}

export async function ensureFfprobeAvailable(): Promise<void> {
  try {
    const proc = Bun.spawn({
      cmd: ["ffprobe", "-version"],
      stdout: "ignore",
      stderr: "ignore",
    });
    const code = await proc.exited;
    if (code !== 0) {
      throw new Error(`ffprobe exited with code ${code}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`ffprobe is required but was not found or failed to run: ${msg}`);
  }
}

export async function probeFileWithFfprobe(
  filePath: string,
  timeoutMs: number,
): Promise<ProbeMetadata> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const proc = Bun.spawn({
      cmd: [
        "ffprobe",
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        filePath,
      ],
      stdout: "pipe",
      stderr: "pipe",
      signal: ac.signal,
    });

    const [stdout, stderr, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);

    if (code !== 0) {
      throw new Error(`ffprobe exited with code ${code}${stderr ? `: ${stderr.trim()}` : ""}`);
    }

    return parseFfprobeJson(stdout);
  } catch (err) {
    if (ac.signal.aborted) {
      throw new Error(`ffprobe timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}
