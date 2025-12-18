import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { Buffer } from "node:buffer";
import { getAudioFileDuration } from "./audio.ts";
import { commandExists } from "./preflight.ts";

// Model directory for whisper-cpp
const WHISPER_CPP_MODELS = "models";

// Private executable constants
const WHISPER_CPP_EXEC = "whisper-cli";
const WHISPER_KIT_EXEC = "whisperkit-cli";

// RunnerName must be a non-empty array of valid runner names
export type RunnerName = "whisperkit" | "whispercpp";
export const RUNNER_NAMES: [RunnerName, ...RunnerName[]] = [
  "whisperkit",
  "whispercpp",
];

export type ModelShortName = "tiny.en" | "base.en" | "small.en";

/**
 * Configuration for a whisper benchmark run
 */
export interface RunConfig {
  input: string; // Path to the audio file to transcribe
  runner: RunnerName;
  modelShortName: ModelShortName;
  threads: number;
  startSec: number; // Starting offset in seconds
  durationSec: number; // Duration in seconds (0 = entire file)
  outputDir: string; // Base output dir, engine subdir will be created
  verbosity: number;
  dryRun: boolean;
  wordTimestamps: boolean;
}

/**
 * Result of a single transcription run
 */
export interface RunResult {
  runner: RunnerName;
  command: string;
  dryRun: boolean;
  elapsedSec: number;
  speedup: string;
  outputPath: string;
  logFiles: { stdout: string; stderr: string };
}

/**
 * Normalized progress information for callbacks
 */
export interface ProgressInfo {
  percent: string;
  elapsed?: string;
  remaining?: string;
}

/**
 * Callbacks for runner output (optional, silent if not provided)
 */
export interface RunCallbacks {
  onStart?: (info: {
    runner: RunnerName;
    exec: string;
    outputPath: string;
  }) => void;
  onProgress?: (info: ProgressInfo) => void;
  onComplete?: (result: RunResult) => void;
}

/**
 * Progress update callback type - receives full regex match array
 * match[0] = full matched string
 * match[1..n] = captured groups from the regex
 */
type ProgressCallback = (match: RegExpMatchArray) => void;

/**
 * Run whisper transcription - side-effect-free entry point
 */
export async function runWhisper(
  config: RunConfig,
  callbacks?: RunCallbacks,
): Promise<RunResult> {
  if (config.runner === "whispercpp") {
    return await runWhisperCpp(config, callbacks);
  } else if (config.runner === "whisperkit") {
    return await runWhisperKit(config, callbacks);
  } else {
    // Compile-time check to ensure all runner types are handled
    const _exhaustiveCheck: never = config.runner;
    throw new Error(`Unknown runner: ${_exhaustiveCheck}`);
  }
}

/**
 * Get the executable name for a given runner type
 */
export function getRequiredCommands(config: RunConfig): string[] {
  if (config.runner === "whispercpp") return [WHISPER_CPP_EXEC];
  if (config.runner === "whisperkit") return [WHISPER_KIT_EXEC];
  return [];
}

/**
 * Run whisper-cpp command
 */
async function runWhisperCpp(
  config: RunConfig,
  callbacks?: RunCallbacks,
): Promise<RunResult> {
  const exec = WHISPER_CPP_EXEC;
  const flavor = "cpp";
  const fileLabel = basename(config.input, extname(config.input));
  const outputPath = `${config.outputDir}/${flavor}`;

  callbacks?.onStart?.({ runner: "whispercpp", exec, outputPath });

  if (!config.dryRun) {
    await mkdir(outputPath, { recursive: true });
  }

  const timestamp = getUTCTimestampForFilePath();
  const logPrefix = `${outputPath}/${fileLabel}-${timestamp}`;
  const outPrefix = `${outputPath}/${fileLabel}`;

  // Build args
  const args = [
    "--file",
    config.input,
    "--model",
    `${WHISPER_CPP_MODELS}/ggml-${config.modelShortName}.bin`,
    ...(config.startSec > 0
      ? ["--offset-t", String(config.startSec * 1000)]
      : []),
    ...(config.durationSec > 0
      ? ["--duration", String(config.durationSec * 1000)]
      : []),
    "--output-file",
    outPrefix,
    "--output-json",
    "--output-vtt",
    "--print-progress",
    "--threads",
    String(config.threads),
    ...(config.wordTimestamps ? ["--max-len", "1", "--split-on-word"] : []),
  ];

  const cmdStr = `${exec} ${args.join(" ")}`;

  if (config.dryRun) {
    return {
      runner: "whispercpp",
      command: cmdStr,
      dryRun: true,
      elapsedSec: 0,
      speedup: "N/A",
      outputPath,
      logFiles: { stdout: "", stderr: "" },
    };
  }

  const start = Date.now();

  // Run with progress tracking
  // whisper-cpp outputs progress to stderr in format: "whisper_print_progress_callback: progress = XX%"
  // Regex captures: match[1] = "XX%" (percentage)
  const { stdoutLog, stderrLog } = await runCommandWithProgress(
    exec,
    args,
    logPrefix,
    (match) => callbacks?.onProgress?.({ percent: match[1] }),
    "stderr",
    /progress\s*=\s*(\d+%)/,
  );

  const elapsedSec = Math.round((Date.now() - start) / 1000);
  const speedup = await calculateSpeedup(config, elapsedSec);

  const result: RunResult = {
    runner: "whispercpp",
    command: cmdStr,
    dryRun: false,
    elapsedSec,
    speedup,
    outputPath,
    logFiles: { stdout: stdoutLog, stderr: stderrLog },
  };

  callbacks?.onComplete?.(result);
  return result;
}

