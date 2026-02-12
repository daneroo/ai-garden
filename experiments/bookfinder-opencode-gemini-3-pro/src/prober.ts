import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AudioFile, AudioMetadata } from "./types.js";

const execFileAsync = promisify(execFile);

// ffprobe JSON output types (partial)
interface FfprobeOutput {
  format?: {
    duration?: string;
    bit_rate?: string;
    tags?: {
      title?: string;
      artist?: string;
      [key: string]: string | undefined;
    };
  };
  streams?: Array<{
    codec_type: string;
    codec_name: string;
    [key: string]: unknown;
  }>;
}

export async function probeFile(file: AudioFile): Promise<AudioMetadata> {
  try {
    const { stdout } = await execFileAsync(
      "ffprobe",
      [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_format",
        "-show_streams",
        file.absolutePath,
      ],
      { timeout: 30000 }, // 30s timeout
    );

    const data = JSON.parse(stdout) as FfprobeOutput;

    // Extract metadata
    const format = data.format || {};
    const audioStream = data.streams?.find((s) => s.codec_type === "audio");

    const duration = parseFloat(format.duration || "0");
    const bitrate = Math.round(parseFloat(format.bit_rate || "0") / 1000); // bps -> kbps
    const codec = audioStream?.codec_name || "unknown";
    const title = format.tags?.title;
    const artist = format.tags?.artist;

    return {
      ...file,
      duration,
      bitrate,
      codec,
      title,
      artist,
    };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    // Return with error field instead of throwing, so we can display/log it
    return {
      ...file,
      duration: 0,
      bitrate: 0,
      codec: "error",
      error: errorMessage,
    };
  }
}
