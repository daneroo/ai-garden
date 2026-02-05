import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { existsSync } from "node:fs";
import { getVttCachePath, getWavCachePath } from "./cache.ts";
import { getAudioFileDuration } from "./audio.ts";
import {
  createNullProgressReporter,
  createProgressReporter,
  type ProgressReporter,
} from "./progress.ts";
import {
  readVtt,
  readVttFile,
  summarizeVtt,
  type VttCue,
  type VttHeaderProvenance,
  type VttProvenance,
  type VttSummary,
} from "./vtt.ts";
import { stitchVttConcat, writeVtt } from "./vtt-stitch.ts";
import {
  createAudioConversionMonitor,
  createToWavTask,
  createTranscribeTask,
  createWhisperCppMonitor,
  type Task,
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
// Real audio files often have subsecond duration excesses (e.g., 1800.019s
// instead of exactly 1800s), so we absorb tiny tails into the final segment.
export const MIN_SEGMENT_REMAINDER_SEC = 2;

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
    task: Task;
    result?: TaskResult;
  }>;
  outputPath: string;
  vttSummary?: VttSummary;
}

/** Dependencies that can be injected for testing */
export interface RunDeps {
  getAudioDuration?: (path: string) => Promise<number>;
}

/**
 * Run whisper transcription - side-effect-free entry point
 */
