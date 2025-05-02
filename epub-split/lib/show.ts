import { ComparisonWarning } from "./types.ts";

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

/**
 * Creates a progress indicator that writes to stderr.
 * Returns functions to update and complete the progress display.
 *
 * @param total - Total number of items to process
 * @param prefix - Optional prefix text before the progress
 * @returns Object containing update() and done() functions
 *
 * @example
 * ```typescript
 * const { update, done } = createProgress(100, "Processing files");
 *
 * // Update progress
 * for (let i = 0; i <= 100; i++) {
 *   update(i);
 *   // Simulate work
 *   await new Promise(resolve => setTimeout(resolve, 50));
 * }
 *
 * // Clear the progress indicator when done
 * done();
 * ```
 */
export function createProgress(
  total: number,
  prefix: string = "Processing"
): {
  update: (current: number) => void;
  done: () => void;
} {
  const spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let spinnerIndex = 0;

  function update(current: number) {
    const spinnerChar = spinner[spinnerIndex];
    spinnerIndex = (spinnerIndex + 1) % spinner.length;

    // Use \r to return to start of line and \x1B[K to clear the line
    process.stderr.write(
      `\r${spinnerChar} ${prefix} ${current}/${total} \x1B[K`
    );
  }

  function done() {
    process.stderr.write("\r\x1B[K"); // Clear the line
  }

  return { update, done };
}
