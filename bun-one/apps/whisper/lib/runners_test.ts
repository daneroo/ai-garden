import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  computeSegmentCount,
  createRunWorkDir,
  getDurationMsForSegment,
  getEndSegmentIndex,
  getOffsetMsForSegment,
  getProcessedAudioDuration,
  getSegmentSuffix,
  getStartSegmentIndex,
  MIN_SEGMENT_REMAINDER_SEC,
  type RunConfig,
  type RunDeps,
  runWhisper,
} from "./runners.ts";

const mockConfig: RunConfig = {
  input: "test.mp3",
  modelShortName: "tiny.en",
  threads: 4,
  startSec: 0,
  durationSec: 0,
  outputDir: "data/output",
  runWorkDir: "data/work/test-2025-01-01T00-00-00Z",
  verbosity: 1,
  dryRun: true, // Always dry-run for unit tests
  wordTimestamps: false,
  segmentSec: 0,
  overlapSec: 0,
  quiet: true,
};

const mockDeps: RunDeps = {
  getAudioDuration: () => Promise.resolve(100),
};

test("getProcessedAudioDuration - explicit duration", async () => {
  const config = { ...mockConfig, durationSec: 10 };
  const getDuration = () => Promise.resolve(100); // Should be ignored (capped)

  // Explicitly requested 10s, file is 100s -> 10s
  expect(await getProcessedAudioDuration(config, getDuration)).toBe(10);

  // Explicitly requested 10s, file is 5s -> 5s (capped)
  const configSmallFile = { ...mockConfig, durationSec: 10 };
  const getDurationSmall = () => Promise.resolve(5);
  expect(
    await getProcessedAudioDuration(configSmallFile, getDurationSmall),
  ).toBe(5);
});

test("getProcessedAudioDuration - implicit duration (full file)", async () => {
  const config = { ...mockConfig, durationSec: 0, startSec: 0 };
  const getDuration = () => Promise.resolve(60); // 60s file

  // 0 duration means until end of file -> 60s
  expect(await getProcessedAudioDuration(config, getDuration)).toBe(60);
});

test("getProcessedAudioDuration - implicit duration (start offset)", async () => {
  const config = { ...mockConfig, durationSec: 0, startSec: 10 };
  const getDuration = () => Promise.resolve(60); // 60s file

  // Effective duration = 60 - 10 = 50s
  expect(await getProcessedAudioDuration(config, getDuration)).toBe(50);
});

test("getProcessedAudioDuration - edge cases", async () => {
  const getDuration = () => Promise.resolve(60);

  // Start offset beyond file duration
  const invalidConfig = { ...mockConfig, startSec: 70 };
  expect(await getProcessedAudioDuration(invalidConfig, getDuration)).toBe(0);

  // Explicit duration 0 is treated as until end of file
  const configZeroDur = { ...mockConfig, durationSec: 0 };
  expect(await getProcessedAudioDuration(configZeroDur, getDuration)).toBe(60);
});

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

