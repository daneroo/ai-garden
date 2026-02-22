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
  getHeaderProvenance,
  readVttFile,
  summarizeVttFile,
  type VttSummary,
} from "./vtt.ts";
import {
  parseTranscription,
  stitchVttConcat,
  type VttTranscription,
} from "@bun-one/vtt";
import { writeVttComposition } from "./vtt-writer.ts";
import {
  executeTask,
  type Task,
  type ToWavTask,
  type TranscribeTask,
} from "./task.ts";
import { buildSequences } from "./segmentation.ts";
import { formatDuration } from "./duration.ts";

// Model directory for whisper-cpp (absolute path)
// TODO:this will probably need to evolve with an ENV based configuration
const WHISPER_CPP_MODELS = join(import.meta.dir, "..", "data", "models");

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
  cache: boolean; // Enable WAV and VTT caching
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
  tasks: Task[];
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
  let runConfig = config;
  if (!config.dryRun) {
    const runWorkDir = await createUniqueRunWorkDir(config.runWorkDir);
    if (runWorkDir !== config.runWorkDir) {
      runConfig = { ...config, runWorkDir };
    }
    await writeFile(
      `${runConfig.runWorkDir}/runconfig.json`,
      JSON.stringify(runConfig, null, 2),
    );
  }

  const reporter = createReporter(runConfig);
  const result = await runWhisperPipeline(runConfig, reporter, deps);

  if (existsSync(result.outputPath)) {
    result.vttSummary = summarizeVttFile(await readVttFile(result.outputPath));
    const headerProv = getHeaderProvenance(result.vttSummary.provenance);
    const elapsedMs = headerProv?.elapsedMs ?? 0;
    const elapsedSec = Math.round(elapsedMs / 1000);
    const audioDur = result.vttSummary.durationSec;
    const speedup =
      elapsedMs > 0 ? (audioDur / (elapsedMs / 1000)).toFixed(1) : "0";
    reporter.finish(elapsedSec, speedup, `${audioDur}s`);
  }

  return result;
}

const RUN_WORKDIR_TIMESTAMP_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z/;

export async function createUniqueRunWorkDir(
  runWorkDir: string,
): Promise<string> {
  await mkdir(dirname(runWorkDir), { recursive: true });
  try {
    await mkdir(runWorkDir);
    return runWorkDir;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "EEXIST"
    ) {
      await delay(1000);
      const retryRunWorkDir = refreshRunWorkDirTimestamp(runWorkDir);
      if (!retryRunWorkDir || retryRunWorkDir === runWorkDir) {
        throw new Error(`workdirAlready exists (too soon?): ${runWorkDir}`);
      }
      await mkdir(retryRunWorkDir);
      return retryRunWorkDir;
    }
    throw error;
  }
}

/**
 * Get the executable names required for transcription.
 */
export function getRequiredCommands(): string[] {
  return ["ffmpeg", "whisper-cli"];
}

async function runWhisperPipeline(
  config: RunConfig,
  reporter: ProgressReporter,
  deps?: RunDeps,
): Promise<RunResult> {
  // injected audio duration getter for mocking : else real audio file duration
  const getAudioDuration = deps?.getAudioDuration ?? getAudioFileDuration;
  // audio duration of the input
  const audioDuration = await getAudioDuration(config.input);
  // Resolved segment duration: explicit > WAV max (133h chunks)
  const segDurationSec =
    config.segmentSec > 0 ? config.segmentSec : MAX_WAV_DURATION_SEC;

  const { wav: wavSegs, transcribe: transcribeSegs } = buildSequences(
    audioDuration,
    segDurationSec,
    config.durationSec,
  );

  const { inputName, finalVtt } = getFinalPaths(config);
  if (!config.dryRun) {
    await mkdir(config.outputDir, { recursive: true });
    await mkdir(config.runWorkDir, { recursive: true });
  }

  // Naming helpers: "full" when no segmentation was requested or needed
  const durLabel =
    config.segmentSec === 0 && wavSegs.length === 1
      ? "full"
      : formatDuration(segDurationSec);
  const nameForSeg = (i: number) =>
    `${inputName}-seg${String(i).padStart(2, "0")}-d${durLabel}`;
  const labelForSeg = (i: number) => `seg:${i + 1} of ${wavSegs.length}`;

  // Build wav tasks as plain data
  const wavTasks: ToWavTask[] = wavSegs.map((seg, i) => {
    const name = nameForSeg(i);
    const outPrefix = `${config.runWorkDir}/${name}`;
    return {
      kind: "to-wav" as const,
      label: `to-wav[${labelForSeg(i)}]`,
      description: `ffmpeg: ${config.input} → ${outPrefix}.wav`,
      inputPath: config.input,
      outputPath: `${outPrefix}.wav`,
      startSec: seg.startSec,
      durationSec: seg.durationSec,
      cachePath: getWavCachePath(name),
      cache: config.cache,
      logPrefix: `${outPrefix}-ffmpeg`,
    };
  });

  // Build transcribe tasks as plain data
  const transcribeTasks: TranscribeTask[] = transcribeSegs.map((ts, i) => {
    const name = nameForSeg(i);
    const outPrefix = `${config.runWorkDir}/${name}`;
    const durationSec = ts.durationSec;
    return {
      kind: "transcribe" as const,
      label: `transcribe[${labelForSeg(i)}]`,
      description: `whisper: ${outPrefix}.wav (model=${config.modelShortName})`,
      wavPath: `${outPrefix}.wav`,
      outputPrefix: outPrefix,
      vttPath: `${outPrefix}.vtt`,
      model: config.modelShortName,
      modelPath: `${WHISPER_CPP_MODELS}/ggml-${config.modelShortName}.bin`,
      threads: config.threads,
      durationSec,
      wordTimestamps: config.wordTimestamps,
      cachePath: getVttCachePath(
        name,
        config.modelShortName,
        config.wordTimestamps,
        durationSec,
      ),
      cache: config.cache,
    } satisfies TranscribeTask;
  });

  const tasks: Task[] = [...wavTasks, ...transcribeTasks];

  const result: RunResult = {
    tasks,
    outputPath: finalVtt,
  };

  // Execute tasks sequentially (skip in dry-run mode)
  if (!config.dryRun) {
    for (let i = 0; i < result.tasks.length; i++) {
      result.tasks[i] = await executeTask(result.tasks[i]!, reporter);
    }
  }

  // Stitch VTTs: read each segment, call @bun-one/vtt stitcher, write output
  if (!config.dryRun) {
    const transcriptions: VttTranscription[] = [];
    for (let i = 0; i < wavSegs.length; i++) {
      const vttPath = `${config.runWorkDir}/${nameForSeg(i)}.vtt`;
      const content = await Bun.file(vttPath).text();
      const { value } = parseTranscription(content);
      transcriptions.push(value);
    }

    const composition = stitchVttConcat(transcriptions, {
      input: basename(config.input),
      model: config.modelShortName,
      wordTimestamps: config.wordTimestamps,
      generated: new Date().toISOString(),
    });
    await writeVttComposition(result.outputPath, composition);
  }

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

/**
 * Get ISO timestamp for filenames (no colons)
 */
function getUTCTimestampForFilePath(): string {
  return new Date().toISOString().replace(/:/g, "-").slice(0, 19) + "Z";
}

function refreshRunWorkDirTimestamp(runWorkDir: string): string | null {
  if (!RUN_WORKDIR_TIMESTAMP_REGEX.test(runWorkDir)) return null;
  return runWorkDir.replace(
    RUN_WORKDIR_TIMESTAMP_REGEX,
    getUTCTimestampForFilePath(),
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
