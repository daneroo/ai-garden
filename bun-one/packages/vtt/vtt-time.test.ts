import { describe, expect, test } from "bun:test";
import { secondsToVttTime, vttTimeToSeconds } from "./vtt-time";

describe("vttTimeToSeconds", () => {
  test("HH:MM:SS.mmm", () => {
    expect(vttTimeToSeconds("00:00:00.000")).toBe(0);
    expect(vttTimeToSeconds("00:01:07.000")).toBe(67);
    expect(vttTimeToSeconds("01:02:03.456")).toBeCloseTo(3723.456);
  });

  test("MM:SS.mmm", () => {
    expect(vttTimeToSeconds("01:07.000")).toBe(67);
    expect(vttTimeToSeconds("00:30.500")).toBe(30.5);
  });

  test("SS.mmm (bare seconds)", () => {
    expect(vttTimeToSeconds("42.123")).toBeCloseTo(42.123);
  });

  test("round-trips with secondsToVttTime", () => {
    const cases = [0, 1.5, 67, 3723.456, 86399.999];
    for (const sec of cases) {
      expect(vttTimeToSeconds(secondsToVttTime(sec))).toBeCloseTo(sec, 2);
    }
  });
});

describe("secondsToVttTime", () => {
  test("zero", () => {
    expect(secondsToVttTime(0)).toBe("00:00:00.000");
  });

  test("sub-minute", () => {
    expect(secondsToVttTime(30.5)).toBe("00:00:30.500");
  });

  test("minutes and seconds", () => {
    expect(secondsToVttTime(67)).toBe("00:01:07.000");
  });

  test("hours", () => {
    expect(secondsToVttTime(3661.5)).toBe("01:01:01.500");
  });

  test("negative throws", () => {
    expect(() => secondsToVttTime(-1)).toThrow("Time cannot be negative");
  });
});
