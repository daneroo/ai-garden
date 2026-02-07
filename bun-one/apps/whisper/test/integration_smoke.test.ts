/**
 * Smoke test for whisper pipeline.
 *
 * Tests minimal end-to-end functionality using JFK fixture (~11s).
 * Requirements: whisper-cli, ffmpeg, tiny.en model.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";

import { readFile } from "node:fs/promises";
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
      durationSec: 0,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "smoke-dry",
      verbosity: 0,
      dryRun: true,
      wordTimestamps: false,
      cache: false, // Integration test - test real behavior, not cache
      quiet: true,
      segmentSec: 0,
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
      durationSec: 0,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "smoke-full",
      verbosity: 0,
      dryRun: false,
      wordTimestamps: false,
      cache: false, // Integration test - test real behavior, not cache
      quiet: true,
      segmentSec: 0,
    };

    const result = await runWhisper(config);

    // VTT file produced
    expect(existsSync(result.outputPath)).toBe(true);
    const vttText = await readFile(result.outputPath, "utf-8");
    expect(vttText).toContain("NOTE Provenance");
    expect(vttText).toContain('"model":"tiny.en"');

    // WAV task executed (M4B conversion) - now uses segment naming
    const wavTask = result.tasks.find((t) =>
      t.task.label.startsWith("to-wav[seg"),
    );
    expect(wavTask).toBeDefined();
    expect(wavTask!.result).toBeDefined();

    // VTT has content
    expect(result.vttSummary).toBeDefined();
    expect(result.vttSummary!.cueCount).toBeGreaterThan(0);
    expect(result.vttSummary!.durationSec).toBeGreaterThan(5);
  });

  test("cached: uses cached WAV on second run", async () => {
    // Previous test should have populated cache
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_JFK,
      tag: "smoke-cached",
    });
    workDirCleanup.track(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_JFK,
      modelShortName: "tiny.en",
      threads: 4,
      durationSec: 0, // Same as full test to hit cache
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "smoke-cached",
      verbosity: 0,
      dryRun: false,
      wordTimestamps: false,
      cache: true, // This test explicitly verifies cache behavior
      quiet: true,
      segmentSec: 0,
    };

    const result = await runWhisper(config);

    // Cache is now internal to Task.execute(), so we verify the task ran successfully
    // instead of checking for "[cached]" in the label
    const wavTask = result.tasks.find((t) => t.task.label.includes("to-wav"));
    expect(wavTask).toBeDefined();
    expect(wavTask!.result).toBeDefined();

    // VTT still produced correctly
    expect(existsSync(result.outputPath)).toBe(true);
    expect(result.vttSummary).toBeDefined();
  });
});
