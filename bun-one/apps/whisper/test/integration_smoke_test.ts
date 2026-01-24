/**
 * Smoke test for whisper pipeline.
 *
 * Tests minimal end-to-end functionality using JFK fixture (~11s).
 * Requirements: whisper-cli, ffmpeg, tiny.en model.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  createRunWorkDir,
  type RunConfig,
  runWhisper,
} from "../lib/runners.ts";

import { join } from "node:path";

const PACKAGE_ROOT = join(import.meta.dir, "..");
const FIXTURE_JFK_M4B = join(PACKAGE_ROOT, "test/fixtures/jfk.m4b");
const TEST_OUTPUT_DIR = join(PACKAGE_ROOT, "data/output/smoke-test");
const TEST_WORK_DIR_ROOT = join(PACKAGE_ROOT, "data/work");

// Track work directories to clean up
const workDirsToClean: string[] = [];

describe("smoke: whisper pipeline", () => {
  beforeAll(async () => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      await rm(TEST_OUTPUT_DIR, { recursive: true });
    }
    await mkdir(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterAll(async () => {
    if (existsSync(TEST_OUTPUT_DIR)) {
      await rm(TEST_OUTPUT_DIR, { recursive: true });
    }
    // Clean up work directories
    for (const dir of workDirsToClean) {
      if (existsSync(dir)) {
        await rm(dir, { recursive: true });
      }
    }
  });

  test("dry-run: no files produced, tasks populated", async () => {
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_JFK_M4B,
      tag: "smoke-dry",
    });
    workDirsToClean.push(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_JFK_M4B,
      modelShortName: "tiny.en",
      threads: 4,
      startSec: 0,
      durationSec: 0,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "smoke-dry",
      verbosity: 0,
      dryRun: true,
      wordTimestamps: false,
    };

    const result = await runWhisper(config);

    // Dry-run should populate tasks but not execute
    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.tasks.every((t) => t.result === undefined)).toBe(true);

    // No output files
    expect(existsSync(result.outputPath)).toBe(false);
  });

  test("full: M4B transcription produces VTT and WAV", async () => {
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_JFK_M4B,
      tag: "smoke-full",
    });
    workDirsToClean.push(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_JFK_M4B,
      modelShortName: "tiny.en",
      threads: 4,
      startSec: 0,
      durationSec: 0,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "smoke-full",
      verbosity: 0,
      dryRun: false,
      wordTimestamps: false,
    };

    const result = await runWhisper(config);

    // VTT file produced
    expect(existsSync(result.outputPath)).toBe(true);

    // WAV file produced (M4B conversion)
    const wavPath = `${runWorkDir}/jfk.wav`;
    expect(existsSync(wavPath)).toBe(true);

    // VTT has content
    expect(result.vttSummary).toBeDefined();
    expect(result.vttSummary!.cueCount).toBeGreaterThan(0);
    expect(result.vttSummary!.durationSec).toBeGreaterThan(5);
  });
});
