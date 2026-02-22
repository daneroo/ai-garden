import { describe, expect, test } from "bun:test";
import {
  parseComposition,
  parseTranscription,
  type VttComposition,
  type VttTranscription,
} from "@bun-one/vtt";
import { formatComposition, formatTranscription } from "./vtt-writer.ts";

describe("formatTranscription", () => {
  const transcription: VttTranscription = {
    provenance: {
      input: "test.wav",
      model: "tiny.en",
      wordTimestamps: false,
      generated: "2026-02-20T00:00:00.000Z",
      elapsedMs: 500,
      durationSec: 10,
    },
    cues: [
      { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "Hello" },
      { startTime: "00:00:05.000", endTime: "00:00:10.000", text: "World" },
    ],
  };

  test("starts with WEBVTT header", () => {
    const text = formatTranscription(transcription);
    expect(text.startsWith("WEBVTT\n")).toBe(true);
  });

  test("includes NOTE Provenance block", () => {
    const text = formatTranscription(transcription);
    expect(text).toContain("NOTE Provenance");
    expect(text).toContain('"input":"test.wav"');
    expect(text).toContain('"model":"tiny.en"');
  });

  test("includes cue timing lines", () => {
    const text = formatTranscription(transcription);
    expect(text).toContain("00:00:00.000 --> 00:00:05.000");
    expect(text).toContain("00:00:05.000 --> 00:00:10.000");
  });

  test("roundtrips through parseTranscription", () => {
    const text = formatTranscription(transcription);
    const { value } = parseTranscription(text);
    expect(value.provenance.input).toBe("test.wav");
    expect(value.provenance.elapsedMs).toBe(500);
    expect(value.provenance.durationSec).toBe(10);
    expect(value.cues).toHaveLength(2);
    expect(value.cues[0]?.text).toBe("Hello");
    expect(value.cues[1]?.text).toBe("World");
  });

  test("roundtrips without optional durationSec", () => {
    const noDur: VttTranscription = {
      provenance: {
        input: "x.wav",
        model: "tiny.en",
        wordTimestamps: true,
        generated: "2026-02-20T00:00:00.000Z",
        elapsedMs: 100,
      },
      cues: [
        { startTime: "00:00:00.000", endTime: "00:00:01.000", text: "Hi" },
      ],
    };
    const text = formatTranscription(noDur);
    const { value } = parseTranscription(text);
    expect(value.provenance.durationSec).toBeUndefined();
    expect(value.provenance.wordTimestamps).toBe(true);
  });
});

describe("formatComposition", () => {
  const composition: VttComposition = {
    provenance: {
      input: "book.mp3",
      model: "small.en",
      wordTimestamps: false,
      generated: "2026-02-20T00:00:00.000Z",
      elapsedMs: 2000,
      segments: 2,
      durationSec: 20,
    },
    segments: [
      {
        provenance: {
          input: "book-seg00.wav",
          model: "small.en",
          wordTimestamps: false,
          generated: "2026-02-20T00:00:00.000Z",
          elapsedMs: 1000,
          segment: 0,
          startSec: 0,
        },
        cues: [
          { startTime: "00:00:00.000", endTime: "00:00:05.000", text: "A" },
          { startTime: "00:00:05.000", endTime: "00:00:10.000", text: "B" },
        ],
      },
      {
        provenance: {
          input: "book-seg01.wav",
          model: "small.en",
          wordTimestamps: false,
          generated: "2026-02-20T00:00:00.000Z",
          elapsedMs: 1000,
          segment: 1,
          startSec: 10,
        },
        cues: [
          { startTime: "00:00:10.000", endTime: "00:00:15.000", text: "C" },
          { startTime: "00:00:15.000", endTime: "00:00:20.000", text: "D" },
        ],
      },
    ],
  };

  test("includes composition header provenance", () => {
    const text = formatComposition(composition);
    expect(text).toContain('"segments":2');
    expect(text).toContain('"input":"book.mp3"');
  });

  test("includes per-segment provenance notes", () => {
    const text = formatComposition(composition);
    expect(text).toContain('"segment":0');
    expect(text).toContain('"segment":1');
  });

  test("segment provenance appears before its cues", () => {
    const text = formatComposition(composition);
    const seg0Prov = text.indexOf('"segment":0');
    const cueA = text.indexOf("00:00:00.000 --> 00:00:05.000");
    const seg1Prov = text.indexOf('"segment":1');
    const cueC = text.indexOf("00:00:10.000 --> 00:00:15.000");
    expect(seg0Prov).toBeLessThan(cueA);
    expect(seg1Prov).toBeLessThan(cueC);
  });

  test("roundtrips through parseComposition", () => {
    const text = formatComposition(composition);
    const { value } = parseComposition(text);
    expect(value.provenance.segments).toBe(2);
    expect(value.provenance.elapsedMs).toBe(2000);
    expect(value.provenance.durationSec).toBe(20);
    expect(value.segments).toHaveLength(2);
    expect(value.segments[0]?.provenance.segment).toBe(0);
    expect(value.segments[0]?.cues).toHaveLength(2);
    expect(value.segments[1]?.provenance.segment).toBe(1);
    expect(value.segments[1]?.cues).toHaveLength(2);
    expect(value.segments[1]?.cues[0]?.text).toBe("C");
  });
});
