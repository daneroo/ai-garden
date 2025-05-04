import { ComparisonWarning, ParserResult } from "./types.ts";

export function showParserValidation(
  bookName: string,
  parserResult: ParserResult
) {
  if (parserResult.errors.length > 0 || parserResult.warnings.length > 0) {
    console.log(`\n## ${bookName}\n`);
    for (const error of parserResult.errors) {
      console.log(`- Error: ${error}`);
    }
    for (const warning of parserResult.warnings) {
      console.log(`- Warning: ${warning}`);
    }
  }
}

export function showWarnings(warnings: ComparisonWarning[]) {
  if (warnings.length === 0) return;
  warnings.forEach((w) => console.log(`  ${xMark} ${w.type}: ${w.message}`));
}

/**
 * Returns a check-mark or x-mark based on a boolean value
 * @param value - The value to check
 * @returns "✓" or "✗"
 */
export function checkOrXmark(value: boolean): string {
  return value ? checkMark : xMark;
}

export const checkMark = `✓`;
export const xMark = `✗`;
export const warningMark = `▲`;
export const infoMark = `ⓘ`;

/**
 * Creates a progress indicator that writes to stderr.
 * Returns functions to update and complete the progress display.
 *
 * @param total - Total number of items to process
 * @param prefix - Optional prefix text before the progress (default: "Processing")
 * @returns Object containing updateProgress(), leaveTrace(), and doneProgress() functions
 *
 * @example
 * ```typescript
 * const { updateProgress, leaveTrace, doneProgress } = createProgress(100, "Processing files");
 *
 * // Update progress with a message
 * for (let i = 0; i < 100; i++) {
 *   updateProgress(i, "current-file.txt");
 *
 *   // Leave a trace message for important events
 *   if (i % 10 === 0) {
 *     leaveTrace(`Found interesting pattern in file ${i}`);
 *   }
 *
 *   // Simulate work
 *   await new Promise(resolve => setTimeout(resolve, 50));
 * }
 *
 * // Clear the progress indicator when done
 * doneProgress();
 * ```
 */
export function createProgress(
  total: number,
  prefix: string = "Processing"
): {
  updateProgress: (current: number, message?: string) => void;
  leaveTrace: (message: string) => void;
  doneProgress: () => void;
} {
  const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let spinnerIndex = 0;
  const startTime = Date.now();

  function formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    return seconds.toString().padStart(3, " ");
  }

  function updateProgress(current: number, message?: string) {
    const spinnerChar = spinner[spinnerIndex];
    spinnerIndex = (spinnerIndex + 1) % spinner.length;

    const now = Date.now();
    const elapsed = now - startTime;
    const progress = (current + 1) / total;
    const remaining = Math.floor(elapsed / progress - elapsed);

    const timeStr = `↑${formatTime(elapsed)}s ↓${formatTime(remaining)}s`;

    const progressStr = `${current + 1}/${total}`;
    const messagePart = message ? ` - ${message}` : "";

    process.stderr.write(
      `\r${spinnerChar} ${prefix} ${progressStr} ${timeStr}${messagePart} \x1B[K`
    );
  }

  function leaveTrace(message: string) {
    // First, clear the current progress line
    process.stderr.write(`\r\x1B[K`);
    // Write the trace message
    process.stderr.write(`${message}\n`);
    // Redraw the progress line
    updateProgress(current, currentMessage);
  }

  function doneProgress() {
    const totalTime = Date.now() - startTime;
    const totalSeconds = (totalTime / 1000).toFixed(1);
    const avgSeconds = (totalTime / total / 1000).toFixed(2);
    process.stderr.write(`\r\x1B[K`); // Clear the line
    process.stderr.write(
      `- ${prefix} ${total}/${total} Done in ${totalSeconds}s - avg: ${avgSeconds}s\n`
    );
  }

  // Track current state for leaveTrace
  let current = 0;
  let currentMessage: string | undefined;

  function wrappedUpdateProgress(current: number, message?: string) {
    current = current;
    currentMessage = message;
    updateProgress(current, message);
  }

  return { updateProgress: wrappedUpdateProgress, leaveTrace, doneProgress };
}
