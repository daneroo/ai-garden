import { mkdir, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { existsSync } from "node:fs";
import { getVttCachePath, getWavCachePath } from "./cache.ts";
import { getAudioFileDuration } from "./audio.ts";
import {
  createNullProgressReporter,
  createProgressReporter,
  type ProgressReporter,
} from "./progress.ts";
import { readVtt, summarizeVtt, type VttCue, type VttSummary } from "./vtt.ts";
import { stitchVttConcat, writeVtt } from "./vtt-stitch.ts";
import {
  createAudioConversionMonitor,
  createQuietMonitor,
  createWhisperCppMonitor,
  runTask,
  type TaskConfig,
  type TaskResult,
} from "./task.ts";
import { formatDuration } from "./duration.ts";

// Model directory for whisper-cpp (absolute path)
// TODO:this will probably need to evolve with an ENV based configuration
const WHISPER_CPP_MODELS = join(import.meta.dir, "..", "data", "models");

// Private executable constant
const WHISPER_CPP_EXEC = "whisper-cli";

// Maximum WAV duration due to RIFF 32-bit size limit (~37h for 16kHz mono 16-bit)
const MAX_WAV_DURATION_SEC = 37 * 3600;

// Ignore remainders under 2s to avoid micro-segments from duration rounding.
const MIN_SEGMENT_REMAINDER_SEC = 2;

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
  segmentSec: number; // Segment duration in seconds (0 = no segmentation)
  overlapSec: number; // Overlap between segments in seconds (0 = no overlap)
}

/**
 * Create a unique work directory path for a single run
 * Format: {workDirRoot}/{inputName}[.{tag}]-{timestamp}
 */
