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
import {
  computeSegments,
  getSegmentDurationLabel,
  getSegmentSuffix,
  resolveSegmentSec,
} from "./segmentation.ts";

// Model directory for whisper-cpp (absolute path)
// TODO:this will probably need to evolve with an ENV based configuration
const WHISPER_CPP_MODELS = join(import.meta.dir, "..", "data", "models");

// Private executable constant
const WHISPER_CPP_EXEC = "whisper-cli";

// Maximum WAV duration due to RIFF 32-bit size limit (~37h for 16kHz mono 16-bit)
const MAX_WAV_DURATION_SEC = 37 * 3600;

export type ModelShortName = "tiny.en" | "base.en" | "small.en";

/**
 * Configuration for a whisper transcription run
 */
export interface RunConfig {
  input: string; // Path to the audio file to transcribe
  modelShortName: ModelShortName;
  threads: number;
  durationSec: number; // Duration in seconds (0 = entire file)
  outputDir: string; // Final output dir for .vtt
  runWorkDir: string; // Per-run work dir for logs, json, srt, vtt
  tag?: string; // Optional tag appended to output filename
  verbosity: number;
  dryRun: boolean;
  wordTimestamps: boolean;
  quiet?: boolean; // Suppress progress output to stderr
  segmentSec: number; // Segment duration in seconds (0 = auto 37h)
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

  // Compute segment geometry
  const segments = computeSegments(
    audioDuration,
    config.segmentSec,
    MAX_WAV_DURATION_SEC,
  );

  // Naming helpers
  const segmentSec = resolveSegmentSec(
    audioDuration,
    config.segmentSec,
    MAX_WAV_DURATION_SEC,
  );
  const segmentDurationLabel = getSegmentDurationLabel({
    requestedSegmentSec: config.segmentSec,
    resolvedSegmentSec: segmentSec,
    segmentCount: segments.length,
  });
  const nameForSeg = (i: number) => {
    const suffix = getSegmentSuffix(i, segmentSec, {
      durationLabel: segmentDurationLabel,
    });
    return `${inputName}${suffix}`;
  };
  const labelForSeg = (i: number) => `seg:${i + 1} of ${segments.length}`;

  const { inputName, finalVtt } = getFinalPaths(config);
  if (!config.dryRun) {
    await mkdir(config.outputDir, { recursive: true });
    await mkdir(config.runWorkDir, { recursive: true });
  }

  // Duration passthrough: convert to ms for whisper-cli
  const durationMs = config.durationSec > 0 ? config.durationSec * 1000 : 0;

  // Build wav tasks from segment geometry
  const wavTasks = segments.map((seg, i) => {
    const name = nameForSeg(i);
    const outPrefix = `${config.runWorkDir}/${name}`;
    return createToWavTask({
      label: `to-wav[${labelForSeg(i)}]`,
      inputPath: config.input,
      outputPath: `${outPrefix}.wav`,
      startSec: seg.startSec,
      durationSec: seg.endSec - seg.startSec,
      cachePath: getWavCachePath(name),
      logPrefix: `${outPrefix}-ffmpeg`,
      monitor: createAudioConversionMonitor(reporter),
    });
  });

  // Build transcribe tasks -- all segments, no filtering
  const transcribeTasks = segments.map((_, i) => {
    const name = nameForSeg(i);
    const outPrefix = `${config.runWorkDir}/${name}`;
    return createTranscribeTask({
      label: `transcribe[${labelForSeg(i)}]`,
      wavPath: `${outPrefix}.wav`,
      outputPrefix: outPrefix,
      vttPath: `${outPrefix}.vtt`,
      model: config.modelShortName,
      modelPath: `${WHISPER_CPP_MODELS}/ggml-${config.modelShortName}.bin`,
      threads: config.threads,
      durationMs,
      wordTimestamps: config.wordTimestamps,
      cachePath: getVttCachePath(
        name,
        config.modelShortName,
        config.wordTimestamps,
        durationMs,
      ),
      monitor: createWhisperCppMonitor(reporter),
    });
  });

  const tasks = [...wavTasks, ...transcribeTasks];
  const result: RunResult = {
    processedAudioDurationSec: audioDuration,
    elapsedSec: 0,
    speedup: "0",
    tasks: tasks.map((t) => ({ task: t })),
    outputPath: finalVtt,
  };

  // Execute tasks (skip in dry-run mode)
  if (!config.dryRun) {
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i]!;
      const taskResult = await task.execute();
      result.tasks[i] = {
        task,
        result: { elapsedMs: taskResult.elapsedMs },
      };
    }
  }

  // Stitch VTTs from all segments
  const segmentVtts = segments.map((seg, i) => ({
    segment: i,
    path: `${config.runWorkDir}/${nameForSeg(i)}.vtt`,
    startSec: seg.startSec,
    input: `${nameForSeg(i)}.wav`,
  }));

  await stitchSegments(segmentVtts, result.outputPath, config);
  return result;
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

function getFinalPaths(config: RunConfig): {
  inputName: string;
  finalVtt: string;
} {
  const inputName = basename(config.input, extname(config.input));
  const finalName = config.tag ? `${inputName}.${config.tag}` : inputName;
  return { inputName, finalVtt: `${config.outputDir}/${finalName}.vtt` };
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
    ...(config.durationSec > 0 ? { durationSec: config.durationSec } : {}),
  };

  await writeVtt(finalVttPath, stitchedCues, {
    provenance: [headerProvenance, ...segmentProvenance],
    segmentBoundaries,
  });
}

/**
 * Get ISO timestamp for filenames (no colons)
 */
function getUTCTimestampForFilePath(): string {
  return new Date().toISOString().replace(/:/g, "-").slice(0, 19) + "Z";
}
