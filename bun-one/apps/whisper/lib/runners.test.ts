import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
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
  test("fails when runWorkDir already exists", async () => {
    const tempRoot = await mkdtemp(join(tmpdir(), "whisper-runner-test-"));
    const runWorkDir = join(tempRoot, "existing-run");

    try {
      await mkdir(runWorkDir);
      const config = { ...mockConfig, dryRun: false, runWorkDir };
      await expect(runWhisper(config, mockDeps)).rejects.toThrow(
        "workdirAlready exists (too soon?)",
      );
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });

  test("reports processedAudioDurationSec as full audio duration", async () => {
    const result = await runWhisper(mockConfig, mockDeps);
    expect(result.processedAudioDurationSec).toBe(100);
  });

  test("single segment produces correct tasks", async () => {
    const result = await runWhisper(mockConfig, mockDeps);

    // 1 segment × (wav + transcribe) = 2 tasks
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]?.task.label).toBe("to-wav[seg:1 of 1]");
    expect(result.tasks[1]?.task.label).toBe("transcribe[seg:1 of 1]");
  });

  test("multiple segments produces correct task count", async () => {
    const config = { ...mockConfig, segmentSec: 40 };
    const result = await runWhisper(config, mockDeps);

    // 3 segments × (wav + transcribe) = 6 tasks
    expect(result.tasks).toHaveLength(6);
    expect(result.tasks[0]?.task.label).toBe("to-wav[seg:1 of 3]");
    expect(result.tasks[1]?.task.label).toBe("to-wav[seg:2 of 3]");
    expect(result.tasks[2]?.task.label).toBe("to-wav[seg:3 of 3]");
    expect(result.tasks[3]?.task.label).toBe("transcribe[seg:1 of 3]");
    expect(result.tasks[4]?.task.label).toBe("transcribe[seg:2 of 3]");
    expect(result.tasks[5]?.task.label).toBe("transcribe[seg:3 of 3]");
  });

  test("duration filters transcribe tasks to correct segments", async () => {
    // Audio: 100s, segments: 40s each -> 3 segments [0-40, 40-80, 80-100]
    // Duration: 50s -> end in segment 2 (40-80)
    const config = { ...mockConfig, segmentSec: 40, durationSec: 50 };
    const result = await runWhisper(config, mockDeps);

    // All 3 WAV tasks created
    const wavTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("to-wav"),
    );
    expect(wavTasks).toHaveLength(3);

    // Only 2 transcribe tasks (segments 1-2, segment 3 skipped)
    const transcribeTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("transcribe"),
    );
    expect(transcribeTasks).toHaveLength(2);
    expect(transcribeTasks[0]?.task.label).toBe("transcribe[seg:1 of 3]");
    expect(transcribeTasks[1]?.task.label).toBe("transcribe[seg:2 of 3]");
  });

  test("duration in first segment produces single transcribe task", async () => {
    // Audio: 100s, segments: 40s each, duration: 20s (within segment 1)
    const config = { ...mockConfig, segmentSec: 40, durationSec: 20 };
    const result = await runWhisper(config, mockDeps);

    // All 3 WAV tasks
    const wavTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("to-wav"),
    );
    expect(wavTasks).toHaveLength(3);

    // Only 1 transcribe task (segment 1 only)
    const transcribeTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("transcribe"),
    );
    expect(transcribeTasks).toHaveLength(1);
    expect(transcribeTasks[0]?.task.label).toBe("transcribe[seg:1 of 3]");
  });
});