describe("getSegmentSuffix", () => {
  test("formats correctly", () => {
    expect(getSegmentSuffix(0, 3600, 0)).toBe("-seg00-d1h-ov0s");
    expect(getSegmentSuffix(5, 3600, 60)).toBe("-seg05-d1h-ov1m");
    expect(getSegmentSuffix(12, 7200, 300)).toBe("-seg12-d2h-ov5m");
  });

  test("supports explicit duration label override", () => {
    expect(getSegmentSuffix(0, 1800.019, 0, { durationLabel: "full" })).toBe(
      "-seg00-dfull-ov0s",
    );
  });
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

  test("reports processedAudioDurationSec for requested window", async () => {
    const config = { ...mockConfig, startSec: 10, durationSec: 20 };
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(100),
    };

    const result = await runWhisper(config, deps);
    expect(result.processedAudioDurationSec).toBe(20);
  });

  test("single segment produces correct tasks", async () => {
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(100),
    };
    const result = await runWhisper(mockConfig, deps);

    // 1 segment × (wav + transcribe) = 2 tasks (cache is internal to execute)
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]?.task.label).toBe("to-wav[seg:1 of 1]");
    expect(result.tasks[1]?.task.label).toBe("transcribe[seg:1 of 1]");
  });

  test("multiple segments produces correct task count", async () => {
    const config = { ...mockConfig, segmentSec: 40 };
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(100),
    };
    const result = await runWhisper(config, deps);

    // 3 segments × (wav + transcribe) = 6 tasks
    expect(result.tasks).toHaveLength(6);
    expect(result.tasks[0]?.task.label).toBe("to-wav[seg:1 of 3]");
    expect(result.tasks[1]?.task.label).toBe("to-wav[seg:2 of 3]");
    expect(result.tasks[2]?.task.label).toBe("to-wav[seg:3 of 3]");
    expect(result.tasks[3]?.task.label).toBe("transcribe[seg:1 of 3]");
    expect(result.tasks[4]?.task.label).toBe("transcribe[seg:2 of 3]");
    expect(result.tasks[5]?.task.label).toBe("transcribe[seg:3 of 3]");
  });

  // NOTE: Tests that previously checked --offset-t, --duration args have been
  // removed because Task now encapsulates execution details. The args are
  // internal to Task.execute() and not exposed for unit testing.
  // Integration tests (demo.sh, integration_smoke_test.ts) verify end-to-end behavior.

  test("--start filters to correct segments", async () => {
    const config = { ...mockConfig, startSec: 50, segmentSec: 40 };
    const result = await runWhisper(config, mockDeps);

    // With start=50, segment 1 (0-40) should be filtered out
    // Segments 2 and 3 should remain
    const transcribeTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("transcribe["),
    );
    expect(transcribeTasks).toHaveLength(2);
    expect(transcribeTasks[0]?.task.label).toBe("transcribe[seg:2 of 3]");
    expect(transcribeTasks[1]?.task.label).toBe("transcribe[seg:3 of 3]");
  });

  test("--duration filters to correct segments", async () => {
    const config = { ...mockConfig, segmentSec: 40, durationSec: 50 };
    const result = await runWhisper(config, mockDeps);

    // duration=50 ends in segment 2, so segment 3 should be filtered out
    const transcribeTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("transcribe["),
    );
    expect(transcribeTasks).toHaveLength(2);
    expect(transcribeTasks[0]?.task.label).toBe("transcribe[seg:1 of 3]");
    expect(transcribeTasks[1]?.task.label).toBe("transcribe[seg:2 of 3]");
  });

  test("--start and --duration together filter correctly", async () => {
    const config = {
      ...mockConfig,
      segmentSec: 40,
      startSec: 10,
      durationSec: 20,
    };
    const result = await runWhisper(config, mockDeps);

    // Window [10, 30) is entirely within segment 1, so only 1 transcribe task
    const transcribeTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("transcribe["),
    );
    expect(transcribeTasks).toHaveLength(1);
    expect(transcribeTasks[0]?.task.label).toBe("transcribe[seg:1 of 3]");
  });

  // NOTE: Cache tests removed - caching is now internal to Task.execute()
  // Cache behavior is verified via integration tests.
});

