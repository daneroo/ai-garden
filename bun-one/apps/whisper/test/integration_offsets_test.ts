/**
 * Integration test for offset/duration timestamp behavior.
 *
 * Validates that startSec in RunConfig produces absolute timestamps
 * (relative to original audio file, not relative to the offset).
 *
 * Uses roadnottaken.m4b (~76 seconds) as test fixture.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  createRunWorkDir,
  type RunConfig,
  runWhisper,
} from "../lib/runners.ts";
import { vttTimeToSeconds } from "../lib/vtt.ts";
import {
  cleanupOutputDir,
  createWorkDirCleanup,
  FIXTURE_ROADNOTTAKEN,
  PACKAGE_ROOT,
  resetOutputDir,
  TEST_WORK_DIR_ROOT,
} from "./helpers.ts";

const TEST_OUTPUT_DIR = join(PACKAGE_ROOT, "data/output/offsets-test");

const workDirCleanup = createWorkDirCleanup();

describe("offsets: absolute timestamp behavior", () => {
  beforeAll(async () => {
    await resetOutputDir(TEST_OUTPUT_DIR);
  });

  afterAll(async () => {
    await cleanupOutputDir(TEST_OUTPUT_DIR);
    await workDirCleanup.run();
  });

  test("baseline: no offset produces timestamps near zero", async () => {
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_ROADNOTTAKEN,
      tag: "offset-baseline",
    });
    workDirCleanup.track(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_ROADNOTTAKEN,
      modelShortName: "tiny.en",
      threads: 4,
      startSec: 0,
      durationSec: 20,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "offset-baseline",
      verbosity: 0,
      dryRun: false,
      wordTimestamps: false,
      quiet: true,
    };

    const result = await runWhisper(config);

    expect(result.vttSummary).toBeDefined();
    const firstCueStartSec = vttTimeToSeconds(result.vttSummary!.firstCueStart);

    // First cue should start near zero (within 5 seconds)
    expect(firstCueStartSec).toBeLessThan(5);
  });

  test("offset: --start produces absolute timestamps", async () => {
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_ROADNOTTAKEN,
      tag: "offset-absolute",
    });
    workDirCleanup.track(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_ROADNOTTAKEN,
      modelShortName: "tiny.en",
      threads: 4,
      startSec: 30,
      durationSec: 20,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "offset-absolute",
      verbosity: 0,
      dryRun: false,
      wordTimestamps: false,
      quiet: true,
    };

    const result = await runWhisper(config);

    expect(result.vttSummary).toBeDefined();
    const firstCueStartSec = vttTimeToSeconds(result.vttSummary!.firstCueStart);

    // KEY TEST: With startSec=30, timestamps should be absolute (>= 28s),
    // NOT relative to segment start (which would be near 0)
    expect(firstCueStartSec).toBeGreaterThanOrEqual(28);
  });

  test("duration: limits VTT output range", async () => {
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_ROADNOTTAKEN,
      tag: "offset-duration",
    });
    workDirCleanup.track(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_ROADNOTTAKEN,
      modelShortName: "tiny.en",
      threads: 4,
      startSec: 0,
      durationSec: 20,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "offset-duration",
      verbosity: 0,
      dryRun: false,
      wordTimestamps: false,
      quiet: true,
    };

    const result = await runWhisper(config);

    expect(result.vttSummary).toBeDefined();
    const lastCueEndSec = vttTimeToSeconds(result.vttSummary!.lastCueEnd);

    // Last cue should end within reasonable range of duration (< 30s)
    expect(lastCueEndSec).toBeLessThan(30);
  });

  test("offset+duration: combined behavior", async () => {
    const runWorkDir = createRunWorkDir({
      workDirRoot: TEST_WORK_DIR_ROOT,
      inputPath: FIXTURE_ROADNOTTAKEN,
      tag: "offset-combined",
    });
    workDirCleanup.track(runWorkDir);

    const config: RunConfig = {
      input: FIXTURE_ROADNOTTAKEN,
      modelShortName: "tiny.en",
      threads: 4,
      startSec: 30,
      durationSec: 20,
      outputDir: TEST_OUTPUT_DIR,
      runWorkDir,
      tag: "offset-combined",
      verbosity: 0,
      dryRun: false,
      wordTimestamps: false,
      quiet: true,
    };

    const result = await runWhisper(config);

    expect(result.vttSummary).toBeDefined();
    const firstCueStartSec = vttTimeToSeconds(result.vttSummary!.firstCueStart);
    const lastCueEndSec = vttTimeToSeconds(result.vttSummary!.lastCueEnd);

    // First cue should have absolute timestamp (>= 28s)
    expect(firstCueStartSec).toBeGreaterThanOrEqual(28);

    // Last cue should end before start + duration + buffer (< 60s)
    expect(lastCueEndSec).toBeLessThan(60);
  });
});