export function createRunWorkDir({
  workDirRoot,
  inputPath,
  tag,
}: {
  workDirRoot: string;
  inputPath: string;
  tag?: string;
}): string {
  const inputName = basename(inputPath, extname(inputPath));
  const timestamp = getUTCTimestampForFilePath();
  const namePart = tag ? `${inputName}.${tag}` : inputName;
  return `${workDirRoot}/${namePart}-${timestamp}`;
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

/** Dependencies that can be injected for testing */
export interface RunDeps {
  getAudioDuration?: (path: string) => Promise<number>;
  checkCache?: (path: string) => boolean;
}

/**
 * Run whisper transcription - side-effect-free entry point
 */
export async function runWhisper(
  config: RunConfig,
  deps?: RunDeps,
): Promise<RunResult> {
  if (!config.dryRun) {
    await mkdir(config.runWorkDir, { recursive: true });
    await writeFile(
      `${config.runWorkDir}/runconfig.json`,
      JSON.stringify(config, null, 2),
    );
  }

  const reporter = createReporter(config);
  const startMs = Date.now();
  const result = await runWhisperPipeline(config, reporter, deps);

  const elapsedMs = Date.now() - startMs;
  result.elapsedSec = Math.round(elapsedMs / 1000);
  result.speedup = (
    result.processedAudioDurationSec /
    (elapsedMs / 1000)
  ).toFixed(1);

  const hasExecuted = result.tasks.some((t) => t.result);
  if (hasExecuted && existsSync(result.outputPath)) {
    result.vttSummary = summarizeVtt(await readVtt(result.outputPath));
    reporter.finish(
      result.elapsedSec,
      result.speedup,
      result.vttSummary ? `${result.vttSummary.durationSec}s` : undefined,
    );
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

async function runWhisperPipeline(
  config: RunConfig,
  reporter: ProgressReporter,
  deps?: RunDeps,
): Promise<RunResult> {
  const getAudioDuration = deps?.getAudioDuration ?? getAudioFileDuration;
  const checkCache = deps?.checkCache ?? existsSync;

  const audioDuration = await getAudioDuration(config.input);
  const segmentSec = resolveSegmentSec(audioDuration, config.segmentSec);
  const segmentCount = computeSegmentCount(audioDuration, segmentSec);

  const { inputName, finalVtt } = getFinalPaths(config);
  if (!config.dryRun) {
    await mkdir(config.outputDir, { recursive: true });
    await mkdir(config.runWorkDir, { recursive: true });
  }

  // Compute which segments need transcription based on --start/--duration
  const { firstTranscribeIdx, lastTranscribeIdx } = computeTranscribeRange(
    config,
    audioDuration,
    segmentSec,
    segmentCount,
  );

  // Build tasks using functional approach
  const segmentIndices = Array.from({ length: segmentCount }, (_, i) => i);

  const wavTasks = segmentIndices.flatMap((i) =>
    buildWavTasks({
      config,
      reporter,
      inputName,
      segmentSec,
      segIndex: i,
      segmentCount,
      audioDuration,
      checkCache,
    }),
  );

  const transcribeTasks = segmentIndices
    .filter((i) => i >= firstTranscribeIdx && i <= lastTranscribeIdx)
    .flatMap((i) =>
      buildTranscribeTasks({
        config,
        reporter,
        inputName,
        segmentSec,
        segIndex: i,
        segmentCount,
        audioDuration,
        checkCache,
      }),
    );

  const tasks = [...wavTasks, ...transcribeTasks];
  const result: RunResult = {
    processedAudioDurationSec: audioDuration,
    elapsedSec: 0,
    speedup: "0",
    tasks: tasks.map((t) => ({ config: t })),
    outputPath: finalVtt,
  };

  if (config.dryRun) {
    return result;
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]!;
    result.tasks[i] = { config: task, result: await runTask(task) };
  }

  // Stitch VTTs from transcribed segments
  const segmentVtts = segmentIndices
    .filter((i) => i >= firstTranscribeIdx && i <= lastTranscribeIdx)
    .map((i) => {
      const segSuffix = getSegmentSuffix(i, segmentSec, config.overlapSec);
      const segName = `${inputName}${segSuffix}`;
      return {
        path: `${config.runWorkDir}/${segName}.vtt`,
        startSec: i * segmentSec,
      };
    });

  await stitchSegments(segmentVtts, result.outputPath);
  return result;
}

/** Compute which segments need transcription based on --start/--duration */
function computeTranscribeRange(
  config: RunConfig,
  audioDuration: number,
  segmentSec: number,
  segmentCount: number,
): { firstTranscribeIdx: number; lastTranscribeIdx: number } {
  const { startSec, durationSec } = config;

  // First segment to transcribe: contains startSec
  const firstTranscribeIdx = getStartSegmentIndex(
    startSec,
    segmentSec,
    segmentCount,
  );

  // Last segment to transcribe: contains endSec (or last segment if no duration)
  if (durationSec <= 0) {
    return { firstTranscribeIdx, lastTranscribeIdx: segmentCount - 1 };
  }

  const endSec = Math.min(audioDuration, startSec + durationSec);
  if (endSec >= audioDuration) {
    return { firstTranscribeIdx, lastTranscribeIdx: segmentCount - 1 };
  }

  const lastTranscribeIdx = getEndSegmentIndex(
    endSec,
    audioDuration,
    segmentSec,
    config.overlapSec,
    segmentCount,
  );

  return { firstTranscribeIdx, lastTranscribeIdx };
}

/** Compute --offset-t value in ms for a segment (0 = no offset) */
function getOffsetMsForSegment(
  segIndex: number,
  config: RunConfig,
  segmentSec: number,
  segmentCount: number,
): number {
  const { startSec } = config;
  if (startSec <= 0) return 0;

  const startSegIndex = getStartSegmentIndex(
    startSec,
    segmentSec,
    segmentCount,
  );
  if (segIndex !== startSegIndex) return 0;

  const offsetInSegSec = startSec - startSegIndex * segmentSec;
  return offsetInSegSec * 1000;
}

/** Compute --duration value in ms for a segment (0 = no duration limit) */
function getDurationMsForSegment(
  segIndex: number,
  config: RunConfig,
  audioDuration: number,
  segmentSec: number,
  segmentCount: number,
): number {
  const { startSec, durationSec } = config;
  if (durationSec <= 0) return 0;

  const endSec = Math.min(audioDuration, startSec + durationSec);
  if (endSec >= audioDuration) return 0;

  const endSegIndex = getEndSegmentIndex(
    endSec,
    audioDuration,
    segmentSec,
    config.overlapSec,
    segmentCount,
  );
  if (segIndex !== endSegIndex) return 0;

  const startSegIndex = getStartSegmentIndex(
    startSec,
    segmentSec,
    segmentCount,
  );
  if (endSegIndex === startSegIndex) {
    return durationSec * 1000;
  }

  const endSegStartSec = endSegIndex * segmentSec;
  const localDurationSec = endSec - endSegStartSec;
  return localDurationSec * 1000;
}

function createReporter(config: RunConfig): ProgressReporter {
  if (config.quiet) {
    return createNullProgressReporter();
  }
  return createProgressReporter({
    inputBasename: basename(config.input),
    modelShortName: config.modelShortName,
  });
}

function resolveSegmentSec(
  audioDurationSec: number,
  requestedSegmentSec: number,
) {
  if (requestedSegmentSec > 0) {
    return requestedSegmentSec;
  }
  return audioDurationSec > MAX_WAV_DURATION_SEC
    ? MAX_WAV_DURATION_SEC
    : audioDurationSec;
}

function computeSegmentCount(
  audioDuration: number,
  segmentSec: number,
): number {
  if (segmentSec <= 0) return 1;
  if (audioDuration <= 0) return 0;
  const fullSegments = Math.floor(audioDuration / segmentSec);
  const remainder = audioDuration - fullSegments * segmentSec;
  // Drop tiny tail segments below MIN_SEGMENT_REMAINDER_SEC.
  if (remainder > 0 && remainder < MIN_SEGMENT_REMAINDER_SEC) {
    return Math.max(fullSegments, 1);
  }
  return Math.ceil(audioDuration / segmentSec);
}

function getStartSegmentIndex(
  startSec: number,
  segmentSec: number,
  segmentCount: number,
): number {
  if (startSec <= 0 || segmentSec <= 0 || segmentCount <= 1) return 0;
  return Math.min(segmentCount - 1, Math.floor(startSec / segmentSec));
}

function getSegmentEndSec(
  segIndex: number,
  audioDuration: number,
  segmentSec: number,
  overlapSec: number,
  segmentCount: number,
): number {
  if (segmentCount <= 1 || segmentSec <= 0) return audioDuration;
  if (segIndex >= segmentCount - 1) return audioDuration;
  return Math.min((segIndex + 1) * segmentSec + overlapSec, audioDuration);
}

function getEndSegmentIndex(
  endSec: number,
  audioDuration: number,
  segmentSec: number,
  overlapSec: number,
  segmentCount: number,
): number {
  if (segmentCount <= 1 || segmentSec <= 0) return 0;
  if (endSec <= 0) return 0;
  if (endSec >= audioDuration) return segmentCount - 1;

  for (let i = 0; i < segmentCount; i++) {
    const segEnd = getSegmentEndSec(
      i,
      audioDuration,
      segmentSec,
      overlapSec,
      segmentCount,
    );
    if (endSec <= segEnd) return i;
  }

  return segmentCount - 1;
}

function getFinalPaths(config: RunConfig): {
  inputName: string;
  finalVtt: string;
} {
  const inputName = basename(config.input, extname(config.input));
  const finalName = config.tag ? `${inputName}.${config.tag}` : inputName;
  return { inputName, finalVtt: `${config.outputDir}/${finalName}.vtt` };
}

interface SegmentContext {
  config: RunConfig;
  reporter: ProgressReporter;
  inputName: string;
  segmentSec: number;
  segIndex: number;
  segmentCount: number;
  audioDuration: number;
  checkCache: (path: string) => boolean;
}

function segLabel(segIndex: number, segmentCount: number): string {
  return `seg:${segIndex + 1} of ${segmentCount}`;
}

function buildWavTasks(ctx: SegmentContext): TaskConfig[] {
  const {
    config,
    reporter,
    inputName,
    segmentSec,
    segIndex,
    segmentCount,
    audioDuration,
    checkCache,
  } = ctx;
  const segSuffix = getSegmentSuffix(segIndex, segmentSec, config.overlapSec);
  const segName = `${inputName}${segSuffix}`;
  const segOutPrefix = `${config.runWorkDir}/${segName}`;
  const segWavPath = `${segOutPrefix}.wav`;
  const wavCachePath = getWavCachePath(segName);
  const label = `to-wav[${segLabel(segIndex, segmentCount)}]`;

  // Calculate segment duration (with overlap for non-last segments)
  const startSec = segIndex * segmentSec;
  const remaining = audioDuration - startSec;
  const isLast = segIndex === segmentCount - 1;
  const durationSec = isLast
    ? remaining
    : Math.min(segmentSec + config.overlapSec, remaining);

  return checkCache(wavCachePath)
    ? [
        copyTask({
          label: `${label}[cached]`,
          from: wavCachePath,
          to: segWavPath,
          logPrefix: `${segOutPrefix}-wav-cache`,
          reporter,
        }),
      ]
    : [
        {
          label,
          command: "ffmpeg",
          args: [
            "-y",
            "-hide_banner",
            "-loglevel",
            "info",
            "-i",
            config.input,
            "-ss",
            String(startSec),
            "-t",
            String(durationSec),
            "-acodec",
            "pcm_s16le",
            "-ar",
            "16000",
            "-ac",
            "1",
            segWavPath,
          ],
          stdoutLogPath: `${segOutPrefix}-ffmpeg.stdout.log`,
          stderrLogPath: `${segOutPrefix}-ffmpeg.stderr.log`,
          monitor: createAudioConversionMonitor(reporter),
        },
        copyTask({
          label: `cache-wav[${segLabel(segIndex, segmentCount)}]`,
          from: segWavPath,
          to: wavCachePath,
          logPrefix: `${segOutPrefix}-cache-wav`,
          reporter,
        }),
      ];
}

function buildTranscribeTasks(ctx: SegmentContext): TaskConfig[] {
  const {
    config,
    reporter,
    inputName,
    segmentSec,
    segIndex,
    segmentCount,
    audioDuration,
    checkCache,
  } = ctx;
  const segSuffix = getSegmentSuffix(segIndex, segmentSec, config.overlapSec);
  const segName = `${inputName}${segSuffix}`;
  const segOutPrefix = `${config.runWorkDir}/${segName}`;
  const segWavPath = `${segOutPrefix}.wav`;
  const segVttPath = `${segOutPrefix}.vtt`;
  const label = `transcribe[${segLabel(segIndex, segmentCount)}]`;

  // Compute whisper --offset-t and --duration values (in ms)
  const offsetMs = getOffsetMsForSegment(
    segIndex,
    config,
    segmentSec,
    segmentCount,
  );
  const durationMs = getDurationMsForSegment(
    segIndex,
    config,
    audioDuration,
    segmentSec,
    segmentCount,
  );

  const offsetArgs = offsetMs > 0 ? ["--offset-t", String(offsetMs)] : [];
  const durationArgs = durationMs > 0 ? ["--duration", String(durationMs)] : [];

  // Cache key includes offset/duration since they affect output
  const vttCachePath = getVttCachePath(
    segName,
    config.modelShortName,
    config.wordTimestamps,
    offsetMs,
    durationMs,
  );

  return checkCache(vttCachePath)
    ? [
        copyTask({
          label: `${label}[cached]`,
          from: vttCachePath,
          to: segVttPath,
          logPrefix: `${segOutPrefix}-vtt-cache`,
          reporter,
        }),
      ]
    : [
        {
          label,
          command: WHISPER_CPP_EXEC,
          args: [
            "--file",
            segWavPath,
            "--model",
            `${WHISPER_CPP_MODELS}/ggml-${config.modelShortName}.bin`,
            "--output-file",
            segOutPrefix,
            "--output-vtt",
            "--print-progress",
            "--threads",
            String(config.threads),
            ...offsetArgs,
            ...durationArgs,
            ...(config.wordTimestamps
              ? ["--max-len", "1", "--split-on-word"]
              : []),
          ],
          stdoutLogPath: `${segOutPrefix}.stdout.log`,
          stderrLogPath: `${segOutPrefix}.stderr.log`,
          monitor: createWhisperCppMonitor(reporter),
        },
        copyTask({
          label: `cache-vtt[${segLabel(segIndex, segmentCount)}]`,
          from: segVttPath,
          to: vttCachePath,
          logPrefix: `${segOutPrefix}-cache-vtt`,
          reporter,
        }),
      ];
}

function copyTask({
  label,
  from,
  to,
  logPrefix,
  reporter,
}: {
  label: string;
  from: string;
  to: string;
  logPrefix: string;
  reporter: ProgressReporter;
}): TaskConfig {
  return {
    label,
    command: "cp",
    args: ["-n", from, to],
    stdoutLogPath: `${logPrefix}.stdout.log`,
    stderrLogPath: `${logPrefix}.stderr.log`,
    monitor: createQuietMonitor(reporter),
  };
}

async function stitchSegments(
  segmentVtts: Array<{ path: string; startSec: number }>,
  finalVttPath: string,
): Promise<void> {
  const infos: Array<{ cues: VttCue[]; startSec: number }> = [];
  for (const seg of segmentVtts) {
    if (existsSync(seg.path)) {
      infos.push({ cues: await readVtt(seg.path), startSec: seg.startSec });
    }
  }
  if (infos.length === 0) {
    return;
  }
  await writeVtt(finalVttPath, stitchVttConcat(infos));
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

/**
 * Generate segment filename suffix.
 * Format: -seg{NN}-d{dur}-ov{ov}
 */
export function getSegmentSuffix(
  index: number,
  segmentSec: number,
  overlapSec: number,
): string {
  const segNum = String(index).padStart(2, "0");
  const durStr = formatDuration(segmentSec);
  const ovStr = formatDuration(overlapSec);
  return `-seg${segNum}-d${durStr}-ov${ovStr}`;
}
