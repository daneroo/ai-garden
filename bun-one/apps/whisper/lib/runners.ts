import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { existsSync } from "node:fs";
import { getAudioFileDuration } from "./audio.ts";
import {
  createNullProgressReporter,
  createProgressReporter,
  type ProgressReporter,
} from "./progress.ts";
import { readVtt, summarizeVtt, type VttSummary } from "./vtt.ts";
import {
  createAudioConversionMonitor,
  createWhisperCppMonitor,
  runTask,
  type TaskConfig,
  type TaskMonitor,
  type TaskResult,
} from "./task.ts";

import { join } from "node:path";

// Model directory for whisper-cpp (absolute path)
// TODO:this will probably need to evolve with an ENV based configuration
const WHISPER_CPP_MODELS = join(import.meta.dir, "..", "data", "models");

// Private executable constant
const WHISPER_CPP_EXEC = "whisper-cli";

export type ModelShortName = "tiny.en" | "base.en" | "small.en";

/**
 * Configuration for a whisper transcription run
 */
export interface RunConfig {
  input: string; // Path to the audio file to transcribe
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
  quiet?: boolean; // Suppress progress output to stderr
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

  // Create progress reporter for stderr output (or null reporter for quiet mode)
  const inputBasename = basename(config.input);
  const reporter = config.quiet
    ? createNullProgressReporter()
    : createProgressReporter({
        inputBasename,
        modelShortName: config.modelShortName,
      });

  // Start wall-clock timer
  const startMs = Date.now();

  // Run the transcription pipeline
  const result = await runWhisperTasks(config, reporter);

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
 * Get the executable names required for transcription.
 * Note: ffmpeg is currently used for audio format conversion (m4b → wav).
 * It will also be needed for segmentation/stitching in future phases.
 */
export function getRequiredCommands(): string[] {
  return ["ffmpeg", WHISPER_CPP_EXEC];
}

/**
 * Run the whisper transcription pipeline (optional convert + transcribe)
 */
async function runWhisperTasks(
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
    const monitor = createAudioConversionMonitor(reporter);
    tasks.push(
      createAudioConversionTask(
        config.input,
        format,
        convertedAudioPath,
        workPath,
        inputName,
        monitor,
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
  const monitor = createWhisperCppMonitor(reporter);

  tasks.push({
    label: "transcribe",
    command: exec,
    args: transcriptionArgs,
    stdoutLogPath,
    stderrLogPath,
    monitor,
  });

  // Calculate processed duration
  const processedAudioDurationSec = await getProcessedAudioDuration(config);

  // Final result object (will be populated with task results)
  const result: RunResult = {
    processedAudioDurationSec,
    elapsedSec: 0, // Will be set by runWhisper
    speedup: "0", // Will be set by runWhisper
    tasks: tasks.map((t) => ({ config: t })),
    outputPath: finalVtt,
  };

  if (config.dryRun) {
    return result;
  }

  // Execute tasks (each has its own monitor)
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]!;
    const taskResult = await runTask(task);
    result.tasks[i] = { config: task, result: taskResult };
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
 * Factory for audio conversion TaskConfig.
 * wav: faster encoding (1300x), larger files (~1GB for 10h)
 * mp3: slower encoding (174x), smaller files (~470MB for 10h)
 */
function createAudioConversionTask(
  inputPath: string,
  format: "wav" | "mp3",
  outputPath: string,
  workPath: string,
  inputName: string,
  monitor: TaskMonitor,
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
    monitor,
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
