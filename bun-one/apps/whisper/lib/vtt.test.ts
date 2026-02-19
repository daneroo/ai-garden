import { afterAll, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  parseVtt,
  parseVttFile,
  readVttFile,
  type VttProvenance,
} from "../lib/vtt.ts";
import { writeVtt } from "../lib/vtt-stitch.ts";

let tempDir = "";

describe("vtt parsing with provenance", () => {
  test("parseVttFile extracts cues and NOTE Provenance blocks", () => {
    const vtt = `WEBVTT

NOTE NotProvenance
hello

NOTE Provenance
{"input":"book.mp3","model":"tiny.en","wordTimestamps":false,"generated":"2026-02-03T00:00:00.000Z","durationSec":0,"elapsedMs":123}

NOTE Provenance
{"input":"book-seg00.wav","model":"tiny.en","wordTimestamps":false,"generated":"2026-02-03T00:00:00.000Z","durationSec":0,"elapsedMs":120,"segment":0,"startSec":0}

00:00:00.000 --> 00:00:02.000
Hello world
`;

    const result = parseVttFile(vtt);
    expect(result.cues).toHaveLength(1);
    expect(result.provenance).toHaveLength(2);
    expect(result.provenance[0]).toMatchObject({ input: "book.mp3" });
    expect(result.provenance[1]).toMatchObject({ segment: 0, startSec: 0 });
  });

  test("parseVttFile ignores malformed provenance payloads", () => {
    const vtt = `WEBVTT

NOTE Provenance
{"segment": 1, "startSec":

00:00:00.000 --> 00:00:01.000
Hi
`;

    const result = parseVttFile(vtt);
    expect(result.cues).toHaveLength(1);
    expect(result.provenance).toHaveLength(0);
  });

  test("parseVtt keeps cue-only compatibility", () => {
    const vtt = `WEBVTT

NOTE Provenance
{"segment":0,"startSec":0}

00:00:00.000 --> 00:00:01.000
Alpha
`;

    const cues = parseVtt(vtt);
    expect(cues).toEqual([
      {
        startTime: "00:00:00.000",
        endTime: "00:00:01.000",
        text: "Alpha",
      },
    ]);
  });

  test("write/read roundtrip preserves provenance", async () => {
    if (!tempDir) {
      tempDir = await mkdtemp(join(tmpdir(), "whisper-vtt-test-"));
    }

    const path = join(tempDir, "roundtrip.vtt");
    const provenance: VttProvenance[] = [
      {
        input: "book.mp3",
        model: "tiny.en",
        wordTimestamps: false,
        generated: "2026-02-03T00:00:00.000Z",
        durationSec: 0,
        elapsedMs: 246,
      },
      {
        segment: 0,
        startSec: 0,
        input: "book-seg00.wav",
        model: "tiny.en",
        wordTimestamps: false,
        generated: "2026-02-03T00:00:00.000Z",
        durationSec: 0,
        elapsedMs: 123,
      },
      {
        segment: 1,
        startSec: 30,
        input: "book-seg01.wav",
        model: "tiny.en",
        wordTimestamps: false,
        generated: "2026-02-03T00:00:30.000Z",
        durationSec: 0,
        elapsedMs: 123,
      },
    ];

    await writeVtt(
      path,
      [
        { startTime: "00:00:00.000", endTime: "00:00:01.000", text: "A" },
        { startTime: "00:00:30.000", endTime: "00:00:31.000", text: "B" },
      ],
      {
        provenance,
        segmentBoundaries: [
          { segment: 0, cueIndex: 0 },
          { segment: 1, cueIndex: 1 },
        ],
      },
    );

    const parsed = await readVttFile(path);
    expect(parsed.cues).toHaveLength(2);
    expect(parsed.provenance).toHaveLength(3);
    expect(parsed.provenance[0]).toMatchObject({ input: "book.mp3" });
    expect(parsed.provenance[1]).toMatchObject({ segment: 0, startSec: 0 });
    expect(parsed.provenance[2]).toMatchObject({ segment: 1, startSec: 30 });
  });

  test("roundtrip preserves elapsedMs and wordTimestamps in header provenance", async () => {
    if (!tempDir) {
      tempDir = await mkdtemp(join(tmpdir(), "whisper-vtt-test-"));
    }

    const path = join(tempDir, "roundtrip-extended.vtt");
    const provenance: VttProvenance[] = [
      {
        input: "seg00.wav",
        model: "tiny.en",
        wordTimestamps: false,
        durationSec: 0,
        elapsedMs: 1234,
        generated: "2026-02-03T00:00:00.000Z",
      },
    ];

    await writeVtt(
      path,
      [{ startTime: "00:00:00.000", endTime: "00:00:01.000", text: "Hello" }],
      { provenance },
    );

    const parsed = await readVttFile(path);
    expect(parsed.provenance).toHaveLength(1);
    expect(parsed.provenance[0]).toMatchObject({
      input: "seg00.wav",
      model: "tiny.en",
      wordTimestamps: false,
      elapsedMs: 1234,
      generated: "2026-02-03T00:00:00.000Z",
    });
  });

  test("roundtrip preserves durationSec when present", async () => {
    if (!tempDir) {
      tempDir = await mkdtemp(join(tmpdir(), "whisper-vtt-test-"));
    }

    const path = join(tempDir, "roundtrip-duration.vtt");
    const provenance: VttProvenance[] = [
      {
        input: "seg02.wav",
        model: "base.en",
        wordTimestamps: true,
        durationSec: 30,
        elapsedMs: 5678,
        generated: "2026-02-03T12:00:00.000Z",
      },
    ];

    await writeVtt(
      path,
      [{ startTime: "00:00:00.000", endTime: "00:00:02.000", text: "World" }],
      { provenance },
    );

    const parsed = await readVttFile(path);
    expect(parsed.provenance).toHaveLength(1);
    expect(parsed.provenance[0]).toMatchObject({
      input: "seg02.wav",
      model: "base.en",
      wordTimestamps: true,
      durationSec: 30,
      elapsedMs: 5678,
    });
  });

  test("parseVttFile converts legacy durationMs to durationSec", () => {
    const vtt = `WEBVTT

NOTE Provenance
{"input":"legacy.wav","model":"tiny.en","wordTimestamps":false,"generated":"2026-02-03T00:00:00.000Z","durationMs":30000,"elapsedMs":99}

00:00:00.000 --> 00:00:01.000
Legacy
`;

    const result = parseVttFile(vtt);
    expect(result.provenance).toHaveLength(1);
    expect(result.provenance[0]).toMatchObject({
      input: "legacy.wav",
      durationSec: 30,
      elapsedMs: 99,
    });
  });

  test("writeVtt omits durationSec when value is zero", async () => {
    if (!tempDir) {
      tempDir = await mkdtemp(join(tmpdir(), "whisper-vtt-test-"));
    }

    const path = join(tempDir, "roundtrip-duration-zero.vtt");
    const provenance: VttProvenance[] = [
      {
        input: "book.mp3",
        model: "tiny.en",
        wordTimestamps: false,
        generated: "2026-02-03T00:00:00.000Z",
        elapsedMs: 200,
        durationSec: 0,
        segments: 1,
      },
      {
        input: "book-seg00.wav",
        model: "tiny.en",
        wordTimestamps: false,
        generated: "2026-02-03T00:00:00.000Z",
        elapsedMs: 200,
        durationSec: 0,
        segment: 0,
        startSec: 0,
      },
    ];

    await writeVtt(
      path,
      [{ startTime: "00:00:00.000", endTime: "00:00:01.000", text: "A" }],
      { provenance, segmentBoundaries: [{ segment: 0, cueIndex: 0 }] },
    );

    const raw = await readFile(path, "utf-8");
    expect(raw).not.toContain('"durationSec":0');
  });
});

afterAll(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});
