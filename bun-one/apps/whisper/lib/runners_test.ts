import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createRunWorkDir,
  getProcessedAudioDuration,
  getSegmentSuffix,
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
      checkCache: () => false,
    };

    const result = await runWhisper(config, deps);
    expect(result.processedAudioDurationSec).toBe(20);
  });

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

describe("runWhisper segment boundaries", () => {
  function getArgValue(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  }

  function describeWavTasks(
    tasks: Array<{ config: { label: string; args: string[] } }>,
  ): Array<{ label: string; ss?: number; t?: number }> {
    return tasks.map((task) => {
      const { args, label } = task.config;
      const ss = getArgValue(args, "-ss");
      const t = getArgValue(args, "-t");
      return Object.fromEntries([
        ["label", label],
        ...(ss !== undefined ? [["ss", Number(ss)]] : []),
        ...(t !== undefined ? [["t", Number(t)]] : []),
      ]) as { label: string; ss?: number; t?: number };
    });
  }

  function describeTranscribeTasks(
    tasks: Array<{ config: { label: string; args: string[] } }>,
  ): Array<{ label: string; offsetMs?: number; durationMs?: number }> {
    return tasks.map((task) => {
      const { args, label } = task.config;
      const offsetMs = getArgValue(args, "--offset-t");
      const durationMs = getArgValue(args, "--duration");
      return Object.fromEntries([
        ["label", label],
        ...(offsetMs !== undefined ? [["offsetMs", Number(offsetMs)]] : []),
        ...(durationMs !== undefined
          ? [["durationMs", Number(durationMs)]]
          : []),
      ]) as { label: string; offsetMs?: number; durationMs?: number };
    });
  }

  async function getSegmentBoundaries({
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
    wav: Array<{ label: string; ss?: number; t?: number }>;
    transcribe: Array<{
      label: string;
      offsetMs?: number;
      durationMs?: number;
    }>;
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
      checkCache: () => false,
    };

    const result = await runWhisper(config, deps);
    const wavTasks = result.tasks.filter((t) =>
      t.config.label.startsWith("to-wav["),
    );
    const transcribeTasks = result.tasks.filter((t) =>
      t.config.label.startsWith("transcribe["),
    );

    return {
      wav: describeWavTasks(wavTasks),
      transcribe: describeTranscribeTasks(transcribeTasks),
    };
  }

  describe("wav boundaries", () => {
    test("single segment has proper boundaries", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 0,
        overlapSec: 0,
        audioDuration: 100,
      });

      expect(boundaries).toEqual({
        wav: [{ label: "to-wav[seg:1 of 1]", ss: 0, t: 100 }],
        transcribe: [
          {
            label: "transcribe[seg:1 of 1]",
          },
        ],
      });
    });

    test("single segment when duration <= segmentSec", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 200,
        overlapSec: 0,
        audioDuration: 100,
      });

      expect(boundaries).toEqual({
        wav: [{ label: "to-wav[seg:1 of 1]", ss: 0, t: 100 }],
        transcribe: [
          {
            label: "transcribe[seg:1 of 1]",
          },
        ],
      });
    });

    test("multiple segments without overlap", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 30 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 30 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 30 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:1 of 4]",
          },
          {
            label: "transcribe[seg:2 of 4]",
          },
          {
            label: "transcribe[seg:3 of 4]",
          },
          {
            label: "transcribe[seg:4 of 4]",
          },
        ],
      });
    });

    test("multiple segments with overlap", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 5,
        audioDuration: 100,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 35 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 35 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 35 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:1 of 4]",
          },
          {
            label: "transcribe[seg:2 of 4]",
          },
          {
            label: "transcribe[seg:3 of 4]",
          },
          {
            label: "transcribe[seg:4 of 4]",
          },
        ],
      });
    });

    test("overlap is capped by remaining audio", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 10,
        audioDuration: 35,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 2]", ss: 0, t: 35 },
          { label: "to-wav[seg:2 of 2]", ss: 30, t: 5 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:1 of 2]",
          },
          {
            label: "transcribe[seg:2 of 2]",
          },
        ],
      });
    });
  });

  describe("without overlap", () => {
    test("transcribe tasks include all segments by default", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 30 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 30 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 30 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:1 of 4]",
          },
          {
            label: "transcribe[seg:2 of 4]",
          },
          {
            label: "transcribe[seg:3 of 4]",
          },
          {
            label: "transcribe[seg:4 of 4]",
          },
        ],
      });
    });

    test("start only filters to start segment", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
        startSec: 50,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 30 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 30 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 30 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:2 of 4]",
            offsetMs: 20000,
          },
          {
            label: "transcribe[seg:3 of 4]",
          },
          {
            label: "transcribe[seg:4 of 4]",
          },
        ],
      });
    });

    test("duration only filters to end segment", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
        durationSec: 50,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 30 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 30 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 30 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:1 of 4]",
          },
          {
            label: "transcribe[seg:2 of 4]",
            durationMs: 20000,
          },
        ],
      });
    });

    test("start and duration together span middle segments", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 0,
        audioDuration: 100,
        startSec: 40,
        durationSec: 40,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 30 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 30 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 30 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:2 of 4]",
            offsetMs: 10000,
          },
          {
            label: "transcribe[seg:3 of 4]",
            durationMs: 20000,
          },
        ],
      });
    });
  });

  describe("with overlap", () => {
    test("start only filters to start segment", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 5,
        audioDuration: 100,
        startSec: 50,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 35 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 35 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 35 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:2 of 4]",
            offsetMs: 20000,
          },
          {
            label: "transcribe[seg:3 of 4]",
          },
          {
            label: "transcribe[seg:4 of 4]",
          },
        ],
      });
    });

    test("duration only filters to end segment", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 5,
        audioDuration: 100,
        durationSec: 50,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 35 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 35 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 35 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:1 of 4]",
          },
          {
            label: "transcribe[seg:2 of 4]",
            durationMs: 20000,
          },
        ],
      });
    });

    test("start and duration together span middle segments", async () => {
      const boundaries = await getSegmentBoundaries({
        segmentSec: 30,
        overlapSec: 5,
        audioDuration: 100,
        startSec: 40,
        durationSec: 40,
      });

      expect(boundaries).toEqual({
        wav: [
          { label: "to-wav[seg:1 of 4]", ss: 0, t: 35 },
          { label: "to-wav[seg:2 of 4]", ss: 30, t: 35 },
          { label: "to-wav[seg:3 of 4]", ss: 60, t: 35 },
          { label: "to-wav[seg:4 of 4]", ss: 90, t: 10 },
        ],
        transcribe: [
          {
            label: "transcribe[seg:2 of 4]",
            offsetMs: 10000,
          },
          {
            label: "transcribe[seg:3 of 4]",
            durationMs: 20000,
          },
        ],
      });
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
