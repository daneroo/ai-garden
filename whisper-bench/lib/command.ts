/**
 * Command execution module with streaming logs and progress tracking.
 *
 * ARCHITECTURE (top-down):
 *
 * runSubTask (primary API)
 *   - What callers typically use
 *   - Prints "[label] starting..." / "[label] done (Xs)" markers
 *   - Adds [label] prefix to progress output
 *   - OUTPUT HANDLING embedded here (marked for future extraction)
 *
 * StreamHandler
 *   - Decouples progress regex from the command executor
 *   - Factory functions (ffmpegConvertHandler, etc.) encapsulate regex + formatting
 *   - The handler's onMatch callback receives matched data and decides what to write
 *
 * runCommand (implementation detail)
 *   - Called internally by runSubTask
 *   - Spawns process with streaming stdout/stderr to log files
 *   - Applies StreamHandler to parse progress patterns
 *   - Returns exit code and elapsed time
 *   - NO output display - caller handles what to do with progress data
 *
 * Usage flow:
 *   runSubTask -> runCommand -> spawn
 *        |             |
 *        |             +-> StreamHandler.onMatch() called with regex matches
 *        |
 *        +-> Writes labels/markers to stderr (OUTPUT HANDLING)
 */

import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { Buffer } from "node:buffer";
import process from "node:process";

/**
 * Configuration for running a command.
 */
export interface CommandConfig {
  command: string;
  args: string[];
  stdoutLogPath: string;
  stderrLogPath: string;
}

/**
 * Result of a command execution.
 */
export interface CommandResult {
  code: number;
  elapsedMs: number;
}

/**
 * Handler for parsing progress from a command's stdout or stderr stream.
 *
 * As the command runs, each line of output is matched against `regex`.
 * When a match is found, `onMatch` is called with the RegExpMatchArray,
 * allowing the caller to extract and display progress information.
 *
 * @example
 *   // Create handler for ffmpeg (stderr)
 *   const handler: StreamHandler = {
 *     regex: /size=.*elapsed=\d+:\d+:\d+\.\d+/,
 *     onMatch: (m) => console.log(m[0]),
 *   };
 *   runCommand(cmdConfig, { stderr: handler });
 *
 * Pre-built factory functions: `ffmpegConvertHandler`, `whisperCppHandler`, `whisperkitHandler`
 */
export interface StreamHandler {
  regex: RegExp;
  onMatch: (match: RegExpMatchArray) => void;
}

/**
 * Configuration for running a labeled sub-task.
 */
export interface SubTaskConfig {
  label: string;
  command: string;
  args: string[];
  stdoutLogPath: string;
  stderrLogPath: string;
  stdout?: StreamHandler;
  stderr?: StreamHandler;
}

// ============================================================================
// Helper to create common stream handlers
// ============================================================================

/**
 * Create a stderr handler for ffmpeg audio conversion progress.
 * Parses progress during format conversion (e.g., M4B→MP3).
 * Example line: size=22016KiB time=00:28:01 bitrate=107kb/s speed=175x elapsed=0:00:09.57
 */
export function ffmpegConvertHandler(
  onProgress: (line: string) => void,
): StreamHandler {
  return {
    regex: /size=.*elapsed=\d+:\d+:\d+\.\d+/,
    onMatch: (m) => onProgress(m[0]),
  };
}

/**
 * Create a stderr handler for whisper-cpp progress.
 * Example line: whisper_print_progress_callback: progress = 50%
 */
export function whisperCppHandler(
  onProgress: (percent: string) => void,
): StreamHandler {
  return {
    regex: /progress\s*=\s*(\d+%)/,
    onMatch: (m) => onProgress(m[1]),
  };
}

/**
 * Create a stdout handler for whisperkit progress.
 * Example line: ] 50% | Elapsed Time: 1.23 s | Remaining: 1.23 s
 * or: ] 50% | Elapsed Time: 1.23 s | Remaining: Estimating...
 */
