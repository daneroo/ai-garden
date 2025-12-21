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

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { Buffer } from "node:buffer";
import process from "node:process";

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
  /** Lines matching this regex are emitted as events (optional) */
  stdoutFilter?: RegExp;
  stderrFilter?: RegExp;
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
 */
export interface TaskMonitor {
  onEvent(event: TaskEvent): void;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Run a task, emitting events to the monitor.
 */
export function runTask(
  config: TaskConfig,
  monitor: TaskMonitor,
): Promise<TaskResult> {
  const start = Date.now();

  // Emit start event
  monitor.onEvent({ type: "start", label: config.label });

  // Open log files for streaming
  const stdoutLog = createWriteStream(config.stdoutLogPath);
  const stderrLog = createWriteStream(config.stderrLogPath);

  return new Promise((resolve, reject) => {
    const proc = spawn(config.command, config.args, {
      stdio: ["inherit", "pipe", "pipe"],
    });

    // Create line parser with optional filter
    function createLineEmitter(stream: "stdout" | "stderr", filter?: RegExp) {
      return (data: Buffer) => {
        const text = data.toString();
        const lines = text.split(/[\r\n]+/);
        for (const line of lines) {
          if (line.trim() && (!filter || filter.test(line))) {
            monitor.onEvent({ type: "line", stream, line });
          }
        }
      };
    }

    // Handle stdout
    proc.stdout?.on("data", (data: Buffer) => {
      stdoutLog.write(data);
      if (config.stdoutFilter) {
        createLineEmitter("stdout", config.stdoutFilter)(data);
      }
    });

    // Handle stderr
    proc.stderr?.on("data", (data: Buffer) => {
      stderrLog.write(data);
      if (config.stderrFilter) {
        createLineEmitter("stderr", config.stderrFilter)(data);
      }
    });

    proc.on("error", (error) => {
      monitor.onEvent({ type: "error", error });
      stdoutLog.end();
      stderrLog.end();
      reject(error);
    });

    proc.on("close", (code) => {
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
export function createConsoleMonitor(parentLabel: string): TaskMonitor {
  let currentTaskLabel = "";

  return {
    onEvent(event: TaskEvent): void {
      renderConsoleEvent(parentLabel, event, () => {
        if (event.type === "start") currentTaskLabel = event.label ?? "";
        return currentTaskLabel;
      });
    },
  };
}

/**
 * Internal helper for consistent console rendering.
 */
function renderConsoleEvent(
  parentLabel: string,
  event: TaskEvent,
  getTaskLabel: () => string,
) {
  const taskLabel = getTaskLabel();
  switch (event.type) {
    case "start":
      process.stderr.write(`[${parentLabel}] ${event.label} starting...\n`);
      break;
    case "line":
      // Carriage return to update in place
      process.stderr.write(`[${parentLabel}] ${event.line}\r`);
      break;
    case "done": {
      const secs = Math.round((event.result?.elapsedMs ?? 0) / 1000);
      process.stderr.write(`\n[${parentLabel}] ${taskLabel} done (${secs}s)\n`);
      break;
    }
    case "error":
      process.stderr.write(
        `[${parentLabel}] ${taskLabel} error: ${event.error}\n`,
      );
      break;
  }
}

/**
 * Monitor for FFmpeg audio conversion.
 */
export function createFFmpegMonitor(parentLabel: string): TaskMonitor {
  let currentTaskLabel = "";
  const regex = /size=\s*(\d+.*time=[\d:.]+)/;

  return {
    onEvent(event: TaskEvent): void {
      if (event.type === "line" && event.line) {
        const m = event.line.match(regex);
        if (m) {
          process.stderr.write(`[${parentLabel}] ${m[1]}\r`);
          return;
        }
      }
      renderConsoleEvent(parentLabel, event, () => {
        if (event.type === "start") currentTaskLabel = event.label ?? "";
        return currentTaskLabel;
      });
    },
  };
}

/**
 * Monitor for whisper-cpp.
 */
export function createWhisperCppMonitor(parentLabel: string): TaskMonitor {
  let currentTaskLabel = "";
  const regex = /progress\s*=\s*(\d+%)/;

  return {
    onEvent(event: TaskEvent): void {
      if (event.type === "line" && event.line) {
        const m = event.line.match(regex);
        if (m) {
          process.stderr.write(`[${parentLabel}] ${m[1]}\r`);
          return;
        }
      }
      renderConsoleEvent(parentLabel, event, () => {
        if (event.type === "start") currentTaskLabel = event.label ?? "";
        return currentTaskLabel;
      });
    },
  };
}

/**
 * Monitor for whisperkit.
 */
export function createWhisperKitMonitor(parentLabel: string): TaskMonitor {
  let currentTaskLabel = "";
  const regex =
    /]\s*(\d+%)\s*\|\s*Elapsed Time:\s*([\d.]+\s*s)\s*\|\s*Remaining:\s*([\d.]+\s*s|Estimating\.\.\.)/;

  return {
    onEvent(event: TaskEvent): void {
      if (event.type === "line" && event.line) {
        const m = event.line.match(regex);
        if (m) {
          process.stderr.write(
            `[${parentLabel}] ${m[1]} | ${m[2]} | ${m[3]}\r`,
          );
          return;
        }
      }
      renderConsoleEvent(parentLabel, event, () => {
        if (event.type === "start") currentTaskLabel = event.label ?? "";
        return currentTaskLabel;
      });
    },
  };
}

// ============================================================================
// Filter Regexes (for TaskConfig)
// ============================================================================

/**
 * FFmpeg audio conversion progress line.
 * Example: size=  26154KiB time=00:13:58.33 bitrate= 255.8kbits/s speed=1.31e+03x
 */
export const FFMPEG_AUDIO_PROGRESS_REGEX = /size=\s*\d+.*time=/;

/**
 * whisper-cpp progress line.
 * Example: whisper_print_progress_callback: progress = 50%
 */
export const WHISPER_CPP_PROGRESS_REGEX = /progress\s*=\s*\d+%/;

/**
 * whisperkit progress line.
 * Example: ] 50% | Elapsed Time: 1.23 s | Remaining: 1.23 s
 * or: ] 50% | Elapsed Time: 1.23 s | Remaining: Estimating...
 */
export const WHISPERKIT_PROGRESS_REGEX = /]\s*\d+%\s*\|/;
