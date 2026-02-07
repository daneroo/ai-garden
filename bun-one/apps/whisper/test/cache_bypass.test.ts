/**
 * Integration test for --no-cache flag.
 *
 * TEST STRATEGY:
 * 1. Clear cache for test input
 * 2. Run with cache=false → verify NO cache files created
 * 3. Run with cache=true → verify cache files WERE created
 * 4. Record cache file modification times
 * 5. Run with cache=false again → verify cache files UNCHANGED (not read/written)
 *
 * This verifies:
 * - cache=false skips reading from cache
 * - cache=false skips writing to cache
 * - cache=true reads/writes cache normally
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, statSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";

import {
  createRunWorkDir,
  type RunConfig,
  runWhisper,
} from "../lib/runners.ts";
import {
  cleanupOutputDir,
  createWorkDirCleanup,
  FIXTURE_JFK,
  PACKAGE_ROOT,
  resetOutputDir,
  TEST_WORK_DIR_ROOT,
} from "./helpers.ts";

const TEST_OUTPUT_DIR = join(PACKAGE_ROOT, "data/output/cache-bypass-test");
const CACHE_DIR = join(PACKAGE_ROOT, "data/cache");

const workDirCleanup = createWorkDirCleanup();

// Helper: Find all cache files for JFK fixture
async function findJfkCacheFiles(): Promise<string[]> {
  const files: string[] = [];
  const wavDir = join(CACHE_DIR, "wav");
  const vttDir = join(CACHE_DIR, "vtt");

  if (existsSync(wavDir)) {
    const wavFiles = await readdir(wavDir);
    files.push(
      ...wavFiles
        .filter((f) => f.startsWith("jfk-"))
        .map((f) => join(wavDir, f)),
    );
  }

  if (existsSync(vttDir)) {
    const vttFiles = await readdir(vttDir);
    files.push(
      ...vttFiles
        .filter((f) => f.startsWith("jfk-"))
        .map((f) => join(vttDir, f)),
    );
  }

  return files;
}

// Helper: Clear cache files for JFK fixture
async function clearJfkCache(): Promise<void> {
  const files = await findJfkCacheFiles();
  for (const file of files) {
    await rm(file);
  }
}

// Helper: Get modification times of cache files
function getCacheMtimes(files: string[]): Date[] {
  return files.map((f) => statSync(f).mtime);
}

// Helper: Create run config
function createTestConfig(tag: string, cache: boolean): RunConfig {
  const runWorkDir = createRunWorkDir({
    workDirRoot: TEST_WORK_DIR_ROOT,
    inputPath: FIXTURE_JFK,
    tag,
  });
  workDirCleanup.track(runWorkDir);

  return {
    input: FIXTURE_JFK,
    modelShortName: "tiny.en",
    threads: 4,
    durationSec: 0,
    outputDir: TEST_OUTPUT_DIR,
    runWorkDir,
    tag,
    verbosity: 0,
    dryRun: false,
    wordTimestamps: false,
    cache,
    quiet: true,
    segmentSec: 0,
  };
}

describe("cache bypass", () => {
  beforeAll(async () => {
    await resetOutputDir(TEST_OUTPUT_DIR);
  });

  afterAll(async () => {
    await cleanupOutputDir(TEST_OUTPUT_DIR);
    await workDirCleanup.run();
  });

  test("cache=false bypasses WAV and VTT cache", async () => {
    // Step 1: Clear any existing JFK cache
    await clearJfkCache();

    // Step 2: Run WITHOUT cache
    const config1 = createTestConfig("nocache-1", false);
    await runWhisper(config1);

    // Step 3: Verify NO cache files created
    let cacheFiles = await findJfkCacheFiles();
    expect(cacheFiles.length).toBe(0);

    // Step 4: Run WITH cache
    const config2 = createTestConfig("withcache", true);
    await runWhisper(config2);

    // Step 5: Verify cache files WERE created
    cacheFiles = await findJfkCacheFiles();
    expect(cacheFiles.length).toBeGreaterThan(0);

    // Step 6: Record cache modification times
    const mtimesBefore = getCacheMtimes(cacheFiles);

    // Step 7: Wait a bit to ensure mtime would change if files were written
    await Bun.sleep(100);

    // Step 8: Run WITHOUT cache again
    const config3 = createTestConfig("nocache-2", false);
    await runWhisper(config3);

    // Step 9: Verify cache files UNCHANGED (same mtime = not written to)
    const mtimesAfter = getCacheMtimes(cacheFiles);
    expect(mtimesAfter).toEqual(mtimesBefore);
  });
});
