/**
 * Returns a check-mark or x-mark based on a boolean value
 * @param value - The value to check
 * @returns "✓" or "✗"
 */
export function checkOrXmark(value: boolean): string {
  return value ? "✓" : "✗";
}
