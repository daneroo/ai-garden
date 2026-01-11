import { describe, expect, test } from "bun:test";
import { formatTimestamp, parseVtt } from "./vtt";

describe("vtt", () => {
  test("formatTimestamp formats seconds correctly", () => {
    expect(formatTimestamp(0)).toBe("00:00:00.000");
    expect(formatTimestamp(61.5)).toBe("00:01:01.500");
    expect(formatTimestamp(3661.123)).toBe("01:01:01.123");
  });

  test("parseVtt returns correct cues", () => {
    const cues = parseVtt("WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHello");
    expect(cues.length).toBe(1);
    const cue = cues[0]!;
    expect(cue.text).toBe("Hello");
    expect(cue.startTime).toBe("00:00:00.000");
    expect(cue.endTime).toBe("00:00:01.000");
  });
});
