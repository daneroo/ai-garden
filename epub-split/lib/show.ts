import { ComparisonWarning } from "./types.ts";

export function showWarnings(warnings: ComparisonWarning[]) {
  if (warnings.length === 0) return;
  console.log("\nWarnings:");
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
