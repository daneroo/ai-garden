import { describe, expect, test } from "bun:test";
import type { VttTranscription } from "./vtt-schema-zod.ts";
import { stitchVttConcat } from "./vtt-stitch.ts";

const PROV_BASE = {
  model: "tiny.en",
  input: "test.wav",
  wordTimestamps: false,
  generated: "2026-01-01T00:00:00Z",
};

function makeTranscription(
  cues: { startTime: string; endTime: string; text: string }[],
): VttTranscription {
  return {
    provenance: { ...PROV_BASE, elapsedMs: 100 },
    cues,
  };
}

describe("stitchVttConcat basic stitching", () => {
  const simpleCue0 = {
    startTime: "00:00:00.000",
    endTime: "00:00:10.000",
    text: "Hello",
  };
  const t0 = makeTranscription([simpleCue0]);
  const simpleCue1 = {
    startTime: "00:00:00.000",
    endTime: "00:00:10.000",
    text: "World",
  };
  const t1 = makeTranscription([simpleCue1]);

  test("single segment offset stays 0", () => {
    const result = stitchVttConcat([t0], PROV_BASE, {
      audioDurationSec: 10,
      defaultSegmentDurationSec: 10,
    });

    expect(result.segments).toHaveLength(1);
    // Seg 0 not shifted
    expect(result.segments[0]!.cues[0]!.startTime).toBe("00:00:00.000");
    expect(result.segments[0]!.cues[0]!.endTime).toBe("00:00:10.000");
  });

  test("defaultSegmentDurationSec<=0 always throws", () => {
    expect(() => {
      stitchVttConcat([t0, t1], PROV_BASE, {
        audioDurationSec: 120,
        defaultSegmentDurationSec: 0,
      });
    }).toThrow("stitchVttConcat: defaultSegmentDurationSec must be > 0");

    expect(() => {
      stitchVttConcat([t0, t1], PROV_BASE, {
        audioDurationSec: 120,
        defaultSegmentDurationSec: -10,
      });
    }).toThrow();

    // Unconditional — also enforced for single segments
    expect(() => {
      stitchVttConcat([t0], PROV_BASE, {
        audioDurationSec: 10,
        defaultSegmentDurationSec: 0,
      });
    }).toThrow();
  });

  test("multiple segments defaultSegmentDurationSec>0 works", () => {
    const result = stitchVttConcat([t0, t1], PROV_BASE, {
      audioDurationSec: 120,
      defaultSegmentDurationSec: 60,
    });

    expect(result.segments).toHaveLength(2);
    // Seg 0 not shifted
    expect(result.segments[0]!.cues[0]!.startTime).toBe("00:00:00.000");
    expect(result.segments[0]!.cues[0]!.endTime).toBe("00:00:10.000");
    // Seg 1 shifted by 60s
    expect(result.segments[1]!.cues[0]!.startTime).toBe("00:01:00.000");
    expect(result.segments[1]!.cues[0]!.endTime).toBe("00:01:10.000");
  });

  test("audioDurationSec is copied directly to composition provenance durationSec", () => {
    const result = stitchVttConcat([t0, t1], PROV_BASE, {
      audioDurationSec: 500,
      defaultSegmentDurationSec: 300,
    });

    // durationSec is the real audio duration, not currentOffset (2 × 300 = 600)
    expect(result.provenance.durationSec).toBe(500);
  });
});

describe("stitchVttConcat clip option", () => {
  const seg0Cues = [
    {
      startTime: "00:04:30.000",
      endTime: "00:04:55.000",
      text: "Near the end",
    },
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

  test("clip clamps last cue endTime to segment boundary", () => {
    const t0 = makeTranscription(seg0Cues);
    const t1 = makeTranscription(seg1Cues);

    const result = stitchVttConcat([t0, t1], PROV_BASE, {
      clip: true,
      audioDurationSec: 600,
      defaultSegmentDurationSec: 300,
    });

    // Seg 0 last cue clamped: 05:02 → 05:00
    expect(result.segments[0]!.cues[1]!.endTime).toBe("00:05:00.000");
    // First cue unchanged
    expect(result.segments[0]!.cues[0]!.endTime).toBe("00:04:55.000");
  });

  test("last segment is never clipped", () => {
    const t0 = makeTranscription(seg0Cues);
    const t1 = makeTranscription([
      {
        startTime: "00:00:00.000",
        endTime: "00:05:02.000",
        text: "Also overshoots",
      },
    ]);

    const result = stitchVttConcat([t0, t1], PROV_BASE, {
      clip: true,
      audioDurationSec: 600,
      defaultSegmentDurationSec: 300,
    });

    // Seg 0 (non-last) is clipped
    expect(result.segments[0]!.cues[1]!.endTime).toBe("00:05:00.000");
    // Seg 1 (last) is NOT clipped — 05:02 shifted by 300s = 10:02
    expect(result.segments[1]!.cues[0]!.endTime).toBe("00:10:02.000");
  });

  test("no clipping when clip is false (default)", () => {
    const t0 = makeTranscription(seg0Cues);
    const t1 = makeTranscription(seg1Cues);

    const result = stitchVttConcat([t0, t1], PROV_BASE, {
      audioDurationSec: 600,
      defaultSegmentDurationSec: 300,
    });

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
    const t0 = makeTranscription(withinBoundary);
    const t1 = makeTranscription(seg1Cues);

    const result = stitchVttConcat([t0, t1], PROV_BASE, {
      clip: true,
      audioDurationSec: 600,
      defaultSegmentDurationSec: 300,
    });

    // 04:58 < 05:00 boundary → no change
    expect(result.segments[0]!.cues[0]!.endTime).toBe("00:04:58.000");
  });
});
