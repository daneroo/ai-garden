import { describe, expect, test } from "bun:test";
import {
  buildWavSequence,
  buildTranscribeSequence,
  buildSequences,
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

type TranscribeCase = [string, number, number, number, TranscribeSegment[]];

describe("buildTranscribeSequence", () => {
  // prettier-ignore
  const cases: TranscribeCase[] = [
    // [name, audioDurationSec, segDurationSec, configDurationSec, expected]
    ["no duration limit (all full)", 100, 40, 0, [
      { durationSec: 0 },
      { durationSec: 0 },
      { durationSec: 0 },
    ]],
    ["within first segment", 100, 40, 20, [
      { durationSec: 20 },
    ]],
    ["spanning segments", 100, 40, 50, [
      { durationSec: 0 },
      { durationSec: 10 },
    ]],
    ["at exact boundary", 100, 40, 40, [
      { durationSec: 0 },
    ]],
    ["single segment with duration", 100, 200, 30, [
      { durationSec: 30 },
    ]],
    ["duration beyond audio clamps to full run", 120, 40, 150, [
      { durationSec: 0 },
      { durationSec: 0 },
      { durationSec: 0 },
    ]],
    ["exact boundary after multiple segments", 120, 40, 80, [
      { durationSec: 0 },
      { durationSec: 0 },
    ]],
  ];

  for (const [name, audioDur, segDur, configDur, expected] of cases) {
    test(name, () => {
      expect(buildTranscribeSequence(audioDur, segDur, configDur)).toEqual(
        expected,
      );
    });
  }
});

describe("buildSequences", () => {
  test("spanning segments with cutoff", () => {
    const { wav, trns } = buildSequences(120, 40, 50);
    // prettier-ignore
    expect(wav).toEqual([
      { startSec: 0,  durationSec: 40 },
      { startSec: 40, durationSec: 40 },
    ]);
    expect(trns).toEqual([{ durationSec: 0 }, { durationSec: 10 }]);
  });

  test("no cutoff (full audio)", () => {
    const { wav, trns } = buildSequences(120, 40, 0);
    // prettier-ignore
    expect(wav).toEqual([
      { startSec: 0,  durationSec: 40 },
      { startSec: 40, durationSec: 40 },
      { startSec: 80, durationSec: 0 },
    ]);
    expect(trns).toEqual([
      { durationSec: 0 },
      { durationSec: 0 },
      { durationSec: 0 },
    ]);
  });

  test("duration beyond audio is treated as full run", () => {
    const { wav, trns } = buildSequences(120, 40, 150);
    // prettier-ignore
    expect(wav).toEqual([
      { startSec: 0,  durationSec: 40 },
      { startSec: 40, durationSec: 40 },
      { startSec: 80, durationSec: 0 },
    ]);
    expect(trns).toEqual([
      { durationSec: 0 },
      { durationSec: 0 },
      { durationSec: 0 },
    ]);
  });

  test("exact boundary keeps full sentinel on last transcribe segment", () => {
    const { wav, trns } = buildSequences(120, 40, 80);
    // prettier-ignore
    expect(wav).toEqual([
      { startSec: 0,  durationSec: 40 },
      { startSec: 40, durationSec: 40 },
    ]);
    expect(trns).toEqual([{ durationSec: 0 }, { durationSec: 0 }]);
  });
});
