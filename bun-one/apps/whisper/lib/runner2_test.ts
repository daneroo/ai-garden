import { test, expect } from "bun:test";

import { runWhisper, type RunConfig } from "./runner2.ts";

const mockConfig: RunConfig = {
  input: "test.mp3",
  modelShortName: "tiny.en",
  threads: 4,
  startSec: 0,
  durationSec: 0,
  outputDir: "data/output",
  runWorkDir: "data/work/test-2025-01-01T00-00-00Z",
  verbosity: 1,
  dryRun: true,
  wordTimestamps: false,
  segmentSec: 0,
  overlapSec: 0,
};

test("runWhisper returns a basic result shape", async () => {
  const getAudioDuration = () => Promise.resolve(1);
  const result = await runWhisper(mockConfig, { getAudioDuration });

  expect(result.outputPath).toBe("data/output/test.vtt");
  expect(result.tasks).toHaveLength(2);
  expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 1]");
  expect(result.tasks[0]?.command).toBe("ffmpeg");
  expect(typeof result.tasks[0]?.monitor.onEvent).toBe("function");
  expect(result.tasks[1]?.label).toBe("transcribe[seg:1 of 1]");
  expect(result.tasks[1]?.command).toBe("whisper-cli");
  expect(typeof result.tasks[1]?.monitor.onEvent).toBe("function");
  expect(typeof result.elapsedSec).toBe("number");
  expect(typeof result.speedup).toBe("string");
});

test("runWhisper outputPath respects tag", async () => {
  const getAudioDuration = () => Promise.resolve(1);
  const result = await runWhisper(
    { ...mockConfig, tag: "kit-tiny" },
    { getAudioDuration },
  );
  expect(result.outputPath).toBe("data/output/test.kit-tiny.vtt");
});

test("runWhisper creates one ffmpeg task per segment", async () => {
  const config = { ...mockConfig, segmentSec: 40 };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(6);
  expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 3]");
  expect(result.tasks[1]?.label).toBe("to-wav[seg:2 of 3]");
  expect(result.tasks[2]?.label).toBe("to-wav[seg:3 of 3]");
  expect(result.tasks[3]?.label).toBe("transcribe[seg:1 of 3]");
  expect(result.tasks[4]?.label).toBe("transcribe[seg:2 of 3]");
  expect(result.tasks[5]?.label).toBe("transcribe[seg:3 of 3]");
});

test("runWhisper adds --offset-t in single-segment mode", async () => {
  const config = { ...mockConfig, startSec: 12, segmentSec: 0 };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(2);
  expect(result.tasks[1]?.label).toBe("transcribe[seg:1 of 1]");
  expect(result.tasks[1]?.args).toEqual(["--offset-t", "12000"]);
});

test("runWhisper adds --offset-t only on the containing segment", async () => {
  const config = { ...mockConfig, startSec: 50, segmentSec: 40 };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(5);
  expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 3]");
  expect(result.tasks[1]?.label).toBe("to-wav[seg:2 of 3]");
  expect(result.tasks[2]?.label).toBe("to-wav[seg:3 of 3]");
  expect(result.tasks[3]?.label).toBe("transcribe[seg:2 of 3]");
  expect(result.tasks[3]?.args).toEqual(["--offset-t", "10000"]);
  expect(result.tasks[4]?.label).toBe("transcribe[seg:3 of 3]");
  expect(result.tasks[4]?.args).toEqual([]);
});

test("runWhisper emits --offset-t 0 when start is on a segment boundary", async () => {
  const config = { ...mockConfig, startSec: 40, segmentSec: 40 };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(5);
  expect(result.tasks[3]?.label).toBe("transcribe[seg:2 of 3]");
  expect(result.tasks[3]?.args).toEqual(["--offset-t", "0"]);
  expect(result.tasks[4]?.label).toBe("transcribe[seg:3 of 3]");
  expect(result.tasks[4]?.args).toEqual([]);
});

test("runWhisper adds --duration in single-segment mode", async () => {
  const config = { ...mockConfig, durationSec: 5, segmentSec: 0 };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(2);
  expect(result.tasks[1]?.label).toBe("transcribe[seg:1 of 1]");
  expect(result.tasks[1]?.args).toEqual(["--duration", "5000"]);
});

test("runWhisper adds --duration only on the end segment", async () => {
  const config = {
    ...mockConfig,
    segmentSec: 40,
    startSec: 0,
    durationSec: 50,
  };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(5);
  expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 3]");
  expect(result.tasks[1]?.label).toBe("to-wav[seg:2 of 3]");
  expect(result.tasks[2]?.label).toBe("to-wav[seg:3 of 3]");
  expect(result.tasks[3]?.label).toBe("transcribe[seg:1 of 3]");
  expect(result.tasks[3]?.args).toEqual([]);
  expect(result.tasks[4]?.label).toBe("transcribe[seg:2 of 3]");
  expect(result.tasks[4]?.args).toEqual(["--duration", "10000"]);
});

test("runWhisper emits full-segment --duration when end is on a segment boundary", async () => {
  const config = {
    ...mockConfig,
    segmentSec: 40,
    startSec: 0,
    durationSec: 80,
  };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(5);
  expect(result.tasks[3]?.label).toBe("transcribe[seg:1 of 3]");
  expect(result.tasks[3]?.args).toEqual([]);
  expect(result.tasks[4]?.label).toBe("transcribe[seg:2 of 3]");
  expect(result.tasks[4]?.args).toEqual(["--duration", "40000"]);
});

test("runWhisper adds both --offset-t and --duration when window ends in same segment", async () => {
  const config = {
    ...mockConfig,
    segmentSec: 40,
    startSec: 10,
    durationSec: 20,
  };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(4);
  expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 3]");
  expect(result.tasks[1]?.label).toBe("to-wav[seg:2 of 3]");
  expect(result.tasks[2]?.label).toBe("to-wav[seg:3 of 3]");
  expect(result.tasks[3]?.label).toBe("transcribe[seg:1 of 3]");
  expect(result.tasks[3]?.args).toEqual([
    "--offset-t",
    "10000",
    "--duration",
    "20000",
  ]);
});

test("runWhisper filters transcribe tasks by start/duration (documents behavior)", async () => {
  // With segmentSec=40, start=50, duration=20, the requested window is [50,70)
  // which is entirely within segment 2.
  // We still run all WAV tasks (3), but we only run 1 transcribe task.
  const config = {
    ...mockConfig,
    segmentSec: 40,
    startSec: 50,
    durationSec: 20,
  };
  const getAudioDuration = () => Promise.resolve(100);

  const result = await runWhisper(config, { getAudioDuration });

  expect(result.tasks).toHaveLength(4);
  expect(result.tasks[0]?.label).toBe("to-wav[seg:1 of 3]");
  expect(result.tasks[1]?.label).toBe("to-wav[seg:2 of 3]");
  expect(result.tasks[2]?.label).toBe("to-wav[seg:3 of 3]");

  expect(result.tasks[3]?.label).toBe("transcribe[seg:2 of 3]");
  expect(result.tasks[3]?.args).toEqual([
    "--offset-t",
    "10000",
    "--duration",
    "20000",
  ]);
});
