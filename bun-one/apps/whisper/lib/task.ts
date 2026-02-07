/**
 * Task execution and monitoring module.
 *
 * ARCHITECTURE:
 *
 * Task is pure data (discriminated union on `kind`).
 * executeTask(task, reporter) pattern-matches on kind, runs the work,
 * returns a NEW task with elapsedMs filled (immutable).
 *
 * Process layer (internal):
 *   runTask(config) spawns a child process, streams stdout/stderr to logs,
 *   emits events to a TaskMonitor, returns RunTaskResult.
 *
 * TaskMonitor
 *   - Receives events from multiple tasks (one lifecycle at a time)
 *   - Lifecycle: start → line* → done|error
 *   - Parses lines, updates state, renders output
 *   - Resets state on each "start" event
 *
 * Event flow:
 *   [start label="to-wav"]
 *     [line stream="stderr" line="size=...time=00:10:00..."]
 *   [done]
 *   [start label="transcribe"]
 *     [line stream="stderr" line="progress = 50%"]
 *   [done]
 *
 * Pre-configured monitors:
 *   - createAudioConversionMonitor: ffmpeg progress (stderr)
 *   - createWhisperCppMonitor: transcription progress (stderr)
 */

import { type ChildProcess, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { Buffer } from "node:buffer";
import { type ProgressReporter } from "./progress.ts";

// ============================================================================
// Process Layer (internal)
// ============================================================================

/**
 * Configuration for a single task (command execution).
 */
export interface TaskConfig {
  label: string;
  command: string;
  args: string[];
  stdoutLogPath: string;
  stderrLogPath: string;
  /** Monitor to receive events from this task */
  monitor: TaskMonitor;
}

/**
 * Result of task execution (process-level).
 */
export interface RunTaskResult {
  code: number;
  elapsedMs: number;
}

/**
 * Events emitted during task execution.
 * Lifecycle: start → line* → done|error
 */
export interface TaskEvent {
  type: "start" | "line" | "done" | "error";
  /** Present on "start" event - the task label */
  label?: string;
  /** Present on "line" event - which stream the line came from */
  stream?: "stdout" | "stderr";
  /** Present on "line" event - the raw line text */
  line?: string;
  /** Present on "done" event - the process-level result */
  result?: RunTaskResult;
  /** Present on "error" event */
  error?: Error;
}

/**
 * Receives events from task execution.
 * One monitor can receive events from multiple sequential tasks.
 *
 * All lines from both stdout and stderr are emitted as events.
 * Monitors decide which stream(s) to observe and what regex to apply.
 * Use event.stream to distinguish between stdout and stderr.
 */
export interface TaskMonitor {
  onEvent(event: TaskEvent): void;
}

// ============================================================================
// Task (pure data, discriminated union)
// ============================================================================

export type TaskKind = "to-wav" | "transcribe";

interface TaskBase {
  kind: TaskKind;
  label: string;
  description: string;
  /** Absent before execution; present on the new task returned by executeTask() */
  elapsedMs?: number;
}

export interface ToWavTask extends TaskBase {
  kind: "to-wav";
  inputPath: string;
  outputPath: string;
  startSec: number;
  durationSec: number;
  cachePath: string;
  cache: boolean;
  logPrefix: string;
}

export interface TranscribeTask extends TaskBase {
  kind: "transcribe";
  wavPath: string;
  outputPrefix: string; // whisper outputs to ${outputPrefix}.vtt
  vttPath: string;
  model: string; // Short name (e.g., "tiny.en")
  modelPath: string; // Full path to model file
  threads: number;
  durationMs: number; // Whisper --duration (0 = full)
  wordTimestamps: boolean;
  cachePath: string;
  cache: boolean;
}

export type Task = ToWavTask | TranscribeTask;

// ============================================================================
// executeTask: pattern match on kind, return new Task with elapsedMs
// ============================================================================

/**
 * Execute a task. Returns a new Task with elapsedMs set.
 * The input task is never modified.
 * Throws on failure (non-zero exit code).
 */
export async function executeTask(
  task: Task,
  reporter: ProgressReporter,
): Promise<Task> {
  switch (task.kind) {
    case "to-wav":
      return executeToWav(task, reporter);
    case "transcribe":
      return executeTranscribe(task, reporter);
  }
}

async function executeToWav(
  task: ToWavTask,
  reporter: ProgressReporter,
): Promise<ToWavTask> {
  const start = Date.now();

  // Check cache first (if enabled)
  if (task.cache) {
    const cacheFile = Bun.file(task.cachePath);
    if (await cacheFile.exists()) {
      await Bun.write(task.outputPath, cacheFile);
      return { ...task, elapsedMs: Date.now() - start };
    }
  }

  // Cache miss (or caching disabled) - run ffmpeg
  const monitor = createAudioConversionMonitor(reporter);
  const config: TaskConfig = {
    label: task.label,
    command: "ffmpeg",
    args: [
      "-y",
      "-hide_banner",
      "-loglevel",
      "info",
      "-i",
      task.inputPath,
      "-ss",
      String(task.startSec),
      "-t",
      String(task.durationSec),
      "-acodec",
      "pcm_s16le",
      "-ar",
      "16000",
      "-ac",
      "1",
      task.outputPath,
    ],
    stdoutLogPath: `${task.logPrefix}.stdout.log`,
    stderrLogPath: `${task.logPrefix}.stderr.log`,
    monitor,
  };

  const result = await runTask(config);
  if (result.code !== 0) {
    throw new Error(`ffmpeg failed with exit code ${result.code}`);
  }

  // Cache the result (if enabled)
  if (task.cache) {
    await Bun.write(task.cachePath, Bun.file(task.outputPath));
  }

  return { ...task, elapsedMs: Date.now() - start };
}

async function executeTranscribe(
  task: TranscribeTask,
  reporter: ProgressReporter,
): Promise<TranscribeTask> {
  const start = Date.now();

  // Check cache first (if enabled)
  if (task.cache) {
    const cacheFile = Bun.file(task.cachePath);
    if (await cacheFile.exists()) {
      await Bun.write(task.vttPath, cacheFile);
      return { ...task, elapsedMs: Date.now() - start };
    }
  }

  // Cache miss (or caching disabled) - run whisper-cli
  const durationArgs =
    task.durationMs > 0 ? ["--duration", String(task.durationMs)] : [];
  const wordTimestampArgs = task.wordTimestamps
    ? ["--max-len", "1", "--split-on-word"]
    : [];

  const monitor = createWhisperCppMonitor(reporter);
  const config: TaskConfig = {
    label: task.label,
    command: "whisper-cli",
    args: [
      "--file",
      task.wavPath,
      "--model",
      task.modelPath,
      "--output-file",
      task.outputPrefix,
      "--output-vtt",
      "--print-progress",
      "--threads",
      String(task.threads),
      ...durationArgs,
      ...wordTimestampArgs,
    ],
    stdoutLogPath: `${task.outputPrefix}.stdout.log`,
    stderrLogPath: `${task.outputPrefix}.stderr.log`,
    monitor,
  };

  const result = await runTask(config);
  if (result.code !== 0) {
    throw new Error(`whisper-cli failed with exit code ${result.code}`);
  }

  // Cache the result (if enabled)
  if (task.cache) {
    await Bun.write(task.cachePath, Bun.file(task.vttPath));
  }

  return { ...task, elapsedMs: Date.now() - start };
}

// ============================================================================
// Core Process Runner
// ============================================================================

/**
 * Run a task, emitting events to its monitor.
 *
 * All lines from both stdout and stderr are emitted as "line" events.
 * The monitor decides which lines to act on based on event.stream and its own regex.
 */
export function runTask(config: TaskConfig): Promise<RunTaskResult> {
  const start = Date.now();
  const monitor = config.monitor;

  // Emit start event
  monitor.onEvent({ type: "start", label: config.label });

  // Open log files for streaming
  const stdoutLog = createWriteStream(config.stdoutLogPath);
  const stderrLog = createWriteStream(config.stderrLogPath);

  return new Promise((resolve, reject) => {
    const proc = spawn(config.command, config.args, {
      stdio: ["inherit", "pipe", "pipe"],
    }) as ChildProcess;

    // Emit all non-empty lines as events
    function emitLines(stream: "stdout" | "stderr", data: Buffer) {
      const text = data.toString();
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        if (line.trim()) {
          monitor.onEvent({ type: "line", stream, line });
        }
      }
    }

    // Handle stdout: log + emit events
    proc.stdout?.on("data", (data: Buffer) => {
      stdoutLog.write(data);
      emitLines("stdout", data);
    });

    // Handle stderr: log + emit events
    proc.stderr?.on("data", (data: Buffer) => {
      stderrLog.write(data);
      emitLines("stderr", data);
    });

    proc.on("error", (error: Error) => {
      monitor.onEvent({ type: "error", error });
      stdoutLog.end();
      stderrLog.end();
      reject(error);
    });

    proc.on("close", (code: number | null) => {
      const elapsedMs = Date.now() - start;
      const result: RunTaskResult = { code: code ?? 0, elapsedMs };
      monitor.onEvent({ type: "done", result });
      const closeError =
        code === 0 || code === null
          ? undefined
          : new Error(
              `Task "${config.label}" failed with exit code ${code}: ${config.command} ${config.args.join(
                " ",
              )}`,
            );

      // Wait for write streams to finish
      let pending = 2;
      const finish = () => {
        pending--;
        if (pending === 0) {
          if (closeError) {
            reject(closeError);
            return;
          }
          resolve(result);
        }
      };
      stdoutLog.end(finish);
      stderrLog.end(finish);
    });
  });
}

