import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { existsSync } from "node:fs";
import { getAudioFileDuration } from "./audio.ts";
import { createProgressReporter, type ProgressReporter } from "./progress.ts";
import { readVtt, summarizeVtt, VttSummary } from "./vtt.ts";
import {
  createWhisperCppMonitor,
  createWhisperKitMonitor,
  FFMPEG_AUDIO_PROGRESS_REGEX,
  runTask,
  type TaskConfig,
  type TaskResult,
  WHISPER_CPP_PROGRESS_REGEX,
  WHISPERKIT_PROGRESS_REGEX,
} from "./task.ts";

// Model directory for whisper-cpp
const WHISPER_CPP_MODELS = "data/models";

// Private executable constants
const WHISPER_CPP_EXEC = "whisper-cli";
const WHISPER_KIT_EXEC = "whisperkit-cli";

// RunnerName must be a non-empty array of valid runner names
export type RunnerName = "whisperkit" | "whispercpp";
export const RUNNER_NAMES: [RunnerName, ...RunnerName[]] = [
  "whispercpp",
  "whisperkit",
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
  processedAudioDurationSec: number;
  elapsedSec: number; // Wall-clock time from runWhisper
  speedup: string; // Formatted as "72.6" for clean JSON output
  tasks: Array<{
    config: TaskConfig;
    result?: TaskResult;
  }>;
  outputPath: string;
  vttSummary?: VttSummary;
}

/**
 * Run whisper transcription - side-effect-free entry point
 */
export async function runWhisper(config: RunConfig): Promise<RunResult> {
  // Save RunConfig to work directory for reproducibility
  if (!config.dryRun) {
    await mkdir(config.runWorkDir, { recursive: true });
    await writeFile(
      `${config.runWorkDir}/runconfig.json`,
      JSON.stringify(config, null, 2),
    );
  }

  // Create progress reporter for stderr output
  const inputBasename = basename(config.input);
  const reporter = createProgressReporter({
    inputBasename,
    runner: config.runner,
    modelShortName: config.modelShortName,
  });

  // Start wall-clock timer
  const startMs = Date.now();

  let result: RunResult;

  if (config.runner === "whispercpp") {
    result = await runWhisperCpp(config, reporter);
  } else if (config.runner === "whisperkit") {
    result = await runWhisperKit(config, reporter);
  } else {
    // Compile-time check to ensure all runner types are handled
    const _exhaustiveCheck: never = config.runner;
    throw new Error(`Unknown runner: ${_exhaustiveCheck}`);
  }

  // Calculate timing metrics
  const elapsedMs = Date.now() - startMs;
  result.elapsedSec = Math.round(elapsedMs / 1000);
  result.speedup = (
    result.processedAudioDurationSec /
    (elapsedMs / 1000)
  ).toFixed(1);

  // Validate VTT and add summary (only for real runs with output)
  const hasExecuted = result.tasks.some((t) => t.result);
  if (hasExecuted && existsSync(result.outputPath)) {
    const cues = await readVtt(result.outputPath);
    result.vttSummary = summarizeVtt(cues);
  }

  // Write final result line to stderr
  if (hasExecuted) {
    const vttDur = result.vttSummary
      ? `${result.vttSummary.durationSec}s`
      : undefined;
    reporter.finish(result.elapsedSec, result.speedup, vttDur);
  }

  return result;
}

/**
 * Get the executable names for a given runner type
 */
export function getRequiredCommands(config: RunConfig): string[] {
  const commands = ["ffmpeg"];
  if (config.runner === "whispercpp") commands.push(WHISPER_CPP_EXEC);
  if (config.runner === "whisperkit") commands.push(WHISPER_KIT_EXEC);
  return commands;
}

/**
 * Run whisper-cpp command
 */
