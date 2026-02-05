import { describe, expect, test } from "bun:test";
import {
  computeSegments,
  getDurationMsForSegment,
  getOffsetMsForSegment,
  getSegmentSuffix,
  segmentOverlapsRange,
} from "./segmentation.ts";

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

describe("getOffsetMsForSegment", () => {
  test("returns 0 when startSec <= 0", () => {
    expect(getOffsetMsForSegment(0, 0, 30, 4)).toBe(0);
    expect(getOffsetMsForSegment(1, 0, 30, 4)).toBe(0);
  });

  test("returns offset only for containing segment", () => {
    // start=50 is in segment 1 (30-60), offset = 50-30 = 20s = 20000ms
    expect(getOffsetMsForSegment(0, 50, 30, 4)).toBe(0);
    expect(getOffsetMsForSegment(1, 50, 30, 4)).toBe(20000);
    expect(getOffsetMsForSegment(2, 50, 30, 4)).toBe(0);
  });

  test("returns correct offset for start in first segment", () => {
    expect(getOffsetMsForSegment(0, 10, 30, 4)).toBe(10000);
    expect(getOffsetMsForSegment(1, 10, 30, 4)).toBe(0);
  });
});

describe("getDurationMsForSegment", () => {
  test("returns 0 when durationSec <= 0", () => {
    expect(getDurationMsForSegment(0, 0, 0, 100, 30, 0, 4)).toBe(0);
    expect(getDurationMsForSegment(1, 0, 0, 100, 30, 0, 4)).toBe(0);
  });

  test("returns 0 when duration extends to end of file", () => {
    expect(getDurationMsForSegment(0, 0, 150, 100, 30, 0, 4)).toBe(0);
    expect(getDurationMsForSegment(3, 0, 150, 100, 30, 0, 4)).toBe(0);
  });

  test("returns duration only for end segment", () => {
    // duration=50 ends in segment 1 (30-60), local duration = 50-30 = 20s = 20000ms
    expect(getDurationMsForSegment(0, 0, 50, 100, 30, 0, 4)).toBe(0);
    expect(getDurationMsForSegment(1, 0, 50, 100, 30, 0, 4)).toBe(20000);
    expect(getDurationMsForSegment(2, 0, 50, 100, 30, 0, 4)).toBe(0);
  });

  test("returns full duration when start and end in same segment", () => {
    // start=10, duration=15 -> both in segment 0
    expect(getDurationMsForSegment(0, 10, 15, 100, 30, 0, 4)).toBe(15000);
    expect(getDurationMsForSegment(1, 10, 15, 100, 30, 0, 4)).toBe(0);
  });
});

const MAX_SEG = 37 * 3600; // large enough to never trigger auto-segmentation

describe("computeSegments", () => {
  test("single segment when segmentSec is 0", () => {
    const segs = computeSegments(100, 0, 0, MAX_SEG);
    expect(segs).toEqual([{ startSec: 0, endSec: 100 }]);
  });

  test("multiple segments with exact division", () => {
    const segs = computeSegments(120, 30, 0, MAX_SEG);
    expect(segs).toEqual([
      { startSec: 0, endSec: 30 },
      { startSec: 30, endSec: 60 },
      { startSec: 60, endSec: 90 },
      { startSec: 90, endSec: 120 },
    ]);
  });

  test("multiple segments with remainder", () => {
    const segs = computeSegments(100, 30, 0, MAX_SEG);
    expect(segs).toEqual([
      { startSec: 0, endSec: 30 },
      { startSec: 30, endSec: 60 },
      { startSec: 60, endSec: 90 },
      { startSec: 90, endSec: 100 },
    ]);
  });

  test("overlap extends non-last segments", () => {
    const segs = computeSegments(120, 30, 5, MAX_SEG);
    expect(segs).toEqual([
      { startSec: 0, endSec: 35 },
      { startSec: 30, endSec: 65 },
      { startSec: 60, endSec: 95 },
      { startSec: 90, endSec: 120 },
    ]);
  });

  test("tiny tail absorbed into last segment", () => {
    // 91s / 30s = 3 full + 1s remainder (below MIN_SEGMENT_REMAINDER_SEC)
    const segs = computeSegments(91, 30, 0, MAX_SEG);
    expect(segs).toHaveLength(3);
    expect(segs[2]).toEqual({ startSec: 60, endSec: 91 });
  });

  test("auto-segments when duration exceeds maxSegmentSec", () => {
    // segmentSec=0 but audioDuration > maxSegmentSec triggers auto
    const segs = computeSegments(100, 0, 0, 40);
    expect(segs).toHaveLength(3); // 40+40+20
    expect(segs[0]).toEqual({ startSec: 0, endSec: 40 });
    expect(segs[2]).toEqual({ startSec: 80, endSec: 100 });
  });

  test("empty for zero duration", () => {
    expect(computeSegments(0, 30, 0, MAX_SEG)).toEqual([]);
  });
});

describe("segmentOverlapsRange", () => {
  test("full overlap", () => {
    expect(segmentOverlapsRange({ startSec: 10, endSec: 20 }, 5, 25)).toBe(
      true,
    );
  });

  test("partial overlap at start", () => {
    expect(segmentOverlapsRange({ startSec: 10, endSec: 20 }, 15, 25)).toBe(
      true,
    );
  });

  test("partial overlap at end", () => {
    expect(segmentOverlapsRange({ startSec: 10, endSec: 20 }, 5, 15)).toBe(
      true,
    );
  });

  test("no overlap - before", () => {
    expect(segmentOverlapsRange({ startSec: 10, endSec: 20 }, 0, 10)).toBe(
      false,
    );
  });

  test("no overlap - after", () => {
    expect(segmentOverlapsRange({ startSec: 10, endSec: 20 }, 20, 30)).toBe(
      false,
    );
  });

  test("segment contained in range", () => {
    expect(segmentOverlapsRange({ startSec: 12, endSec: 18 }, 10, 20)).toBe(
      true,
    );
  });
});
