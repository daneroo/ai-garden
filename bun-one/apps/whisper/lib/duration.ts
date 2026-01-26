/**
 * Go-style duration parsing and formatting utilities.
 *
 * Supports formats like "1h", "30m", "90s", "1h30m", "2h15m30s"
 */

/**
 * Parse a Go-style duration string to seconds.
 *
 * @param s - Duration string (e.g., "1h", "30m", "1h30m", "90s")
 * @returns Duration in seconds
 * @throws Error if the format is invalid
 *
 * @example
 * parseDuration("1h")     // 3600
 * parseDuration("30m")    // 1800
 * parseDuration("1h30m")  // 5400
 * parseDuration("90s")    // 90
 * parseDuration("2h15m30s") // 8130
 */
export function parseDuration(s: string): number {
  if (!s || s.trim() === "") {
    throw new Error("Duration string cannot be empty");
  }

  const input = s.trim().toLowerCase();

  // Handle plain numbers as seconds
  if (/^\d+$/.test(input)) {
    return parseInt(input, 10);
  }

  // Match pattern: optional hours, optional minutes, optional seconds
  const regex = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/;
  const match = input.match(regex);

  if (
    !match ||
    (match[1] === undefined && match[2] === undefined && match[3] === undefined)
  ) {
    throw new Error(
      `Invalid duration format: "${s}". Expected format like "1h", "30m", "1h30m", "90s"`,
    );
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseInt(match[3], 10) : 0;

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds as a compact Go-style duration string.
 * Used in filenames and display.
 *
 * @param secs - Duration in seconds
 * @returns Formatted duration string (e.g., "1h30m", "45s")
 *
 * @example
 * formatDuration(3600)  // "1h"
 * formatDuration(5400)  // "1h30m"
 * formatDuration(90)    // "1m30s"
 * formatDuration(45)    // "45s"
 */
export function formatDuration(secs: number): string {
  if (secs < 0) {
    throw new Error("Duration cannot be negative");
  }

  if (secs === 0) {
    return "0s";
  }

  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  let result = "";
  if (hours > 0) result += `${hours}h`;
  if (minutes > 0) result += `${minutes}m`;
  if (seconds > 0) result += `${seconds}s`;

  return result;
}
