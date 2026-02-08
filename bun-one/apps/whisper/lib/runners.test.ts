import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createUniqueRunWorkDir,
  createRunWorkDir,
  type RunConfig,
  type RunDeps,
  runWhisper,
} from "./runners.ts";

const mockConfig: RunConfig = {
  input: "test.mp3",
  modelShortName: "tiny.en",
  threads: 4,
  durationSec: 0,
  outputDir: "data/output",
  runWorkDir: "data/work/test-2025-01-01T00-00-00Z",
  verbosity: 1,
  dryRun: true, // Always dry-run for unit tests
  wordTimestamps: false,
  cache: true,
  segmentSec: 0,
  quiet: true,
};

const mockDeps: RunDeps = {
  getAudioDuration: () => Promise.resolve(100),
};

test("createRunWorkDir - includes second precision timestamp", () => {
  const runWorkDir = createRunWorkDir({
    workDirRoot: "data/work",
    inputPath: "/tmp/hobbit-30m.m4b",
    tag: "bench",
  });

  expect(runWorkDir).toMatch(
    /^data\/work\/hobbit-30m\.bench-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/,
  );
});

describe("runWhisper task generation", () => {
  test("retries when runWorkDir already exists", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "whisper-runner-test-"));

    try {
      const runWorkDir = createRunWorkDir({
        workDirRoot: tempRoot,
        inputPath: "/tmp/hobbit-30m.m4b",
        tag: "bench",
      });
      await mkdir(runWorkDir);

      const retryRunWorkDir = await createUniqueRunWorkDir(runWorkDir);
      expect(retryRunWorkDir).not.toBe(runWorkDir);
      expect(existsSync(retryRunWorkDir)).toBe(true);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  test("reports processedAudioDurationSec as full audio duration", async () => {
    const result = await runWhisper(mockConfig, mockDeps);
    expect(result.processedAudioDurationSec).toBe(100);
  });

  test("reports processedAudioDurationSec for partial duration", async () => {
    const config = { ...mockConfig, durationSec: 50 };
    const result = await runWhisper(config, mockDeps);
    expect(result.processedAudioDurationSec).toBe(50);
  });

  test("single segment produces correct tasks", async () => {
    const result = await runWhisper(mockConfig, mockDeps);

    // 1 segment × (wav + transcribe) = 2 tasks
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 1]");
    expect(result.tasks[1]?.label).toBe("transcribe[seg:1 of 1]");
  });

  test("multiple segments produces correct task count", async () => {
    const config = { ...mockConfig, segmentSec: 40 };
    const result = await runWhisper(config, mockDeps);

    // 3 segments × (wav + transcribe) = 6 tasks
    expect(result.tasks).toHaveLength(6);
    expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 3]");
    expect(result.tasks[1]?.label).toBe("to-wav[seg:2 of 3]");
    expect(result.tasks[2]?.label).toBe("to-wav[seg:3 of 3]");
    expect(result.tasks[3]?.label).toBe("transcribe[seg:1 of 3]");
    expect(result.tasks[4]?.label).toBe("transcribe[seg:2 of 3]");
    expect(result.tasks[5]?.label).toBe("transcribe[seg:3 of 3]");
  });

  test("duration filters to correct segment count", async () => {
    // Audio: 100s, segments: 40s each, duration: 50s -> ceil(50/40) = 2 segments
    const config = { ...mockConfig, segmentSec: 40, durationSec: 50 };
    const result = await runWhisper(config, mockDeps);

    // 2 wav + 2 transcribe = 4 tasks (only segments needed for transcription)
    const wavTasks = result.tasks.filter((t) => t.label.startsWith("to-wav"));
    expect(wavTasks).toHaveLength(2);

    const transcribeTasks = result.tasks.filter((t) =>
      t.label.startsWith("transcribe"),
    );
    expect(transcribeTasks).toHaveLength(2);
    expect(transcribeTasks[0]?.label).toBe("transcribe[seg:1 of 2]");
    expect(transcribeTasks[1]?.label).toBe("transcribe[seg:2 of 2]");
  });

  test("duration in first segment produces single segment", async () => {
    // Audio: 100s, segments: 40s each, duration: 20s -> ceil(20/40) = 1 segment
    const config = { ...mockConfig, segmentSec: 40, durationSec: 20 };
    const result = await runWhisper(config, mockDeps);

    // 1 wav + 1 transcribe = 2 tasks
    const wavTasks = result.tasks.filter((t) => t.label.startsWith("to-wav"));
    expect(wavTasks).toHaveLength(1);

    const transcribeTasks = result.tasks.filter((t) =>
      t.label.startsWith("transcribe"),
    );
    expect(transcribeTasks).toHaveLength(1);
    expect(transcribeTasks[0]?.label).toBe("transcribe[seg:1 of 1]");
  });

  test("duration beyond audio keeps full-run segmentation", async () => {
    const config = { ...mockConfig, segmentSec: 40, durationSec: 150 };
    const result = await runWhisper(config, mockDeps);

    expect(result.processedAudioDurationSec).toBe(100);

    const wavTasks = result.tasks.filter((t) => t.label.startsWith("to-wav"));
    expect(wavTasks).toHaveLength(3);

    const transcribeTasks = result.tasks.filter((t) =>
      t.label.startsWith("transcribe"),
    );
    expect(transcribeTasks).toHaveLength(3);
    expect(transcribeTasks[0]?.label).toBe("transcribe[seg:1 of 3]");
    expect(transcribeTasks[2]?.label).toBe("transcribe[seg:3 of 3]");
  });
});
