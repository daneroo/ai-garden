import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { existsSync } from "node:fs";
import process from "node:process";
import { getAudioFileDuration } from "./audio.ts";
import { commandExists } from "./preflight.ts";
import { readVtt, summarizeVtt, VttSummary } from "./vtt.ts";
import {
  ffmpegConvertHandler,
  runSubTask,
  SubTaskConfig,
  whisperCppHandler,
  whisperkitHandler,
} from "./command.ts";

// Model directory for whisper-cpp
const WHISPER_CPP_MODELS = "data/models";

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
  outputDir: string; // Final output dir for .vtt
  runWorkDir: string; // Per-run work dir for logs, json, srt, vtt
  tag?: string; // Optional tag appended to output filename
  verbosity: number;
  dryRun: boolean;
  wordTimestamps: boolean;
}

/**
 * Options for creating a per-run work directory
 * These are the minimal params needed for work dir naming
 */
export interface CreateRunWorkDirOptions {
  workDirRoot: string; // Base work dir (e.g., "data/work")
  inputPath: string; // Input file path
  tag?: string; // Optional tag
}

/**
 * Create a unique work directory path for a single run
 * Format: {workDirRoot}/{inputName}[.{tag}]-{timestamp}
 */
export function createRunWorkDir(opts: CreateRunWorkDirOptions): string {
  const inputName = basename(opts.inputPath, extname(opts.inputPath));
  const timestamp = getUTCTimestampForFilePath();
  const namePart = opts.tag ? `${inputName}.${opts.tag}` : inputName;
  return `${opts.workDirRoot}/${namePart}-${timestamp}`;
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
  vttSummary?: VttSummary;
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
  // Save RunConfig to work directory for reproducibility
  if (!config.dryRun) {
    await mkdir(config.runWorkDir, { recursive: true });
    await writeFile(
      `${config.runWorkDir}/runconfig.json`,
      JSON.stringify(config, null, 2),
    );
  }

  let result: RunResult;

  if (config.runner === "whispercpp") {
    result = await runWhisperCpp(config, callbacks);
  } else if (config.runner === "whisperkit") {
    result = await runWhisperKit(config, callbacks);
  } else {
    // Compile-time check to ensure all runner types are handled
    const _exhaustiveCheck: never = config.runner;
    throw new Error(`Unknown runner: ${_exhaustiveCheck}`);
  }

  // Validate VTT and add summary (only for real runs with output)
  if (!result.dryRun && existsSync(result.outputPath)) {
    const cues = await readVtt(result.outputPath);
    result.vttSummary = summarizeVtt(cues);
  }

  return result;
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
  const inputName = basename(config.input, extname(config.input));
  const finalName = config.tag ? `${inputName}.${config.tag}` : inputName;
  const finalVtt = `${config.outputDir}/${finalName}.vtt`;

  // Work directory for intermediate files (already includes timestamp)
  const workPath = config.runWorkDir;

  if (!config.dryRun) {
    await mkdir(config.outputDir, { recursive: true });
    await mkdir(workPath, { recursive: true });
  }

  // File prefix for outputs and logs - work dir is unique per run
  const outPrefix = `${workPath}/${inputName}`;

  // Convert unsupported formats (whisper-cpp doesn't support M4B)
  let audioInput = config.input;
  if (extname(config.input).toLowerCase() === ".m4b") {
    // Use wav for speed (change to "mp3" for smaller files)
    const format = "wav" as const;
    const convertedAudioPath = `${workPath}/${inputName}.${format}`;
    if (!config.dryRun) {
      await runSubTask(
        convertAudioSubTask(
          config.input,
          format,
          convertedAudioPath,
          workPath,
          inputName,
        ),
      );
    }
    audioInput = convertedAudioPath;
  }

  // Build args - outputs go to work dir
  const args = [
    "--file",
    audioInput,
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
      outputPath: finalVtt,
      logFiles: { stdout: "", stderr: "" },
    };
  }

  // Run with progress tracking
  // whisper-cpp outputs progress to stderr: "whisper_print_progress_callback: progress = XX%"
  const stdoutLogPath = `${outPrefix}.stdout.log`;
  const stderrLogPath = `${outPrefix}.stderr.log`;
  const cmdResult = await runSubTask({
    label: "transcribe",
    command: exec,
    args,
    stdoutLogPath,
    stderrLogPath,
    stderr: whisperCppHandler((percent) => process.stderr.write(percent)),
  });

  const elapsedSec = Math.round(cmdResult.elapsedMs / 1000);
  const speedup = await calculateSpeedup(config, elapsedSec);

  // Move VTT from work dir to final output dir
  // TODO: Validate VTT and extract metadata (segment count, duration, etc.)
  const workVtt = `${outPrefix}.vtt`;
  if (existsSync(workVtt)) {
    const { copyFile } = await import("node:fs/promises");
    await copyFile(workVtt, finalVtt);
  }

  const result: RunResult = {
    runner: "whispercpp",
    command: cmdStr,
    dryRun: false,
    elapsedSec,
    speedup,
    outputPath: finalVtt,
    logFiles: { stdout: stdoutLogPath, stderr: stderrLogPath },
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
  const inputName = basename(config.input, extname(config.input));
  const finalName = config.tag ? `${inputName}.${config.tag}` : inputName;
  const finalVtt = `${config.outputDir}/${finalName}.vtt`;

  // Work directory for intermediate files (already includes timestamp)
  const workPath = config.runWorkDir;

  if (!config.dryRun) {
    await mkdir(config.outputDir, { recursive: true });
    await mkdir(workPath, { recursive: true });
  }

  // File prefix for outputs and logs - work dir is unique per run
  const outPrefix = `${workPath}/${inputName}`;

  // Build args - whisperkit outputs to --report-path
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
    workPath,
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
      outputPath: finalVtt,
      logFiles: { stdout: "", stderr: "" },
    };
  }

  // Run with progress tracking
  // whisperkit outputs progress to stdout: "] XX% | Elapsed Time: X.XX s | Remaining: X.XX s"
  const stdoutLogPath = `${outPrefix}.stdout.log`;
  const stderrLogPath = `${outPrefix}.stderr.log`;
  const cmdResult = await runSubTask({
    label: "transcribe",
    command: exec,
    args,
    stdoutLogPath,
    stderrLogPath,
    stdout: whisperkitHandler((formatted) => process.stderr.write(formatted)),
  });

  const elapsedSec = Math.round(cmdResult.elapsedMs / 1000);

  // Convert SRT to VTT using ffmpeg if SRT exists
  const srtPath = `${workPath}/${inputName}.srt`;
  const workVtt = `${workPath}/${inputName}.vtt`;
  if (existsSync(srtPath) && commandExists("ffmpeg")) {
    const srtToVttStdout = `${workPath}/${inputName}-srt-to-vtt.stdout.log`;
    const srtToVttStderr = `${workPath}/${inputName}-srt-to-vtt.stderr.log`;
    await runSubTask({
      label: "SRT→VTT",
      command: "ffmpeg",
      args: [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        srtPath,
        workVtt,
      ],
      stdoutLogPath: srtToVttStdout,
      stderrLogPath: srtToVttStderr,
    });
  }

  // Copy final VTT to output directory
  // TODO: Validate VTT and extract metadata (segment count, duration, etc.)
  if (existsSync(workVtt)) {
    const { copyFile } = await import("node:fs/promises");
    await copyFile(workVtt, finalVtt);
  }

  const speedup = await calculateSpeedup(config, elapsedSec);

  const result: RunResult = {
    runner: "whisperkit",
    command: cmdStr,
    dryRun: false,
    elapsedSec,
    speedup,
    outputPath: finalVtt,
    logFiles: { stdout: stdoutLogPath, stderr: stderrLogPath },
  };

  callbacks?.onComplete?.(result);
  return result;
}

