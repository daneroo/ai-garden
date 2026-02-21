import { describe, expect, test } from "bun:test";
import type { VttTranscription } from "./vtt-schema-zod.ts";
import { stitchVttConcat } from "./vtt-stitch.ts";

const PROV_BASE = {
  model: "tiny.en",
  input: "test.wav",
  wordTimestamps: false,
  generated: "2026-01-01T00:00:00Z",
};

// Two 5-minute segments with cues near the boundary — realistic whisper output
function makeTranscription(
  cues: { startTime: string; endTime: string; text: string }[],
  durationSec?: number,
): VttTranscription {
  return {
    provenance: { ...PROV_BASE, elapsedMs: 100, durationSec },
    cues,
  };
}

// Seg 0: 0:00–5:00, last cue overshoots by ~2s (ends at 05:02)
// Seg 1: 5:00–10:00, normal cue
const seg0Cues = [
  { startTime: "00:04:30.000", endTime: "00:04:55.000", text: "Near the end" },
  {
    startTime: "00:04:55.000",
    endTime: "00:05:02.000",
    text: "Overshoots boundary",
  },
];
const seg1Cues = [
  {
    startTime: "00:00:00.000",
    endTime: "00:00:28.000",
    text: "Start of next segment",
  },
];

describe("stitchVttConcat clip option", () => {
  test("clip clamps last cue endTime to segment boundary", () => {
    const t0 = makeTranscription(seg0Cues, 300);
    const t1 = makeTranscription(seg1Cues, 300);

    const result = stitchVttConcat([t0, t1], PROV_BASE, { clip: true });

    // Seg 0 last cue clamped: 05:02 → 05:00
    expect(result.segments[0]!.cues[1]!.endTime).toBe("00:05:00.000");
    // First cue unchanged
    expect(result.segments[0]!.cues[0]!.endTime).toBe("00:04:55.000");
  });

  test("last segment is never clipped", () => {
    const t0 = makeTranscription(seg0Cues, 300);
    const t1 = makeTranscription(
      [
        {
          startTime: "00:00:00.000",
          endTime: "00:05:02.000",
          text: "Also overshoots",
        },
      ],
      300,
    );

    const result = stitchVttConcat([t0, t1], PROV_BASE, { clip: true });

    // Seg 0 (non-last) is clipped
    expect(result.segments[0]!.cues[1]!.endTime).toBe("00:05:00.000");
    // Seg 1 (last) is NOT clipped — 05:02 shifted by 300s = 10:02
    expect(result.segments[1]!.cues[0]!.endTime).toBe("00:10:02.000");
  });

  test("no clipping when clip is false (default)", () => {
    const t0 = makeTranscription(seg0Cues, 300);
    const t1 = makeTranscription(seg1Cues, 300);

    const result = stitchVttConcat([t0, t1], PROV_BASE);

    // No clipping — overshoot preserved at 05:02
    expect(result.segments[0]!.cues[1]!.endTime).toBe("00:05:02.000");
  });

  test("no clipping when cue endTime is within boundary", () => {
    const withinBoundary = [
      {
        startTime: "00:04:30.000",
        endTime: "00:04:58.000",
        text: "Within boundary",
      },
    ];
    const t0 = makeTranscription(withinBoundary, 300);
    const t1 = makeTranscription(seg1Cues, 300);

    const result = stitchVttConcat([t0, t1], PROV_BASE, { clip: true });

    // 04:58 < 05:00 boundary → no change
    expect(result.segments[0]!.cues[0]!.endTime).toBe("00:04:58.000");
  });
});