// ============================================================================
// Monitor Factories
// ============================================================================

/**
 * Creates a base console monitor that prints raw matching lines.
 */
export function createConsoleMonitor(reporter: ProgressReporter): TaskMonitor {
  let currentTaskLabel = "";

  return {
    onEvent(event: TaskEvent): void {
      renderConsoleEvent(reporter, event, () => {
        if (event.type === "start") currentTaskLabel = event.label ?? "";
        return currentTaskLabel;
      });
    },
  };
}

/**
 * Quiet monitor - only shows start/done, ignores line output.
 */
export function createQuietMonitor(reporter: ProgressReporter): TaskMonitor {
  let currentTaskLabel = "";

  return {
    onEvent(event: TaskEvent): void {
      if (event.type === "line") return;
      renderConsoleEvent(reporter, event, () => {
        if (event.type === "start") currentTaskLabel = event.label ?? "";
        return currentTaskLabel;
      });
    },
  };
}

function renderConsoleEvent(
  reporter: ProgressReporter,
  event: TaskEvent,
  getTaskLabel: () => string,
) {
  const taskLabel = getTaskLabel();
  switch (event.type) {
    case "start":
      reporter.update(event.label ?? "", "starting...");
      break;
    case "line":
      reporter.update(taskLabel, event.line ?? "");
      break;
    case "done": {
      const secs = Math.round((event.result?.elapsedMs ?? 0) / 1000);
      reporter.update(taskLabel, `done (${secs}s)`);
      break;
    }
    case "error":
      reporter.update(taskLabel, `error: ${event.error}`);
      break;
  }
}

