/**
 * E2E test for whisper pipeline using longer audio sample.
 *
 * Tests demo.sh scenarios with hobbit-30m.m4b (~30 minutes).
 * Requirements: whisper-cli, ffmpeg, tiny.en model.
 *
 * Run with: RUN_E2E_TESTS=1 bun test
 * Or from root: bun run test:e2e
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
  PACKAGE_ROOT,
  resetOutputDir,
  TEST_WORK_DIR_ROOT,
} from "./helpers.ts";

const TEST_OUTPUT_DIR = join(PACKAGE_ROOT, "data/output/e2e-basic-test");
const FIXTURE_HOBBIT = join(PACKAGE_ROOT, "data/samples/hobbit-30m.m4b");
const E2E_TIMEOUT_PER_TEST__MS = 2 * 60 * 1000;

const workDirCleanup = createWorkDirCleanup();

describe.skipIf(!process.env.RUN_E2E_TESTS)("e2e: demo scenarios", () => {
  beforeAll(async () => {
    await resetOutputDir(TEST_OUTPUT_DIR);
  });

  afterAll(async () => {
    await cleanupOutputDir(TEST_OUTPUT_DIR);
    await workDirCleanup.run();
  });

  test(
    "full: hobbit-30m transcription produces VTT",
    async () => {
      const runWorkDir = createRunWorkDir({
        workDirRoot: TEST_WORK_DIR_ROOT,
        inputPath: FIXTURE_HOBBIT,
        tag: "e2e-full",
      });
      workDirCleanup.track(runWorkDir);

      const config: RunConfig = {
        input: FIXTURE_HOBBIT,
        modelShortName: "tiny.en",
        threads: 4,
        durationSec: 0,
        outputDir: TEST_OUTPUT_DIR,
        runWorkDir,
        tag: "e2e-full",
        verbosity: 0,
        dryRun: false,
        wordTimestamps: false,
        cache: true,
        quiet: true,
        segmentSec: 0, // No segmentation
      };

      const result = await runWhisper(config);

      // VTT file produced
      expect(existsSync(result.outputPath)).toBe(true);
      const vttText = await readFile(result.outputPath, "utf-8");
      expect(vttText).toContain("NOTE Provenance");
      expect(vttText).toContain('"model":"tiny.en"');

      // WAV task executed
      const wavTask = result.tasks.find((t) =>
        t.label.startsWith("to-wav[seg"),
      );
      expect(wavTask).toBeDefined();
      expect(wavTask!.elapsedMs).toBeDefined();

      // VTT has content
      expect(result.vttSummary).toBeDefined();
      expect(result.vttSummary!.cueCount).toBeGreaterThan(0);
      expect(result.vttSummary!.durationSec).toBeGreaterThan(60); // At least 1 minute
    },
    E2E_TIMEOUT_PER_TEST__MS,
  );

  test(
    "segmented: hobbit-30m with 10m segments produces stitched VTT",
    async () => {
      const runWorkDir = createRunWorkDir({
        workDirRoot: TEST_WORK_DIR_ROOT,
        inputPath: FIXTURE_HOBBIT,
        tag: "e2e-seg-10m",
      });
      workDirCleanup.track(runWorkDir);

      const config: RunConfig = {
        input: FIXTURE_HOBBIT,
        modelShortName: "tiny.en",
        threads: 4,
        durationSec: 0,
        outputDir: TEST_OUTPUT_DIR,
        runWorkDir,
        tag: "e2e-seg-10m",
        verbosity: 0,
        dryRun: false,
        wordTimestamps: false,
        cache: true,
        quiet: true,
        segmentSec: 600, // 10 minutes (10m)
      };

      const result = await runWhisper(config);

      // VTT file produced (stitched from multiple segments)
      expect(existsSync(result.outputPath)).toBe(true);
      const vttText = await readFile(result.outputPath, "utf-8");
      expect(vttText).toContain("NOTE Provenance");
      expect(vttText).toContain('"model":"tiny.en"');

      // Multiple WAV tasks executed (30m audio / 10m segments = 3 segments)
      const wavTasks = result.tasks.filter((t) =>
        t.label.startsWith("to-wav[seg"),
      );
      expect(wavTasks.length).toBeGreaterThanOrEqual(3);

      // Multiple transcribe tasks
      const transcribeTasks = result.tasks.filter((t) =>
        t.label.startsWith("transcribe[seg"),
      );
      expect(transcribeTasks.length).toBeGreaterThanOrEqual(3);

      // VTT has content
      expect(result.vttSummary).toBeDefined();
      expect(result.vttSummary!.cueCount).toBeGreaterThan(0);
      expect(result.vttSummary!.durationSec).toBeGreaterThan(60); // At least 1 minute
    },
    E2E_TIMEOUT_PER_TEST__MS,
  );
});