async function runWhisperCpp(
  config: RunConfig,
  reporter: ProgressReporter,
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

  // Build task plan
  const tasks: TaskConfig[] = [];

  // Convert unsupported formats (conditional task)
  let audioInput = config.input;
  if (extname(config.input).toLowerCase() === ".m4b") {
    // Use wav for speed (change to "mp3" for smaller files)
    const format = "wav" as const;
    const convertedAudioPath = `${workPath}/${inputName}.${format}`;
    tasks.push(
      convertAudioTask(
        config.input,
        format,
        convertedAudioPath,
        workPath,
        inputName,
      ),
    );
    audioInput = convertedAudioPath;
  }

  // Transcribe audio using whisper-cpp
  const transcriptionArgs = [
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

  const stdoutLogPath = `${outPrefix}.stdout.log`;
  const stderrLogPath = `${outPrefix}.stderr.log`;

  tasks.push({
    label: "transcribe",
    command: exec,
    args: transcriptionArgs,
    stdoutLogPath,
    stderrLogPath,
    stderrFilter: WHISPER_CPP_PROGRESS_REGEX,
  });

  // Calculate processed duration
  const processedAudioDurationSec = await getProcessedAudioDuration(config);

  // Final result object (will be populated with task results)
  const result: RunResult = {
    runner: "whispercpp",
    processedAudioDurationSec,
    elapsedSec: 0, // Will be set by runWhisper
    speedup: "0", // Will be set by runWhisper
    tasks: tasks.map((t) => ({ config: t })),
    outputPath: finalVtt,
  };

  if (config.dryRun) {
    return result;
  }

  // Execute tasks with monitor
  const monitor = createWhisperCppMonitor(reporter);
  for (let i = 0; i < tasks.length; i++) {
    const taskResult = await runTask(tasks[i], monitor);
    result.tasks[i].result = taskResult;
  }

  // Move VTT from work dir to final output dir
  const workVtt = `${outPrefix}.vtt`;
  if (existsSync(workVtt)) {
    const { copyFile } = await import("node:fs/promises");
    await copyFile(workVtt, finalVtt);
  }

  return result;
}

/**
 * Run whisperkit-cli command
 */
async function runWhisperKit(
  config: RunConfig,
  reporter: ProgressReporter,
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

  // Build task plan
  const tasks: TaskConfig[] = [];

  // Transcribe audio using whisperkit-cli
  const transcriptionArgs = [
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

  const stdoutLogPath = `${outPrefix}.stdout.log`;
  const stderrLogPath = `${outPrefix}.stderr.log`;

  tasks.push({
    label: "transcribe",
    command: exec,
    args: transcriptionArgs,
    stdoutLogPath,
    stderrLogPath,
    stdoutFilter: WHISPERKIT_PROGRESS_REGEX,
  });

  // Convert SRT to VTT using ffmpeg if available
  const srtPath = `${workPath}/${inputName}.srt`;
  const workVtt = `${workPath}/${inputName}.vtt`;
  tasks.push({
    label: "SRT→VTT",
    command: "ffmpeg",
    args: ["-y", "-hide_banner", "-loglevel", "error", "-i", srtPath, workVtt],
    stdoutLogPath: `${workPath}/${inputName}-srt-to-vtt.stdout.log`,
    stderrLogPath: `${workPath}/${inputName}-srt-to-vtt.stderr.log`,
  });

  // Calculate processed duration
  const processedAudioDurationSec = await getProcessedAudioDuration(config);

  // Final result object
  const result: RunResult = {
    runner: "whisperkit",
    processedAudioDurationSec,
    elapsedSec: 0, // Will be set by runWhisper
    speedup: "0", // Will be set by runWhisper
    tasks: tasks.map((t) => ({ config: t })),
    outputPath: finalVtt,
  };

  if (config.dryRun) {
    return result;
  }

  // Execute tasks with monitor
  const monitor = createWhisperKitMonitor(reporter);
  for (let i = 0; i < tasks.length; i++) {
    const taskResult = await runTask(tasks[i], monitor);
    result.tasks[i].result = taskResult;
  }

  // Copy final VTT to output directory
  if (existsSync(workVtt)) {
    const { copyFile } = await import("node:fs/promises");
    await copyFile(workVtt, finalVtt);
  }

  return result;
}

/**
 * Factory for audio conversion TaskConfig.
 * wav: faster encoding (1300x), larger files (~1GB for 10h)
 * mp3: slower encoding (174x), smaller files (~470MB for 10h)
 */
function convertAudioTask(
  inputPath: string,
  format: "wav" | "mp3",
  outputPath: string,
  workPath: string,
  inputName: string,
): TaskConfig {
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
    stderrFilter: FFMPEG_AUDIO_PROGRESS_REGEX,
  };
}

/**
 * Get the precise duration of audio to be processed.
 *
 * The duration is determined by:
 * 1. config.durationSec: If > 0, use this explicit limit (capped by file end).
 * 2. (File Duration - config.startSec): If duration is 0 (rest of file),
 *    calculate remaining audio from start offset.
 */
export async function getProcessedAudioDuration(
  config: RunConfig,
  getDuration: (path: string) => Promise<number> = getAudioFileDuration,
): Promise<number> {
  const fullDuration = await getDuration(config.input);
  const available = Math.max(0, fullDuration - config.startSec);

  // If duration is 0, transcribe until the end of the file
  if (config.durationSec === 0) {
    return available;
  }

  // Otherwise, use the specified duration, but don't go beyond file end
  return Math.min(config.durationSec, available);
}

/**
 * Get ISO timestamp for filenames (no colons)
 */
function getUTCTimestampForFilePath(): string {
  return new Date().toISOString().replace(/:/g, "-").slice(0, 19) + "Z";
}
