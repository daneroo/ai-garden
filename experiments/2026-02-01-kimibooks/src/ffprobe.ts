import { spawn } from "child_process";

export interface AudioMetadata {
  path: string;
  relativePath: string;
  size: number;
  duration: number;
  bitrate: number;
  codec: string;
  title?: string;
  artist?: string;
}

interface FfprobeOutput {
  format?: {
    duration?: string;
    bit_rate?: string;
    tags?: {
      title?: string;
      artist?: string;
    };
  };
  streams?: Array<{
    codec_name?: string;
    codec_type?: string;
  }>;
}

export function extractMetadata(
  filePath: string,
  relativePath: string,
  size: number,
  timeoutMs = 30000
): Promise<AudioMetadata | null> {
  return new Promise((resolve) => {
    const args = [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ];

    const child = spawn("ffprobe", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
      console.error(`Timeout: ${relativePath}`);
      resolve(null);
    }, timeoutMs);

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (timedOut) return;

      if (code !== 0) {
        console.error(`ffprobe failed for ${relativePath}: ${stderr}`);
        resolve(null);
        return;
      }

      try {
        const output: FfprobeOutput = JSON.parse(stdout);
        const format = output.format || {};
        const audioStream = (output.streams || []).find((s) => s.codec_type === "audio");

        const duration = parseFloat(format.duration || "0");
        const bitrate = Math.round(parseFloat(format.bit_rate || "0") / 1000);

        resolve({
          path: filePath,
          relativePath,
          size,
          duration,
          bitrate,
          codec: audioStream?.codec_name || "unknown",
          title: format.tags?.title,
          artist: format.tags?.artist,
        });
      } catch {
        console.error(`Failed to parse ffprobe output for ${relativePath}`);
        resolve(null);
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      console.error(`ffprobe error for ${relativePath}: ${err.message}`);
      resolve(null);
    });
  });
}
