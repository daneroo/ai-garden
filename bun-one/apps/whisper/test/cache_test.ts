import { describe, expect, test } from "bun:test";
import { getVttCachePath, getWavCachePath } from "../lib/cache.ts";

describe("getWavCachePath", () => {
  test("returns path in wav cache dir", () => {
    const path = getWavCachePath("audio");
    expect(path).toContain("/cache/wav/audio.wav");
  });

  test("handles segment names", () => {
    const path = getWavCachePath("audio-seg00-d10m");
    expect(path).toContain("audio-seg00-d10m.wav");
  });
});

describe("getVttCachePath", () => {
  test("includes model and wordTimestamps", () => {
    const path = getVttCachePath("audio-seg00", "tiny.en", false);
    expect(path).toContain("audio-seg00-mtiny-en-wt0.vtt");
  });

  test("wt1 when wordTimestamps true", () => {
    const path = getVttCachePath("audio", "tiny.en", true);
    expect(path).toContain("-wt1.vtt");
  });

  test("different models produce different paths", () => {
    const p1 = getVttCachePath("audio", "tiny.en", false);
    const p2 = getVttCachePath("audio", "small.en", false);
    expect(p1).not.toBe(p2);
  });

  test("includes durationMs in cache key when non-zero", () => {
    const p1 = getVttCachePath("audio", "tiny.en", false, 0);
    const p2 = getVttCachePath("audio", "tiny.en", false, 5000);
    expect(p1).not.toBe(p2);
    expect(p2).toContain("-dur5000");
  });

  test("omits duration from key when zero", () => {
    const path = getVttCachePath("audio", "tiny.en", false, 0);
    expect(path).not.toContain("-dur");
  });
});
