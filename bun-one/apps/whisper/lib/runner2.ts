import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname } from "node:path";

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
  type TaskConfig,
} from "./task.ts";

export { type ModelShortName, type RunConfig } from "./runners.ts";
import type { RunConfig } from "./runners.ts";

const WHISPER_CPP_EXEC = "whisper-cli";

export interface RunResult {
  processedAudioDurationSec: number;
  elapsedSec: number;
  speedup: string;
  tasks: TaskConfig[];
  outputPath: string;
  vttSummary?: VttSummary;
}

export async function runWhisper(
  config: RunConfig,
  deps?: {
    getAudioDuration?: (path: string) => Promise<number>;
  },
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
    result.processedAudioDurationSec / (elapsedMs / 1000 || 1)
  ).toFixed(1);

  const hasExecuted = !config.dryRun;
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

async function runWhisperPipeline(
  config: RunConfig,
  reporter: ProgressReporter,
  deps?: {
    getAudioDuration?: (path: string) => Promise<number>;
  },
): Promise<RunResult> {
  const outputPath = getFinalVttPath(config);
  const getAudioDuration = deps?.getAudioDuration ?? getAudioFileDuration;
  const audioDurationSec = await getAudioDuration(config.input);

  // runner2 supports `--start` via `--offset-t` and `--duration` via `--duration`
  // on the appropriate segment.

  // How many segments we'd split this input into.
  // `segmentSec=0` means treat the input as a single segment.
  const segmentCount =
    config.segmentSec > 0 ? Math.ceil(audioDurationSec / config.segmentSec) : 1;

  // Build WAV conversion tasks (currently placeholder args/logs).
  // Note: WAV tasks are always emitted for all segments.
  const wavTasks: TaskConfig[] = Array.from(
    { length: segmentCount },
    (_, i) => {
      const segNum = i + 1;
      return {
        label: `to-wav[seg:${segNum} of ${segmentCount}]`,
        command: "ffmpeg",
        args: [] as string[],
        stdoutLogPath: "junk",
        stderrLogPath: "junk",
        monitor: createAudioConversionMonitor(reporter),
      };
    },
  );

  // Compute `--offset-t` args for this segment.
  // This only decides whether this segment needs `--offset-t`; it does not decide
  // which segments should be scheduled.
  function offsetTArgsForSegment(index: number): string[] {
    const startSec = config.startSec; // Global start position (seconds)
    const segmentSec = config.segmentSec; // Segment size (seconds), 0 means single segment

    // Starting at t=0 => no `--offset-t` anywhere.
    if (startSec <= 0) return [];

    // Single segment: offset is startSec and only applies to segment 0.
    if (segmentCount === 1) {
      // Only segment 0 exists in single-segment mode.
      return index === 0 ? ["--offset-t", String(startSec * 1000)] : [];
    }

    // Multiple segments: `--offset-t` applies only to the segment containing startSec.
    // Math: startSegIndex = floor(start / segmentSec)
    const startSegIndex = Math.floor(startSec / segmentSec);
    if (index !== startSegIndex) return [];

    // Segment-local offset (may be 0 when startSec lands on a boundary).
    // Math: offset = start - (startSegIndex * segmentSec)
    const offsetInSegSec = startSec - startSegIndex * segmentSec;
    return ["--offset-t", String(offsetInSegSec * 1000)];
  }

  // Compute `--duration` args for this segment.
  // This only decides whether this segment needs `--duration`; it does not decide
  // which segments should be scheduled.
  function durationArgsForSegment(index: number): string[] {
    const startSec = config.startSec; // Global start position (seconds)
    const durationSec = config.durationSec; // Requested duration (seconds), 0 means until EOF
    const segmentSec = config.segmentSec; // Segment size (seconds), 0 means single segment

    // Duration not requested => never emit `--duration`.
    if (durationSec <= 0) return []; // No segment needs `--duration`

    // Single segment: duration is relative to the single chunk.
    if (segmentCount === 1) {
      // Only segment 0 exists in single-segment mode.
      return index === 0 ? ["--duration", String(durationSec * 1000)] : [];
    }

    // Requested end position in the original timeline (seconds).
    // Math: end = min(audioDuration, start + duration)
    const endSec = Math.min(audioDurationSec, startSec + durationSec);
    // End is EOF => never emit `--duration`.
    if (endSec >= audioDurationSec) return []; // No cap needed

    // Segment containing the requested end.
    // Math: endSegIndex = ceil(end / segmentSec) - 1 (end is exclusive)
    const endSegIndex = Math.ceil(endSec / segmentSec) - 1;
    // Only the end segment gets `--duration`.
    if (index !== endSegIndex) return []; // Not the end segment

    // Segment containing the requested start.
    // Math: floor(start / segmentSec)
    const startSegIndex = Math.floor(startSec / segmentSec);
    // Start and end are in the same segment => requested duration is already segment-local.
    if (endSegIndex === startSegIndex) {
      // Duration is measured from this segment's t=0 (or from offset when combined with `--offset-t`).
      return ["--duration", String(durationSec * 1000)];
    }

    // Otherwise, duration is local to the end segment.
    // Math: localDuration = endSec - (endSegIndex * segmentSec)
    const endSegStartSec = endSegIndex * segmentSec;
    const localDurationSec = endSec - endSegStartSec;
    return ["--duration", String(localDurationSec * 1000)];
  }

  // Filter transcribe tasks using the presence of flags.
  // Assumptions:
  // - WAV tasks are never filtered (per spec).
  // - `offsetTArgsForSegment(i)` contains "--offset-t" for at most one segment.
  //   If `startSec > 0`, it will contain it exactly once (and may be `--offset-t 0`).
  // - `durationArgsForSegment(i)` contains "--duration" for at most one segment.
  //   If `durationSec > 0` and end < EOF, it will contain it exactly once.
  // Therefore, we can determine the transcribe segment range by scanning for the
  // segment index containing each flag.
  const segmentIndices = Array.from({ length: segmentCount }, (_, i) => i);

  const offsetTSegmentIndex = segmentIndices.findIndex((i) =>
    offsetTArgsForSegment(i).includes("--offset-t"),
  );
  const firstTranscribeSegIndex =
    offsetTSegmentIndex >= 0 ? offsetTSegmentIndex : 0;

  const durationSegmentIndex = segmentIndices.findIndex((i) =>
    durationArgsForSegment(i).includes("--duration"),
  );
  const lastTranscribeSegIndex =
    durationSegmentIndex >= 0 ? durationSegmentIndex : segmentCount - 1;

  // Build transcribe tasks (currently placeholder args/logs).
  // Labels keep absolute segment numbering.
  const transcribeTasks: TaskConfig[] = segmentIndices
    .filter((i) => i >= firstTranscribeSegIndex && i <= lastTranscribeSegIndex)
    .map((i) => {
      const segNum = i + 1;
      return {
        label: `transcribe[seg:${segNum} of ${segmentCount}]`,
        command: WHISPER_CPP_EXEC,
        // Order matters: offset first, then duration.
        args: [...offsetTArgsForSegment(i), ...durationArgsForSegment(i)],
        stdoutLogPath: "junk",
        stderrLogPath: "junk",
        monitor: createWhisperCppMonitor(reporter),
      };
    });

  const tasks: TaskConfig[] = [...wavTasks, ...transcribeTasks];

  return {
    processedAudioDurationSec: audioDurationSec,
    elapsedSec: 0,
    speedup: "0",
    tasks,
    outputPath,
  };
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

function getFinalVttPath(config: RunConfig): string {
  const inputName = basename(config.input, extname(config.input));
  const finalName = config.tag ? `${inputName}.${config.tag}` : inputName;
  return `${config.outputDir}/${finalName}.vtt`;
}
