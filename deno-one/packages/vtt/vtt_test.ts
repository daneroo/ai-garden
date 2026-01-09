import { assertEquals } from "@std/assert";
import { formatTimestamp, parseVtt } from "./vtt.ts";

Deno.test("formatTimestamp formats seconds correctly", () => {
  assertEquals(formatTimestamp(0), "00:00:00.000");
  assertEquals(formatTimestamp(61.5), "00:01:01.500");
  assertEquals(formatTimestamp(3661.123), "01:01:01.123");
});

Deno.test("parseVtt returns correct cues", () => {
  const cues = parseVtt("WEBVTT\n\n00:00:00.000 --> 00:00:01.000\nHello");
  assertEquals(cues.length, 1);
  assertEquals(cues[0].text, "Hello");
  assertEquals(cues[0].startTime, "00:00:00.000");
  assertEquals(cues[0].endTime, "00:00:01.000");
});