describe("runWhisper segment boundaries", () => {
  // NOTE: Tests that previously extracted args from TaskConfig have been removed
  // because Task now encapsulates execution details. These tests verified WAV
  // segment boundaries (-ss, -t) and whisper timing (--offset-t, --duration)
  // which are now internal to Task.execute().
  //
  // Integration tests verify end-to-end behavior.

  async function getTaskLabels({
    segmentSec,
    overlapSec,
    audioDuration,
    startSec = 0,
    durationSec = 0,
  }: {
    segmentSec: number;
    overlapSec: number;
    audioDuration: number;
    startSec?: number;
    durationSec?: number;
  }): Promise<{
    wav: string[];
    transcribe: string[];
  }> {
    const config = {
      ...mockConfig,
      segmentSec,
      overlapSec,
      startSec,
      durationSec,
    };
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(audioDuration),
    };

    const result = await runWhisper(config, deps);
    const wavTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("to-wav["),
    );
    const transcribeTasks = result.tasks.filter((t) =>
      t.task.label.startsWith("transcribe["),
    );

    return {
      wav: wavTasks.map((t) => t.task.label),
      transcribe: transcribeTasks.map((t) => t.task.label),
    };
  }

  describe("wav boundaries", () => {
    test("single segment produces correct labels", async () => {
      const labels = await getTaskLabels({
        segmentSec: 0,
        overlapSec: 0,
        audioDuration: 100,
      });

      expect(labels.wav).toEqual(["to-wav[seg:1 of 1]"]);
      expect(labels.transcribe).toEqual(["transcribe[seg:1 of 1]"]);
    });

    test("multiple segments produce correct labels", async () => {
      const labels = await getTaskLabels({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
      });

      expect(labels.wav).toEqual([
        "to-wav[seg:1 of 4]",
        "to-wav[seg:2 of 4]",
        "to-wav[seg:3 of 4]",
        "to-wav[seg:4 of 4]",
      ]);
      expect(labels.transcribe).toEqual([
        "transcribe[seg:1 of 4]",
        "transcribe[seg:2 of 4]",
        "transcribe[seg:3 of 4]",
        "transcribe[seg:4 of 4]",
      ]);
    });
  });

  describe("without overlap", () => {
    test("start filters to correct segments", async () => {
      const labels = await getTaskLabels({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
        startSec: 40,
      });

      // All WAV segments created (for full audio conversion)
      expect(labels.wav).toHaveLength(4);
      // Only segments 2-4 transcribed (start=40 > seg1 end=30)
      expect(labels.transcribe).toEqual([
        "transcribe[seg:2 of 4]",
        "transcribe[seg:3 of 4]",
        "transcribe[seg:4 of 4]",
      ]);
    });

    test("duration filters to correct segments", async () => {
      const labels = await getTaskLabels({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
        durationSec: 50,
      });

      // All WAV segments created
      expect(labels.wav).toHaveLength(4);
      // Only segments 1-2 transcribed (duration=50 ends in seg2)
      expect(labels.transcribe).toEqual([
        "transcribe[seg:1 of 4]",
        "transcribe[seg:2 of 4]",
      ]);
    });

    test("start and duration together span middle segments", async () => {
      const labels = await getTaskLabels({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
        startSec: 40,
        durationSec: 40,
      });

      expect(labels.wav).toHaveLength(4);
      // Window [40, 80) spans segments 2-3
      expect(labels.transcribe).toEqual([
        "transcribe[seg:2 of 4]",
        "transcribe[seg:3 of 4]",
      ]);
    });
  });

  describe("overlap stitching guard (until smart stitching is implemented)", () => {
    test("overlap fails fast until smart stitching is implemented", async () => {
      const config = {
        ...mockConfig,
        dryRun: false,
        segmentSec: 30,
        overlapSec: 5,
      };
      await expect(runWhisper(config, mockDeps)).rejects.toThrow(
        "overlapping stitching : not yet implemented!",
      );
    });

    test("start and duration with overlap fail fast", async () => {
      const config = {
        ...mockConfig,
        dryRun: false,
        segmentSec: 30,
        overlapSec: 5,
        startSec: 40,
        durationSec: 40,
      };
      await expect(runWhisper(config, mockDeps)).rejects.toThrow(
        "overlapping stitching : not yet implemented!",
      );
    });
  });
});

// =============================================================================
// SEGMENT BOUNDARY COMPUTATION TESTS
// =============================================================================
// These tests verify the segment boundary calculation logic directly.
// Previously this was tested by inspecting Task args, but now we test the
// computation functions themselves.

describe("computeSegmentCount", () => {
  test("single segment when segmentSec is 0 or >= audioDuration", () => {
    expect(computeSegmentCount(100, 0)).toBe(1);
    expect(computeSegmentCount(100, 100)).toBe(1);
    expect(computeSegmentCount(100, 200)).toBe(1);
  });

  test("multiple segments with exact division", () => {
    expect(computeSegmentCount(120, 30)).toBe(4);
    expect(computeSegmentCount(60, 30)).toBe(2);
  });

  test("multiple segments with remainder", () => {
    expect(computeSegmentCount(100, 30)).toBe(4); // 30+30+30+10
  });

  test(`drops tiny tail segments below MIN_SEGMENT_REMAINDER_SEC (${MIN_SEGMENT_REMAINDER_SEC}s)`, () => {
    const threshold = MIN_SEGMENT_REMAINDER_SEC;
    // 90 + (threshold - 1) = remainder just below threshold -> absorbed
    expect(computeSegmentCount(90 + threshold - 1, 30)).toBe(3);

    // 90 + threshold = remainder at threshold -> becomes segment
    expect(computeSegmentCount(90 + threshold, 30)).toBe(4);

    // Edge: tiny file should still get 1 segment even if below threshold
    expect(computeSegmentCount(1, 30)).toBe(1);
  });

  test("edge case: zero duration", () => {
    expect(computeSegmentCount(0, 30)).toBe(0);
  });
});