/**
 * Run whisperkit-cli command
 */
async function runWhisperKit(
  config: RunConfig,
  callbacks?: RunCallbacks,
): Promise<RunResult> {
  const exec = WHISPER_KIT_EXEC;
  const flavor = "kit";
  const fileLabel = basename(config.input, extname(config.input));
  const outputPath = `${config.outputDir}/${flavor}`;

  callbacks?.onStart?.({ runner: "whisperkit", exec, outputPath });

  if (!config.dryRun) {
    await mkdir(outputPath, { recursive: true });
  }

  const timestamp = getUTCTimestampForFilePath();
  const logPrefix = `${outputPath}/${fileLabel}-${timestamp}`;

  // Build args
  const args = [
    "transcribe",
    "--audio-path",
    config.input,
    "--model",
    config.modelShortName,
    ...(config.startSec > 0 || config.durationSec > 0
      ? [
        "--clip-timestamps",
        String(config.startSec),
        ...(config.durationSec > 0
          ? [String(config.startSec + config.durationSec)]
          : []),
      ]
      : []),
    "--report",
    "--report-path",
    outputPath,
    "--verbose",
    ...(config.wordTimestamps ? ["--word-timestamps"] : []),
  ];

  const cmdStr = `${exec} ${args.join(" ")}`;

  if (config.dryRun) {
    return {
      runner: "whisperkit",
      command: cmdStr,
      dryRun: true,
      elapsedSec: 0,
      speedup: "N/A",
      outputPath,
      logFiles: { stdout: "", stderr: "" },
    };
  }

  const start = Date.now();

  // Run with progress tracking
  // whisperkit outputs progress to stdout with ANSI escape codes for inline updates:
  //   "] XX% | Elapsed Time: X.XX s | Remaining: X.XX s"
  // or when estimating:
  //   "] XX% | Elapsed Time: X.XX s | Remaining: Estimating..."
  //
  // Regex captures:
  //   match[1] = "XX%"              (percentage)
  //   match[2] = "X.XX s"           (elapsed time)
  //   match[3] = "X.XX s" or "Estimating..." (remaining time)
  const { stdoutLog, stderrLog } = await runCommandWithProgress(
    exec,
    args,
    logPrefix,
    (match) =>
      callbacks?.onProgress?.({
        percent: match[1],
        elapsed: match[2],
        remaining: match[3],
      }),
    "stdout",
    /]\s*(\d+%)\s*\|\s*Elapsed Time:\s*([\d.]+\s*s)\s*\|\s*Remaining:\s*([\d.]+\s*s|Estimating\.\.\.)/,
  );

  const elapsedSec = Math.round((Date.now() - start) / 1000);

  // Convert SRT to VTT using ffmpeg if SRT exists
  const srtPath = `${outputPath}/${fileLabel}.srt`;
  const vttPath = `${outputPath}/${fileLabel}.vtt`;
  if (existsSync(srtPath) && commandExists("ffmpeg")) {
    const ffmpegPrefix = `${outputPath}/${fileLabel}-ffmpeg-${timestamp}`;
    await runCommandWithProgress(
      "ffmpeg",
      ["-y", "-hide_banner", "-loglevel", "error", "-i", srtPath, vttPath],
      ffmpegPrefix,
    );
  }

  const speedup = await calculateSpeedup(config, elapsedSec);

  const result: RunResult = {
    runner: "whisperkit",
    command: cmdStr,
    dryRun: false,
    elapsedSec,
    speedup,
    outputPath,
    logFiles: { stdout: stdoutLog, stderr: stderrLog },
  };

  callbacks?.onComplete?.(result);
  return result;
}

