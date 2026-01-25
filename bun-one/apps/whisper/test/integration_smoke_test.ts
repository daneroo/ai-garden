/**
 * Smoke test for whisper pipeline.
 *
 * Tests minimal end-to-end functionality using JFK fixture (~11s).
 * Requirements: whisper-cli, ffmpeg, tiny.en model.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
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

const TEST_OUTPUT_DIR = join(PACKAGE_ROOT, "data/output/smoke-test");

const workDirCleanup = createWorkDirCleanup();

describe("smoke: whisper pipeline", () => {
  beforeAll(async () => {
    await resetOutputDir(TEST_OUTPUT_DIR);
  });

  afterAll(async () => {
    await cleanupOutputDir(TEST_OUTPUT_DIR);
    await workDirCleanup.run();
  });

  test("dry-run: no files produced, tasks populated", async () => {
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_JFK,
      tag: "smoke-dry",
    });
    workDirCleanup.track(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_JFK,
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
      quiet: true,
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
      inputPath: FIXTURE_JFK,
      tag: "smoke-full",
    });
    workDirCleanup.track(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_JFK,
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
      quiet: true,
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