describe("getStartSegmentIndex", () => {
  test("returns 0 for start <= 0", () => {
    expect(getStartSegmentIndex(0, 30, 4)).toBe(0);
    expect(getStartSegmentIndex(-10, 30, 4)).toBe(0);
  });

  test("returns 0 for single segment", () => {
    expect(getStartSegmentIndex(50, 30, 1)).toBe(0);
  });

  test("returns correct segment for multi-segment", () => {
    // Segments: [0-30), [30-60), [60-90), [90-100)
    expect(getStartSegmentIndex(10, 30, 4)).toBe(0); // within seg 0
    expect(getStartSegmentIndex(40, 30, 4)).toBe(1); // within seg 1
    expect(getStartSegmentIndex(65, 30, 4)).toBe(2); // within seg 2
    expect(getStartSegmentIndex(95, 30, 4)).toBe(3); // within seg 3
  });

  test("clamps to last segment", () => {
    expect(getStartSegmentIndex(200, 30, 4)).toBe(3);
  });
});

describe("getEndSegmentIndex", () => {
  test("returns 0 for single segment", () => {
    expect(getEndSegmentIndex(50, 100, 30, 0, 1)).toBe(0);
  });

  test("returns last segment for end >= audioDuration", () => {
    expect(getEndSegmentIndex(100, 100, 30, 0, 4)).toBe(3);
    expect(getEndSegmentIndex(150, 100, 30, 0, 4)).toBe(3);
  });

  test("returns correct segment for multi-segment", () => {
    // Segments (no overlap): [0-30), [30-60), [60-90), [90-100)
    expect(getEndSegmentIndex(25, 100, 30, 0, 4)).toBe(0);
    expect(getEndSegmentIndex(50, 100, 30, 0, 4)).toBe(1);
    expect(getEndSegmentIndex(80, 100, 30, 0, 4)).toBe(2);
  });
});

describe("getOffsetMsForSegment", () => {
  const baseConfig: RunConfig = {
    ...mockConfig,
    segmentSec: 30,
    overlapSec: 0,
  };

  test("returns 0 when startSec <= 0", () => {
    const config = { ...baseConfig, startSec: 0 };
    expect(getOffsetMsForSegment(0, config, 30, 4)).toBe(0);
    expect(getOffsetMsForSegment(1, config, 30, 4)).toBe(0);
  });

  test("returns offset only for containing segment", () => {
    // start=50 is in segment 1 (30-60), offset = 50-30 = 20s = 20000ms
    const config = { ...baseConfig, startSec: 50 };
    expect(getOffsetMsForSegment(0, config, 30, 4)).toBe(0);
    expect(getOffsetMsForSegment(1, config, 30, 4)).toBe(20000);
    expect(getOffsetMsForSegment(2, config, 30, 4)).toBe(0);
  });

  test("returns correct offset for start in first segment", () => {
    const config = { ...baseConfig, startSec: 10 };
    expect(getOffsetMsForSegment(0, config, 30, 4)).toBe(10000);
    expect(getOffsetMsForSegment(1, config, 30, 4)).toBe(0);
  });
});

describe("getDurationMsForSegment", () => {
  const baseConfig: RunConfig = {
    ...mockConfig,
    segmentSec: 30,
    overlapSec: 0,
  };

  test("returns 0 when durationSec <= 0", () => {
    const config = { ...baseConfig, startSec: 0, durationSec: 0 };
    expect(getDurationMsForSegment(0, config, 100, 30, 4)).toBe(0);
    expect(getDurationMsForSegment(1, config, 100, 30, 4)).toBe(0);
  });

  test("returns 0 when duration extends to end of file", () => {
    const config = { ...baseConfig, startSec: 0, durationSec: 150 };
    expect(getDurationMsForSegment(0, config, 100, 30, 4)).toBe(0);
    expect(getDurationMsForSegment(3, config, 100, 30, 4)).toBe(0);
  });

  test("returns duration only for end segment", () => {
    // duration=50 ends in segment 1 (30-60), local duration = 50-30 = 20s = 20000ms
    const config = { ...baseConfig, startSec: 0, durationSec: 50 };
    expect(getDurationMsForSegment(0, config, 100, 30, 4)).toBe(0);
    expect(getDurationMsForSegment(1, config, 100, 30, 4)).toBe(20000);
    expect(getDurationMsForSegment(2, config, 100, 30, 4)).toBe(0);
  });

  test("returns full duration when start and end in same segment", () => {
    // start=10, duration=15 -> both in segment 0
    const config = { ...baseConfig, startSec: 10, durationSec: 15 };
    expect(getDurationMsForSegment(0, config, 100, 30, 4)).toBe(15000);
    expect(getDurationMsForSegment(1, config, 100, 30, 4)).toBe(0);
  });
});
