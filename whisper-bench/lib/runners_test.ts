import { assertEquals } from "@std/assert";
import { getProcessedAudioDuration, type RunConfig } from "./runners.ts";

const mockConfig: RunConfig = {
  input: "test.mp3",
  runner: "whispercpp",
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

Deno.test("getProcessedAudioDuration - explicit duration", async () => {
  const config = { ...mockConfig, durationSec: 10 };
  const getDuration = () => Promise.resolve(100); // Should be ignored (capped)

  // Explicitly requested 10s, file is 100s -> 10s
  assertEquals(await getProcessedAudioDuration(config, getDuration), 10);

  // Explicitly requested 10s, file is 5s -> 5s (capped)
  const configSmallFile = { ...mockConfig, durationSec: 10 };
  const getDurationSmall = () => Promise.resolve(5);
  assertEquals(
    await getProcessedAudioDuration(configSmallFile, getDurationSmall),
    5,
  );
});

Deno.test(
  "getProcessedAudioDuration - implicit duration (full file)",
  async () => {
    const config = { ...mockConfig, durationSec: 0, startSec: 0 };
    const getDuration = () => Promise.resolve(60); // 60s file

    // 0 duration means until end of file -> 60s
    assertEquals(await getProcessedAudioDuration(config, getDuration), 60);
  },
);

Deno.test(
  "getProcessedAudioDuration - implicit duration (start offset)",
  async () => {
    const config = { ...mockConfig, durationSec: 0, startSec: 10 };
    const getDuration = () => Promise.resolve(60); // 60s file

    // Effective duration = 60 - 10 = 50s
    assertEquals(await getProcessedAudioDuration(config, getDuration), 50);
  },
);

Deno.test("getProcessedAudioDuration - edge cases", async () => {
  const getDuration = () => Promise.resolve(60);

  // Start offset beyond file duration
  const invalidConfig = { ...mockConfig, startSec: 70 };
  assertEquals(await getProcessedAudioDuration(invalidConfig, getDuration), 0);

  // Explicit duration 0 is treated as until end of file
  const configZeroDur = { ...mockConfig, durationSec: 0 };
  assertEquals(await getProcessedAudioDuration(configZeroDur, getDuration), 60);
});
