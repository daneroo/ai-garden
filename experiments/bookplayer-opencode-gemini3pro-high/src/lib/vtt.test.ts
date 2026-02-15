import { describe, expect, test } from "vitest";
import { parseVtt } from "./vtt";

describe("VTT Parser", () => {
  test("parses simple VTT", () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Hello world

00:00:05.000 --> 00:00:09.000
Second line
Multi line text`;

    const cues = parseVtt(vtt);
    expect(cues).toHaveLength(2);
    expect(cues[0].startTime).toBe(1);
    expect(cues[0].endTime).toBe(4);
    expect(cues[0].text).toBe("Hello world");

    expect(cues[1].startTime).toBe(5);
    expect(cues[1].endTime).toBe(9);
    expect(cues[1].text).toBe("Second line\nMulti line text");
  });
});
