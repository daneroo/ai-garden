/**
 * Preflight checks for whisper-bench
 */

import { existsSync } from "node:fs";

/**
 * Check if a command exists in PATH or as a file
 */
export function commandExists(cmd: string): boolean {
  if (existsSync(cmd)) return true;
  try {
    const proc = Bun.spawnSync(["which", cmd]);
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Required system commands
 */
const REQUIRED_COMMANDS = ["ffmpeg", "ffprobe"];

/**
 * Run preflight checks - verify required commands exist
 * Returns list of missing commands, empty if all present
 */
export function preflightCheck(commands: string[]): {
  missing: string[];
} {
  const missing: string[] = [];

  // Check required global commands
  for (const cmd of REQUIRED_COMMANDS) {
    if (!commandExists(cmd)) {
      missing.push(cmd);
    }
  }

  // Check runner-specific commands
  for (const cmd of commands) {
    if (!commandExists(cmd)) {
      missing.push(cmd);
    }
  }

  return { missing };
}
