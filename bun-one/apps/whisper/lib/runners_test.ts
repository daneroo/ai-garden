import { expect, test } from "bun:test";
import { getProcessedAudioDuration, type RunConfig } from "./runners.ts";

const mockConfig: RunConfig = {
  input: "test.mp3",
  modelShortName: "tiny.en",
  threads: 4,
  startSec: 0,
  durationSec: 0,
  outputDir: "data/output",
  runWorkDir: "data/work/test-2025-01-01T00-00-00Z",
  verbosity: 1,
  dryRun: false,
  wordTimestamps: false,
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
