import { describe, expect, test } from "bun:test";
import {
  buildWavSequence,
  buildTranscribeSequence,
  type WavSegment,
  type TranscribeSegment,
} from "./simpler.ts";

type WavCase = [string, number, number, WavSegment[]];

describe("buildWavSequence", () => {
  // prettier-ignore
  const cases: WavCase[] = [
    // [name, audioDuration, segDurationSec, expected]
    ["single segment", 100, 100, [
      { startSec: 0, durationSec: 0 },
    ]],
    ["exact division", 120, 40, [
      { startSec: 0, durationSec: 40 },
      { startSec: 40, durationSec: 40 },
      { startSec: 80, durationSec: 0 },
    ]],
    ["with remainder", 100, 40, [
      { startSec: 0, durationSec: 40 },
      { startSec: 40, durationSec: 40 },
      { startSec: 80, durationSec: 0 },
    ]],
    ["tiny tail absorbed (remainder < 2s)", 1800.5, 900, [
      { startSec: 0, durationSec: 900 },
      { startSec: 900, durationSec: 0 },
    ]],
    ["segDurationSec larger than audio", 50, 200, [
      { startSec: 0, durationSec: 0 },
    ]],
  ];

  for (const [name, audioDur, segDur, expected] of cases) {
    test(name, () => {
      expect(buildWavSequence(audioDur, segDur)).toEqual(expected);
    });
  }
});

// Shared 3-segment layout for transcribe tests
const threeSegs: WavSegment[] = [
  { startSec: 0, durationSec: 40 },
  { startSec: 40, durationSec: 40 },
  { startSec: 80, durationSec: 0 },
];

type TranscribeCase = [string, WavSegment[], number, TranscribeSegment[]];

describe("buildTranscribeSequence", () => {
  // prettier-ignore
  const cases: TranscribeCase[] = [
    // [name, wavSegs, configDurationSec, expected]
    ["no duration limit (all full)", threeSegs, 0, [
      { segIndex: 0, durationMs: 0 },
      { segIndex: 1, durationMs: 0 },
      { segIndex: 2, durationMs: 0 },
    ]],
    ["within first segment", threeSegs, 20, [
      { segIndex: 0, durationMs: 20000 },
    ]],
    ["spanning segments", threeSegs, 50, [
      { segIndex: 0, durationMs: 0 },
      { segIndex: 1, durationMs: 10000 },
    ]],
    ["at exact boundary", threeSegs, 40, [
      { segIndex: 0, durationMs: 40000 },
    ]],
    ["single segment with duration", [{ startSec: 0, durationSec: 0 }], 30, [
      { segIndex: 0, durationMs: 30000 },
    ]],
  ];

  for (const [name, wavSegs, configDur, expected] of cases) {
    test(name, () => {
      expect(buildTranscribeSequence(wavSegs, configDur)).toEqual(expected);
    });
  }
});
