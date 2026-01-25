/**
 * Shared test utilities for whisper integration tests.
 */

import { join } from "node:path";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";

// Common paths
export const PACKAGE_ROOT = join(import.meta.dir, "..");
export const TEST_WORK_DIR_ROOT = join(PACKAGE_ROOT, "data/work");

// Test fixtures
export const FIXTURE_JFK = join(PACKAGE_ROOT, "test/fixtures/jfk.m4b");
export const FIXTURE_ROADNOTTAKEN = join(
  PACKAGE_ROOT,
  "test/fixtures/roadnottaken.m4b",
);

/**
 * Track work directories for cleanup in afterAll.
 * Usage:
 *   const cleanup = createWorkDirCleanup();
 *   // In test: cleanup.track(runWorkDir);
 *   // In afterAll: await cleanup.run();
 */
export function createWorkDirCleanup() {
  const dirs: string[] = [];

  return {
    track(dir: string) {
      dirs.push(dir);
    },
    async run() {
      for (const dir of dirs) {
        if (existsSync(dir)) {
          await rm(dir, { recursive: true });
        }
      }
    },
  };
}

/**
 * Clean up an output directory (rm + mkdir).
 */
export async function resetOutputDir(dir: string) {
  const { mkdir } = await import("node:fs/promises");
  if (existsSync(dir)) {
    await rm(dir, { recursive: true });
  }
  await mkdir(dir, { recursive: true });
}

/**
 * Clean up an output directory if it exists.
 */
export async function cleanupOutputDir(dir: string) {
  if (existsSync(dir)) {
    await rm(dir, { recursive: true });
  }
}
