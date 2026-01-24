/**
 * Progress reporting module for stderr output.
 *
 * ProgressReporter is a stateful output handler that formats and writes
 * progress updates to stderr. It is distinct from TaskMonitor, which
 * receives events from spawned processes.
 *
 * Architecture:
 *   - Created once per run in runWhisper()
 *   - Passed to TaskMonitor factories
 *   - Monitors call reporter.update() on task events
 *   - runWhisper calls reporter.finish() with final metrics
 *
 * All formatting is isolated in formatLine() for easy customization.
 */

import process from "node:process";

/**
 * Stateful progress reporter for stderr output.
 * Handles updating a single line with carriage returns.
 */
export interface ProgressReporter {
  /** Update the current line with task progress (no newline) */
  update(taskLabel: string, status: string): void;

  /** Write final result line and add newline */
  finish(elapsed: number, speedup: string, vttDuration?: string): void;
}

/** Config subset needed for progress reporting */
export interface ProgressConfig {
  inputBasename: string;
  modelShortName: string;
}

/**
 * Create a progress reporter for a single run.
 * All stderr output for the run will use this reporter.
 */
export function createProgressReporter(
  config: ProgressConfig,
): ProgressReporter {
  const { inputBasename, modelShortName } = config;

  /**
   * Format a progress line. Isolated for easy customization.
   * Format: - [i=BASENAME m=MODEL - task=LABEL] : STATUS
   */
  function formatLine(taskLabel: string, status: string): string {
    const taskPart = taskLabel ? ` - task=${taskLabel}` : "";
    return `- [i=${inputBasename} m=${modelShortName}${taskPart}] : ${status}`;
  }

  return {
    update(taskLabel, status) {
      // Clear line and write updated status (no newline)
      process.stderr.write(`\x1b[2K\r${formatLine(taskLabel, status)}`);
    },

    finish(elapsed, speedup, vttDuration) {
      // Build final status string
      const vttPart = vttDuration ? ` vttDuration=${vttDuration}` : "";
      const status = `elapsed=${elapsed}s speedup=${speedup}x${vttPart}`;

      // Clear line, write final status, add newline to persist
      process.stderr.write(`\x1b[2K\r${formatLine("", status)}\n`);
    },
  };
}
