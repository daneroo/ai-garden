/**
 * Task execution and monitoring module.
 *
 * ARCHITECTURE:
 *
 * Runners (lib/runners.ts) build a task array, then decide:
 *   - Dry-run: report commands only, no monitor needed
 *   - Execute: create monitor, run tasks sequentially
 *
 * runTask(config, monitor)
 *   - Spawns process, streams stdout/stderr to log files
 *   - Emits events to monitor for matching lines
 *   - Returns TaskResult with exit code and elapsed time
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
 *   - ffmpegMonitor: audio conversion progress (stderr)
 *   - whisperCppMonitor: transcription progress (stderr)
 *   - whisperkitMonitor: transcription progress (stdout)
 */

import { type ChildProcess, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { Buffer } from "node:buffer";
import { type ProgressReporter } from "./progress.ts";

// ============================================================================
// Types
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
 * Result of task execution.
 */
export interface TaskResult {
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
  /** Present on "line" event - the raw matching line */
  line?: string;
  /** Present on "done" event - the task result */
  result?: TaskResult;
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
// Core Functions
// ============================================================================

/**
 * Run a task, emitting events to its monitor.
 *
 * All lines from both stdout and stderr are emitted as "line" events.
 * The monitor decides which lines to act on based on event.stream and its own regex.
 */
export function runTask(config: TaskConfig): Promise<TaskResult> {
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
      const result: TaskResult = { code: code ?? 0, elapsedMs };
      monitor.onEvent({ type: "done", result });

      // Wait for write streams to finish
      let pending = 2;
      const finish = () => {
        pending--;
        if (pending === 0) {
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
 * Use for simple commands like cp that don't have progress output.
 */
export function createQuietMonitor(reporter: ProgressReporter): TaskMonitor {
  let currentTaskLabel = "";

  return {
    onEvent(event: TaskEvent): void {
      if (event.type === "line") return; // Ignore all lines
      renderConsoleEvent(reporter, event, () => {
        if (event.type === "start") currentTaskLabel = event.label ?? "";
        return currentTaskLabel;
      });
    },
  };
}

/**
 * Internal helper for consistent console rendering using ProgressReporter.
 */
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
 * Note: Monitors can observe either stream or both by checking event.stream.
 */
export function createAudioConversionMonitor(
  reporter: ProgressReporter,
): TaskMonitor {
  let currentTaskLabel = "";
  // Example: size=  26154KiB time=00:13:58.33 bitrate= 255.8kbits/s speed=1.31e+03x
  // Captures: "26154KiB time=00:13:58.33" for display
  const regex = /size=\s*(\d+.*time=[\d:.]+)/;

  return {
    onEvent(event: TaskEvent): void {
      // Handle lifecycle events (start, done, error)
      if (event.type !== "line") {
        renderConsoleEvent(reporter, event, () => {
          if (event.type === "start") currentTaskLabel = event.label ?? "";
          return currentTaskLabel;
        });
        return;
      }

      // Only display stderr lines matching progress regex
      if (event.stream === "stderr" && event.line) {
        const m = event.line.match(regex);
        if (m) {
          reporter.update(currentTaskLabel, m[1]!);
        }
      }
      // Non-matching lines are silently ignored
    },
  };
}

/**
 * Monitor for whisper-cpp.
 * Observes stderr only (whisper-cpp writes progress to stderr).
 * Note: Monitors can observe either stream or both by checking event.stream.
 */
export function createWhisperCppMonitor(
  reporter: ProgressReporter,
): TaskMonitor {
  let currentTaskLabel = "";
  // Captures: "50%" for display
  const regex = /progress\s*=\s*(\d+%)/;

  return {
    onEvent(event: TaskEvent): void {
      // Handle lifecycle events (start, done, error)
      if (event.type !== "line") {
        renderConsoleEvent(reporter, event, () => {
          if (event.type === "start") currentTaskLabel = event.label ?? "";
          return currentTaskLabel;
        });
        return;
      }

      // Only display stderr lines matching progress regex
      if (event.stream === "stderr" && event.line) {
        const m = event.line.match(regex);
        if (m) {
          reporter.update(currentTaskLabel, m[1]!);
        }
      }
      // Non-matching lines are silently ignored
    },
  };
}
