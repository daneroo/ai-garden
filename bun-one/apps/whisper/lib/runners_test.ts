import { describe, expect, test } from "bun:test";
import {
  calculateSegments,
  getProcessedAudioDuration,
  getSegmentSuffix,
  runWhisper,
  type RunConfig,
  type RunDeps,
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
  checkCache: () => false, // No cache hits
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

describe("calculateSegments", () => {
  test("single segment when duration <= segmentSec", () => {
    const segments = calculateSegments(100, 200, 0);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ index: 0, startSec: 0, durationSec: 100 });
  });

  test("multiple segments without overlap", () => {
    const segments = calculateSegments(100, 30, 0);
    expect(segments).toHaveLength(4);
    expect(segments[0]).toEqual({ index: 0, startSec: 0, durationSec: 30 });
    expect(segments[1]).toEqual({ index: 1, startSec: 30, durationSec: 30 });
    expect(segments[2]).toEqual({ index: 2, startSec: 60, durationSec: 30 });
    expect(segments[3]).toEqual({ index: 3, startSec: 90, durationSec: 10 }); // last segment shorter
  });

  test("multiple segments with overlap", () => {
    const segments = calculateSegments(100, 30, 5);
    expect(segments).toHaveLength(4);
    // Non-last segments have overlap added
    expect(segments[0]).toEqual({ index: 0, startSec: 0, durationSec: 35 });
    expect(segments[1]).toEqual({ index: 1, startSec: 30, durationSec: 35 });
    expect(segments[2]).toEqual({ index: 2, startSec: 60, durationSec: 35 });
    // Last segment has no overlap
    expect(segments[3]).toEqual({ index: 3, startSec: 90, durationSec: 10 });
  });

  test("overlap is capped by remaining audio", () => {
    const segments = calculateSegments(35, 30, 10);
    expect(segments).toHaveLength(2);
    // First segment: 30 + 10 = 40, but only 35 total, so 35
    expect(segments[0]).toEqual({ index: 0, startSec: 0, durationSec: 35 });
    // Second segment: starts at 30, only 5 remaining
    expect(segments[1]).toEqual({ index: 1, startSec: 30, durationSec: 5 });
  });

  test("throws on invalid input", () => {
    expect(() => calculateSegments(100, 0, 0)).toThrow(
      "segmentSec must be positive",
    );
    expect(() => calculateSegments(100, -1, 0)).toThrow(
      "segmentSec must be positive",
    );
    expect(() => calculateSegments(100, 30, -1)).toThrow(
      "overlapSec must be >= 0",
    );
    expect(() => calculateSegments(100, 30, 30)).toThrow(
      "overlapSec must be >= 0 and < segmentSec",
    );
    expect(() => calculateSegments(100, 30, 31)).toThrow(
      "overlapSec must be >= 0 and < segmentSec",
    );
  });
});

describe("getSegmentSuffix", () => {
  test("formats correctly", () => {
    expect(getSegmentSuffix(0, 3600, 0)).toBe("-seg00-d1h-ov0s");
    expect(getSegmentSuffix(5, 3600, 60)).toBe("-seg05-d1h-ov1m");
    expect(getSegmentSuffix(12, 7200, 300)).toBe("-seg12-d2h-ov5m");
  });
});