export async function runWhisper(
  config: RunConfig,
  deps?: RunDeps,
): Promise<RunResult> {
  if (!config.dryRun && config.overlapSec > 0) {
    throw new Error("overlapping stitching : not yet implemented!");
  }

  if (!config.dryRun) {
    await createUniqueRunWorkDir(config.runWorkDir);
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

async function createUniqueRunWorkDir(runWorkDir: string): Promise<void> {
  await mkdir(dirname(runWorkDir), { recursive: true });
  try {
    await mkdir(runWorkDir);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      throw new Error(`workdirAlready exists (too soon?): ${runWorkDir}`);
    }
    throw error;
  }
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

  const audioDuration = await getAudioDuration(config.input);
  const processedAudioDurationSec = await getProcessedAudioDuration(
    config,
    async () => audioDuration,
  );
  const segmentSec = resolveSegmentSec(audioDuration, config.segmentSec);
  const segmentCount = computeSegmentCount(audioDuration, segmentSec);
  const segmentDurationLabel = getSegmentDurationLabel({
    requestedSegmentSec: config.segmentSec,
    resolvedSegmentSec: segmentSec,
    segmentCount,
  });

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
      segmentDurationLabel,
      segIndex: i,
      segmentCount,
      audioDuration,
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
        segmentDurationLabel,
        segIndex: i,
        segmentCount,
        audioDuration,
      }),
    );

  const tasks = [...wavTasks, ...transcribeTasks];
  const result: RunResult = {
    processedAudioDurationSec,
    elapsedSec: 0,
    speedup: "0",
    tasks: tasks.map((t) => ({ task: t })),
    outputPath: finalVtt,
  };

  // Build TaskContext for execution
  const ctx = {
    reporter,
    workDir: config.runWorkDir,
  };

  // Execute tasks (skip in dry-run mode)
  if (!config.dryRun) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!;
      const taskResult = await task.execute(ctx);
      result.tasks[i] = {
        task,
        result: { elapsedMs: taskResult.elapsedMs },
      };
    }
  }

  // Stitch VTTs from transcribed segments
  const segmentVtts = segmentIndices
    .filter((i) => i >= firstTranscribeIdx && i <= lastTranscribeIdx)
    .map((i) => {
      const segSuffix = getSegmentSuffix(i, segmentSec, config.overlapSec, {
        durationLabel: segmentDurationLabel,
      });
      const segName = `${inputName}${segSuffix}`;
      return {
        segment: i,
        path: `${config.runWorkDir}/${segName}.vtt`,
        startSec: i * segmentSec,
        input: `${segName}.wav`,
      };
    });

  await stitchSegments(segmentVtts, result.outputPath, config);
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
export function getOffsetMsForSegment(
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
export function getDurationMsForSegment(
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

function getSegmentDurationLabel({
  requestedSegmentSec,
  resolvedSegmentSec,
  segmentCount,
}: {
  requestedSegmentSec: number;
  resolvedSegmentSec: number;
  segmentCount: number;
}): string {
  if (
    requestedSegmentSec <= 0 &&
    segmentCount === 1 &&
    !Number.isInteger(resolvedSegmentSec)
  ) {
    return "full";
  }
  return formatDuration(resolvedSegmentSec);
}

export function computeSegmentCount(
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

export function getStartSegmentIndex(
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

export function getEndSegmentIndex(
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
  segmentDurationLabel: string;
  segIndex: number;
  segmentCount: number;
  audioDuration: number;
}

function segLabel(segIndex: number, segmentCount: number): string {
  return `seg:${segIndex + 1} of ${segmentCount}`;
}

function buildWavTasks(ctx: SegmentContext): Task[] {
  const {
    config,
    reporter,
    inputName,
    segmentSec,
    segmentDurationLabel,
    segIndex,
    segmentCount,
    audioDuration,
  } = ctx;
  const segSuffix = getSegmentSuffix(segIndex, segmentSec, config.overlapSec, {
    durationLabel: segmentDurationLabel,
  });
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

  // Cache logic is now inside execute()
  return [
    createToWavTask({
      label,
      inputPath: config.input,
      outputPath: segWavPath,
      startSec,
      durationSec,
      cachePath: wavCachePath,
      logPrefix: `${segOutPrefix}-ffmpeg`,
      monitor: createAudioConversionMonitor(reporter),
    }),
  ];
}

function buildTranscribeTasks(ctx: SegmentContext): Task[] {
  const {
    config,
    reporter,
    inputName,
    segmentSec,
    segmentDurationLabel,
    segIndex,
    segmentCount,
    audioDuration,
  } = ctx;
  const segSuffix = getSegmentSuffix(segIndex, segmentSec, config.overlapSec, {
    durationLabel: segmentDurationLabel,
  });
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

  // Cache key includes offset/duration since they affect output
  const vttCachePath = getVttCachePath(
    segName,
    config.modelShortName,
    config.wordTimestamps,
    offsetMs,
    durationMs,
  );

  // Cache logic is now inside execute()
  return [
    createTranscribeTask({
      label,
      wavPath: segWavPath,
      outputPrefix: segOutPrefix,
      vttPath: segVttPath,
      model: config.modelShortName,
      modelPath: `${WHISPER_CPP_MODELS}/ggml-${config.modelShortName}.bin`,
      threads: config.threads,
      offsetMs,
      durationMs,
      wordTimestamps: config.wordTimestamps,
      cachePath: vttCachePath,
      monitor: createWhisperCppMonitor(reporter),
    }),
  ];
}

async function stitchSegments(
  segmentVtts: Array<{
    segment: number;
    path: string;
    startSec: number;
    input: string;
  }>,
  finalVttPath: string,
  config: RunConfig,
): Promise<void> {
  const infos: Array<{
    segment: number;
    cues: VttCue[];
    startSec: number;
    input: string;
  }> = [];
  for (const seg of segmentVtts) {
    if (existsSync(seg.path)) {
      const parsed = await readVttFile(seg.path);
      infos.push({
        segment: seg.segment,
        cues: parsed.cues,
        startSec: seg.startSec,
        input: seg.input,
      });
    }
  }
  if (infos.length === 0) {
    return;
  }

  const stitchedCues = stitchVttConcat(
    infos.map((info) => ({
      cues: info.cues,
      startSec: info.startSec,
    })),
  );

  const segmentBoundaries: Array<{ segment: number; cueIndex: number }> = [];
  const segmentProvenance: VttProvenance[] = [];
  let cueIndex = 0;
  for (const info of infos) {
    segmentBoundaries.push({ segment: info.segment, cueIndex });
    cueIndex += info.cues.length;
    segmentProvenance.push({
      input: info.input,
      segment: info.segment,
      startSec: info.startSec,
    });
  }

  const headerProvenance: VttHeaderProvenance = {
    input: basename(config.input),
    model: config.modelShortName,
    generated: new Date().toISOString(),
    ...(infos.length > 1 ? { segments: infos.length } : {}),
    ...(config.startSec > 0 ? { startSec: config.startSec } : {}),
    ...(config.durationSec > 0 ? { durationSec: config.durationSec } : {}),
  };

  await writeVtt(finalVttPath, stitchedCues, {
    provenance: [headerProvenance, ...segmentProvenance],
    segmentBoundaries,
  });
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
  opts?: { durationLabel?: string },
): string {
  const segNum = String(index).padStart(2, "0");
  const durStr = opts?.durationLabel ?? formatDuration(segmentSec);
  const ovStr = formatDuration(overlapSec);
  return `-seg${segNum}-d${durStr}-ov${ovStr}`;
}