export function whisperkitHandler(
  onProgress: (formatted: string) => void,
): StreamHandler {
  return {
    regex:
      /]\s*(\d+%)\s*\|\s*Elapsed Time:\s*([\d.]+\s*s)\s*\|\s*Remaining:\s*([\d.]+\s*s|Estimating\.\.\.)/,
    onMatch: (m) => onProgress(`${m[1]} | ${m[2]} | ${m[3]}`),
  };
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Run a command with streaming output to log files.
 *
 * Spawns the command and pipes stdout/stderr to the provided log file paths
 * in real-time. Optionally applies handlers to parse output.
 */
export function runCommand(
  config: CommandConfig,
  handlers?: { stdout?: StreamHandler; stderr?: StreamHandler },
): Promise<CommandResult> {
  const { command, args, stdoutLogPath, stderrLogPath } = config;

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const proc = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
    });

    const stdoutStream = createWriteStream(stdoutLogPath);
    const stderrStream = createWriteStream(stderrLogPath);

    // Create a handler that parses lines and dedupes progress.
    // ASSUMPTION: Lines are not split across stream chunks. This works in practice
    // because progress lines are short and typically come in complete. The dedupe
    // check (lastMatch) also helps skip re-processing if a partial match occurs.
    // For robustness, this could be enhanced to buffer incomplete lines.
    const createLineParser = (handler?: StreamHandler) => {
      if (!handler) return (_text: string) => {};
      let lastMatch = "";
      return (text: string) => {
        for (const line of text.split(/[\r\n]+/)) {
          const match = line.match(handler.regex);
          if (match && match[0] !== lastMatch) {
            lastMatch = match[0];
            handler.onMatch(match);
          }
        }
      };
    };

    const parseStdout = createLineParser(handlers?.stdout);
    const parseStderr = createLineParser(handlers?.stderr);

    proc.stdout?.on("data", (data: Buffer) => {
      const text = data.toString();
      stdoutStream.write(text);
      parseStdout(text);
    });

    proc.stderr?.on("data", (data: Buffer) => {
      const text = data.toString();
      stderrStream.write(text);
      parseStderr(text);
    });

    proc.on("error", (error) => {
      stdoutStream.end();
      stderrStream.end();
      reject(error);
    });

    proc.on("close", (code) => {
      stdoutStream.end();
      stderrStream.end();
      resolve({
        code: code ?? 0,
        elapsedMs: Date.now() - startTime,
      });
    });
  });
}

/**
 * Run a labeled sub-task with start/done markers.
 *
 * Prints `[label] starting...` at start, progress updates during execution,
 * and `[label] done (Xs)` at completion.
 *
 * NOTE: Output handling is currently embedded here. This could be extracted
 * to a separate display/output module in the future.
 */
export async function runSubTask(
  config: SubTaskConfig,
): Promise<CommandResult> {
  const { label, command, args, stdoutLogPath, stderrLogPath, stdout, stderr } =
    config;

  // ============================================================================
  // OUTPUT HANDLING: Starting marker
  // This could be extracted to a display module
  // ============================================================================
  process.stderr.write(`[${label}] starting...\n`);

  // ============================================================================
  // OUTPUT HANDLING: Progress line wrapping
  // Wrap handlers to add label prefix and clear line before each update
  // ============================================================================
  const wrapHandler = (handler?: StreamHandler): StreamHandler | undefined => {
    if (!handler) return undefined;
    return {
      regex: handler.regex,
      onMatch: (match) => {
        // OUTPUT: Clear line, print with label prefix
        process.stderr.write(`\x1b[2K\r[${label}] `);
        handler.onMatch(match);
      },
    };
  };

  const result = await runCommand(
    { command, args, stdoutLogPath, stderrLogPath },
    { stdout: wrapHandler(stdout), stderr: wrapHandler(stderr) },
  );

  // ============================================================================
  // OUTPUT HANDLING: Done marker
  // ============================================================================
  const elapsedSec = Math.round(result.elapsedMs / 1000);
  process.stderr.write(`\x1b[2K\r[${label}] done (${elapsedSec}s)\n`);

  return result;
}