/**
 * Run a command with streaming output and progress parsing.
 *
 * Uses node:child_process.spawn for real-time streaming, parsing progress
 * from either stdout or stderr based on the progressStream parameter.
 *
 * Writes stdout and stderr to separate log files (.stdout.log, .stderr.log)
 * because we process them independently for progress parsing. Combining them
 * into a single file would lose proper ordering since data arrives asynchronously.
 *
 * @param command - The executable to run
 * @param args - Command line arguments
 * @param logFilePrefix - Base path for log files (will append .stdout.log and .stderr.log)
 * @param onProgress - Callback invoked when progress regex matches (receives full match array)
 * @param progressStream - Which stream contains progress info: "stdout" or "stderr"
 * @param progressRegex - Regex to extract progress. Capture groups become match[1], match[2], etc.
 *                        Default matches whisper-cpp format: "progress = XX%"
 * @returns Promise with exit code and paths to the created log files
 *
 * @example
 * // whisper-cpp: parse "progress = XX%" from stderr
 * await runCommandWithProgress(cmd, args, log, onProgress, "stderr", /progress\s*=\s*(\d+%)/);
 *
 * // whisperkit: parse "XX% | Elapsed Time: X.XX s | Remaining: X.XX s" from stdout
 * await runCommandWithProgress(cmd, args, log, onProgress, "stdout",
 *   /]\s*(\d+%)\s*\|\s*Elapsed Time:\s*([\d.]+\s*s)\s*\|\s*Remaining:\s*([\d.]+\s*s|Estimating\.\.\.)/
 * );
 */
function runCommandWithProgress(
  command: string,
  args: string[],
  logFilePrefix: string,
  onProgress?: ProgressCallback,
  progressStream: "stdout" | "stderr" = "stderr",
  progressRegex: RegExp = /progress\s*=\s*(\d+%)/,
): Promise<{ code: number; stdoutLog: string; stderrLog: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdoutOutput = "";
    let stderrOutput = "";
    let lastProgress = "";

    // Update display with current progress
    const updateDisplay = (match: RegExpMatchArray) => {
      const key = match[0]; // Use full match as change key
      if (key !== lastProgress) {
        lastProgress = key;
        if (onProgress) {
          onProgress(match);
        }
      }
    };

    // Parse progress from a data chunk
    const parseProgress = (text: string) => {
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        const match = line.match(progressRegex);
        if (match) {
          updateDisplay(match);
        }
      }
    };

    // Handle stdout
    proc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      stdoutOutput += text;
      if (progressStream === "stdout") {
        parseProgress(text);
      }
    });

    // Handle stderr
    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      stderrOutput += text;
      if (progressStream === "stderr") {
        parseProgress(text);
      }
    });

    proc.on("error", (error) => {
      reject(error);
    });

    proc.on("close", async (code) => {
      // Write stdout and stderr to separate log files
      const stdoutLog = `${logFilePrefix}.stdout.log`;
      const stderrLog = `${logFilePrefix}.stderr.log`;
      await writeFile(stdoutLog, stdoutOutput);
      await writeFile(stderrLog, stderrOutput);
      resolve({ code: code ?? 0, stdoutLog, stderrLog });
    });
  });
}

/**
 * Calculate speedup factor (Effective Audio Duration / Elapsed Time).
 *
 * Effective duration is determined by:
 * 1. config.durationSec: If > 0, use this explicit limit.
 * 2. (File Duration - config.startSec): If duration is 0 (rest of file),
 *    calculate remaining audio from start offset.
 *
 * Returns formatted string "XX.X"x or "?" if invalid.
 */
/**
 * Calculate speedup factor (Effective Audio Duration / Elapsed Time).
 *
 * Effective duration is determined by:
 * 1. config.durationSec: If > 0, use this explicit limit.
 * 2. (File Duration - config.startSec): If duration is 0 (rest of file),
 *    calculate remaining audio from start offset.
 *
 * Returns formatted string "XX.X"x or "?" if invalid.
 */
export async function calculateSpeedup(
  config: RunConfig,
  elapsedSec: number,
  getDuration: (path: string) => Promise<number> = getAudioFileDuration,
): Promise<string> {
  if (elapsedSec <= 0) {
    return "?";
  }

  let duration = config.durationSec;
  if (duration <= 0) {
    const fullDuration = await getDuration(config.input);
    duration = Math.max(0, fullDuration - config.startSec);
  }

  if (duration <= 0) {
    return "?";
  }

  return (duration / elapsedSec).toFixed(1);
}

/**
 * Get ISO timestamp for filenames (no colons)
 */
function getUTCTimestampForFilePath(): string {
  return new Date().toISOString().replace(/:/g, "-").slice(0, 19) + "Z";
}