describe("runWhisper task generation", () => {
  test("single segment produces correct tasks", async () => {
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(100),
      checkCache: () => false,
    };
    const result = await runWhisper(mockConfig, deps);

    expect(result.tasks).toHaveLength(4); // wav, cache-wav, transcribe, cache-vtt
    expect(result.tasks[0]?.config.label).toBe("to-wav[seg:1 of 1]");
    expect(result.tasks[1]?.config.label).toBe("cache-wav[seg:1 of 1]");
    expect(result.tasks[2]?.config.label).toBe("transcribe[seg:1 of 1]");
    expect(result.tasks[3]?.config.label).toBe("cache-vtt[seg:1 of 1]");
  });

  test("multiple segments produces correct task count", async () => {
    const config = { ...mockConfig, segmentSec: 40 };
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(100),
      checkCache: () => false,
    };
    const result = await runWhisper(config, deps);

    // 3 segments × (wav + cache-wav + transcribe + cache-vtt) = 12 tasks
    expect(result.tasks).toHaveLength(12);
    expect(result.tasks[0]?.config.label).toBe("to-wav[seg:1 of 3]");
    expect(result.tasks[2]?.config.label).toBe("to-wav[seg:2 of 3]");
    expect(result.tasks[4]?.config.label).toBe("to-wav[seg:3 of 3]");
    expect(result.tasks[6]?.config.label).toBe("transcribe[seg:1 of 3]");
    expect(result.tasks[8]?.config.label).toBe("transcribe[seg:2 of 3]");
    expect(result.tasks[10]?.config.label).toBe("transcribe[seg:3 of 3]");
  });

  test("--start adds --offset-t in single-segment mode", async () => {
    const config = { ...mockConfig, startSec: 12, segmentSec: 0 };
    const result = await runWhisper(config, mockDeps);

    const transcribeTask = result.tasks.find((t) =>
      t.config.label.startsWith("transcribe["),
    );
    expect(transcribeTask?.config.args).toContain("--offset-t");
    expect(transcribeTask?.config.args).toContain("12000");
  });

  test("--start adds --offset-t only on containing segment", async () => {
    const config = { ...mockConfig, startSec: 50, segmentSec: 40 };
    const result = await runWhisper(config, mockDeps);

    // With start=50, segment 2 (index 1) contains start
    const seg1Task = result.tasks.find(
      (t) => t.config.label === "transcribe[seg:1 of 3]",
    );
    const seg2Task = result.tasks.find(
      (t) => t.config.label === "transcribe[seg:2 of 3]",
    );
    const seg3Task = result.tasks.find(
      (t) => t.config.label === "transcribe[seg:3 of 3]",
    );

    // Segment 1 should be filtered out (start=50 > seg1 end=40)
    expect(seg1Task).toBeUndefined();
    // Segment 2 should have --offset-t 10000 (50 - 40)
    expect(seg2Task?.config.args).toContain("--offset-t");
    expect(seg2Task?.config.args).toContain("10000");
    // Segment 3 should have no offset
    expect(seg3Task?.config.args).not.toContain("--offset-t");
  });

  test("--duration adds --duration in single-segment mode", async () => {
    const config = { ...mockConfig, durationSec: 5, segmentSec: 0 };
    const result = await runWhisper(config, mockDeps);

    const transcribeTask = result.tasks.find((t) =>
      t.config.label.startsWith("transcribe["),
    );
    expect(transcribeTask?.config.args).toContain("--duration");
    expect(transcribeTask?.config.args).toContain("5000");
  });

  test("--duration adds --duration only on end segment", async () => {
    const config = { ...mockConfig, segmentSec: 40, durationSec: 50 };
    const result = await runWhisper(config, mockDeps);

    // duration=50 ends in segment 2 (40-80)
    const seg1Task = result.tasks.find(
      (t) => t.config.label === "transcribe[seg:1 of 3]",
    );
    const seg2Task = result.tasks.find(
      (t) => t.config.label === "transcribe[seg:2 of 3]",
    );
    const seg3Task = result.tasks.find(
      (t) => t.config.label === "transcribe[seg:3 of 3]",
    );

    // Segment 1 should have no duration flag
    expect(seg1Task?.config.args).not.toContain("--duration");
    // Segment 2 should have --duration 10000 (50 - 40)
    expect(seg2Task?.config.args).toContain("--duration");
    expect(seg2Task?.config.args).toContain("10000");
    // Segment 3 should be filtered out (end=50 < seg3 start=80)
    expect(seg3Task).toBeUndefined();
  });

  test("--start and --duration together", async () => {
    const config = {
      ...mockConfig,
      segmentSec: 40,
      startSec: 10,
      durationSec: 20,
    };
    const result = await runWhisper(config, mockDeps);

    // Window [10, 30) is entirely within segment 1, so only 1 transcribe segment
    const transcribeTask = result.tasks.find(
      (t) => t.config.label === "transcribe[seg:1 of 3]",
    );
    expect(transcribeTask).toBeDefined();
    expect(transcribeTask?.config.args).toContain("--offset-t");
    expect(transcribeTask?.config.args).toContain("10000");
    expect(transcribeTask?.config.args).toContain("--duration");
    expect(transcribeTask?.config.args).toContain("20000");

    // Segments 2 and 3 should be filtered out
    expect(
      result.tasks.find((t) => t.config.label === "transcribe[seg:2 of 3]"),
    ).toBeUndefined();
    expect(
      result.tasks.find((t) => t.config.label === "transcribe[seg:3 of 3]"),
    ).toBeUndefined();
  });

  test("cached WAV uses correct label", async () => {
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(100),
      checkCache: (path) => path.includes("wav"), // WAV cached, VTT not
    };
    const result = await runWhisper(mockConfig, deps);

    const wavTask = result.tasks.find((t) => t.config.label.includes("to-wav"));
    expect(wavTask?.config.label).toBe("to-wav[seg:1 of 1][cached]");
    expect(wavTask?.config.command).toBe("cp");
  });

  test("cached VTT uses correct label", async () => {
    const deps: RunDeps = {
      getAudioDuration: () => Promise.resolve(100),
      checkCache: (path) => path.includes("vtt"), // VTT cached, WAV not
    };
    const result = await runWhisper(mockConfig, deps);

    const vttTask = result.tasks.find((t) =>
      t.config.label.includes("transcribe["),
    );
    expect(vttTask?.config.label).toBe("transcribe[seg:1 of 1][cached]");
    expect(vttTask?.config.command).toBe("cp");
  });
});
