import { describe, expect, test } from "bun:test";
import { computeSegments, getSegmentSuffix } from "./segmentation.ts";

describe("getSegmentSuffix", () => {
  test("formats correctly", () => {
    expect(getSegmentSuffix(0, 3600)).toBe("-seg00-d1h");
    expect(getSegmentSuffix(5, 3600)).toBe("-seg05-d1h");
    expect(getSegmentSuffix(12, 7200)).toBe("-seg12-d2h");
  });

  test("supports explicit duration label override", () => {
    expect(getSegmentSuffix(0, 1800.019, { durationLabel: "full" })).toBe(
      "-seg00-dfull",
    );
  });
});

const MAX_SEG = 37 * 3600; // large enough to never trigger auto-segmentation

describe("computeSegments", () => {
  test("single segment when segmentSec is 0", () => {
    const segs = computeSegments(100, 0, MAX_SEG);
    expect(segs).toEqual([{ startSec: 0, endSec: 100 }]);
  });

  test("multiple segments with exact division", () => {
    const segs = computeSegments(120, 30, MAX_SEG);
    expect(segs).toEqual([
      { startSec: 0, endSec: 30 },
      { startSec: 30, endSec: 60 },
      { startSec: 60, endSec: 90 },
      { startSec: 90, endSec: 120 },
    ]);
  });

  test("multiple segments with remainder", () => {
    const segs = computeSegments(100, 30, MAX_SEG);
    expect(segs).toEqual([
      { startSec: 0, endSec: 30 },
      { startSec: 30, endSec: 60 },
      { startSec: 60, endSec: 90 },
      { startSec: 90, endSec: 100 },
    ]);
  });

  test("tiny tail absorbed into last segment", () => {
    // 91s / 30s = 3 full + 1s remainder (below MIN_SEGMENT_REMAINDER_SEC)
    const segs = computeSegments(91, 30, MAX_SEG);
    expect(segs).toHaveLength(3);
    expect(segs[2]).toEqual({ startSec: 60, endSec: 91 });
  });

  test("auto-segments when duration exceeds maxSegmentSec", () => {
    // segmentSec=0 but audioDuration > maxSegmentSec triggers auto
    const segs = computeSegments(100, 0, 40);
    expect(segs).toHaveLength(3); // 40+40+20
    expect(segs[0]).toEqual({ startSec: 0, endSec: 40 });
    expect(segs[2]).toEqual({ startSec: 80, endSec: 100 });
  });

  test("empty for zero duration", () => {
    expect(computeSegments(0, 30, MAX_SEG)).toEqual([]);
  });
});