/**
 * Create SubTaskConfig for audio format conversion via ffmpeg.
 * wav: faster encoding (1300x), larger files (~1GB for 10h)
 * mp3: slower encoding (174x), smaller files (~470MB for 10h)
 */
function convertAudioSubTask(
  inputPath: string,
  format: "wav" | "mp3",
  outputPath: string,
  workPath: string,
  inputName: string,
): SubTaskConfig {
  // wav: 16-bit PCM, 16kHz mono (fast, large files)
  const wavArgs = ["-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1"];
  // mp3: libmp3lame VBR quality 4 (CBR 128k tested: slower at 130x vs VBR 174x)
  const mp3Args = ["-c:a", "libmp3lame", "-q:a", "4"];

  return {
    label: `to-${format}`,
    command: "ffmpeg",
    args: [
      "-y",
      "-hide_banner",
      "-loglevel",
      "info",
      "-i",
      inputPath,
      "-vn",
      ...(format === "wav" ? wavArgs : mp3Args),
      outputPath,
    ],
    stdoutLogPath: `${workPath}/${inputName}-to-${format}.stdout.log`,
    stderrLogPath: `${workPath}/${inputName}-to-${format}.stderr.log`,
    stderr: ffmpegConvertHandler((line) => process.stderr.write(line)),
  };
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
