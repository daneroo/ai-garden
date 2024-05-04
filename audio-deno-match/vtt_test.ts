import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

import { parseVTT } from "./vtt.ts";

Deno.test("Testing parseVTT", () => {
  const vtt = `WEBVTT

00:00:00.000 --> 00:00:04.800
 The road not taken by Robert Frost.

00:00:04.800 --> 00:00:09.600
 Two roads diverged in a yellow wood,
`;
  const cues = parseVTT(vtt);
  assertEquals(cues, [
    {
      startTime: "00:00:00.000",
      endTime: "00:00:04.800",
      text: "The road not taken by Robert Frost.\n",
    },
    {
      startTime: "00:00:04.800",
      endTime: "00:00:09.600",
      text: "Two roads diverged in a yellow wood,\n",
    },
  ]);
});
