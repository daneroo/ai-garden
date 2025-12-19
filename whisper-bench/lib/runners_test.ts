import { assertEquals } from "@std/assert";
import { calculateSpeedup, RunConfig } from "./runners.ts";

const mockConfig: RunConfig = {
  input: "test.mp3",
  runner: "whispercpp",
  modelShortName: "tiny.en",
  threads: 4,
  startSec: 0,
  durationSec: 0,
  outputDir: "data/output",
  workDir: "data/work",
  verbosity: 1,
  dryRun: false,
  wordTimestamps: false,
};

Deno.test("calculateSpeedup - explicit duration", async () => {
  const config = { ...mockConfig, durationSec: 10 };
  const getDuration = () => Promise.resolve(100); // Should be ignored

  // 10s audio / 2s elapsed = 5.0x
  assertEquals(await calculateSpeedup(config, 2, getDuration), "5.0");

  // 10s audio / 5s elapsed = 2.0x
  assertEquals(await calculateSpeedup(config, 5, getDuration), "2.0");
});

Deno.test("calculateSpeedup - implicit duration (full file)", async () => {
  const config = { ...mockConfig, durationSec: 0, startSec: 0 };
  const getDuration = () => Promise.resolve(60); // 60s file

  // 60s audio / 20s elapsed = 3.0x
  assertEquals(await calculateSpeedup(config, 20, getDuration), "3.0");
});

Deno.test("calculateSpeedup - implicit duration (start offset)", async () => {
  const config = { ...mockConfig, durationSec: 0, startSec: 10 };
  const getDuration = () => Promise.resolve(60); // 60s file

  // Effective duration = 60 - 10 = 50s
  // 50s audio / 25s elapsed = 2.0x
  assertEquals(await calculateSpeedup(config, 25, getDuration), "2.0");
});

Deno.test("calculateSpeedup - edge cases", async () => {
  const config = { ...mockConfig, durationSec: 0 };
  const getDuration = () => Promise.resolve(60);

  // Zero elapsed time
  assertEquals(await calculateSpeedup(config, 0, getDuration), "?");

  // Start offset beyond file duration
  const invalidConfig = { ...mockConfig, startSec: 70 };
  assertEquals(await calculateSpeedup(invalidConfig, 10, getDuration), "?");
});