/**
 * Monitor for FFmpeg audio format conversion.
 * Observes stderr only (FFmpeg writes progress to stderr).
 */
export function createAudioConversionMonitor(
  reporter: ProgressReporter,
): TaskMonitor {
  let currentTaskLabel = "";
  const regex = /size=\s*(\d+.*time=[\d:.]+)/;

  return {
    onEvent(event: TaskEvent): void {
      if (event.type !== "line") {
        renderConsoleEvent(reporter, event, () => {
          if (event.type === "start") currentTaskLabel = event.label ?? "";
          return currentTaskLabel;
        });
        return;
      }

      if (event.stream === "stderr" && event.line) {
        const m = event.line.match(regex);
        if (m) {
          reporter.update(currentTaskLabel, m[1]!);
        }
      }
    },
  };
}

/**
 * Monitor for whisper-cpp.
 * Observes stderr only (whisper-cpp writes progress to stderr).
 */
export function createWhisperCppMonitor(
  reporter: ProgressReporter,
): TaskMonitor {
  let currentTaskLabel = "";
  const regex = /progress\s*=\s*(\d+%)/;

  return {
    onEvent(event: TaskEvent): void {
      if (event.type !== "line") {
        renderConsoleEvent(reporter, event, () => {
          if (event.type === "start") currentTaskLabel = event.label ?? "";
          return currentTaskLabel;
        });
        return;
      }

      if (event.stream === "stderr" && event.line) {
        const m = event.line.match(regex);
        if (m) {
          reporter.update(currentTaskLabel, m[1]!);
        }
      }
    },
  };
}
