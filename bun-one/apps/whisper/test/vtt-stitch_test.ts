import { describe, expect, test } from "bun:test";
import {
  formatVtt,
  secondsToVttTime,
  shiftVttCues,
  stitchVttConcat,
  type SegmentVttInfo,
} from "../lib/vtt-stitch.ts";
import type { VttCue } from "../lib/vtt.ts";

describe("secondsToVttTime", () => {
  test("formats zero", () => {
    expect(secondsToVttTime(0)).toBe("00:00:00.000");
  });

  test("formats seconds only", () => {
    expect(secondsToVttTime(5)).toBe("00:00:05.000");
    expect(secondsToVttTime(59.5)).toBe("00:00:59.500");
  });

  test("formats minutes and seconds", () => {
    expect(secondsToVttTime(90)).toBe("00:01:30.000");
    expect(secondsToVttTime(125.123)).toBe("00:02:05.123");
  });

  test("formats hours, minutes, and seconds", () => {
    expect(secondsToVttTime(3600)).toBe("01:00:00.000");
    expect(secondsToVttTime(3661.5)).toBe("01:01:01.500");
    expect(secondsToVttTime(7325.999)).toBe("02:02:05.999");
  });

  test("handles large values", () => {
    expect(secondsToVttTime(37 * 3600)).toBe("37:00:00.000");
  });

  test("throws on negative", () => {
    expect(() => secondsToVttTime(-1)).toThrow("cannot be negative");
  });
});

describe("shiftVttCues", () => {
  const cues: VttCue[] = [
    { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "First" },
    { startTime: "00:00:05.000", endTime: "00:00:10.000", text: "Second" },
  ];

  test("shifts by zero", () => {
    const shifted = shiftVttCues(cues, 0);
    expect(shifted[0]?.startTime).toBe("00:00:00.000");
    expect(shifted[0]?.endTime).toBe("00:00:05.000");
    expect(shifted[1]?.startTime).toBe("00:00:05.000");
    expect(shifted[1]?.endTime).toBe("00:00:10.000");
  });

  test("shifts by positive offset", () => {
    const shifted = shiftVttCues(cues, 60);
    expect(shifted[0]?.startTime).toBe("00:01:00.000");
    expect(shifted[0]?.endTime).toBe("00:01:05.000");
    expect(shifted[1]?.startTime).toBe("00:01:05.000");
    expect(shifted[1]?.endTime).toBe("00:01:10.000");
  });

  test("preserves text", () => {
    const shifted = shiftVttCues(cues, 60);
    expect(shifted[0]?.text).toBe("First");
    expect(shifted[1]?.text).toBe("Second");
  });

  test("does not mutate original", () => {
    shiftVttCues(cues, 60);
    expect(cues[0]?.startTime).toBe("00:00:00.000");
  });
});

describe("formatVtt", () => {
  test("formats empty cues", () => {
    expect(formatVtt([])).toBe("WEBVTT\n");
  });

  test("formats single cue", () => {
    const cues: VttCue[] = [
      { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "Hello" },
    ];
    const expected = "WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nHello\n";
    expect(formatVtt(cues)).toBe(expected);
  });

  test("formats multiple cues", () => {
    const cues: VttCue[] = [
      { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "First" },
      { startTime: "00:00:05.000", endTime: "00:00:10.000", text: "Second" },
    ];
    const result = formatVtt(cues);
    expect(result).toContain("WEBVTT");
    expect(result).toContain("00:00:00.000 --> 00:00:05.000");
    expect(result).toContain("First");
    expect(result).toContain("00:00:05.000 --> 00:00:10.000");
    expect(result).toContain("Second");
  });
});

describe("stitchVttConcat", () => {
  test("stitches single segment", () => {
    const segments: SegmentVttInfo[] = [
      {
        cues: [
          { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "A" },
        ],
        startSec: 0,
      },
    ];
    const result = stitchVttConcat(segments);
    expect(result).toHaveLength(1);
    expect(result[0]?.startTime).toBe("00:00:00.000");
  });

  test("stitches multiple segments with offset", () => {
    const segments: SegmentVttInfo[] = [
      {
        cues: [
          { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "A" },
          { startTime: "00:00:05.000", endTime: "00:00:10.000", text: "B" },
        ],
        startSec: 0,
      },
      {
        cues: [
          { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "C" },
          { startTime: "00:00:05.000", endTime: "00:00:10.000", text: "D" },
        ],
        startSec: 10,
      },
    ];

    const result = stitchVttConcat(segments);
    expect(result).toHaveLength(4);

    // First segment cues at original times
    expect(result[0]?.startTime).toBe("00:00:00.000");
    expect(result[0]?.text).toBe("A");
    expect(result[1]?.startTime).toBe("00:00:05.000");
    expect(result[1]?.text).toBe("B");

    // Second segment cues shifted by 10s
    expect(result[2]?.startTime).toBe("00:00:10.000");
    expect(result[2]?.text).toBe("C");
    expect(result[3]?.startTime).toBe("00:00:15.000");
    expect(result[3]?.text).toBe("D");
  });

  test("handles empty segments", () => {
    const segments: SegmentVttInfo[] = [
      { cues: [], startSec: 0 },
      {
        cues: [
          { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "A" },
        ],
        startSec: 10,
      },
    ];

    const result = stitchVttConcat(segments);
    expect(result).toHaveLength(1);
    expect(result[0]?.startTime).toBe("00:00:10.000");
  });
});
