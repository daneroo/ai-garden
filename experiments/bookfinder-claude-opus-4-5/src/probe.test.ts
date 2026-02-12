import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execSync } from "node:child_process";
import { formatDuration, parseProbeOutput, probeFiles } from "./probe.ts";
import type { ScannedFile } from "./scanner.ts";

describe("formatDuration", () => {
  it("formats zero seconds", () => {
    expect(formatDuration(0)).toBe("00:00:00");
  });

  it("formats seconds only", () => {
    expect(formatDuration(45)).toBe("00:00:45");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("00:02:05");
  });

  it("formats hours, minutes, seconds", () => {
    expect(formatDuration(3661)).toBe("01:01:01");
  });

  it("formats large durations", () => {
    expect(formatDuration(36000)).toBe("10:00:00");
  });

  it("truncates fractional seconds", () => {
    expect(formatDuration(90.7)).toBe("00:01:30");
  });
});

describe("parseProbeOutput", () => {
  const stubFile: ScannedFile = {
    absolutePath: "/tmp/test.mp3",
    relativePath: "test.mp3",
    size: 1000,
  };

  it("parses valid ffprobe JSON", () => {
    const raw = JSON.stringify({
      streams: [{ codec_name: "aac", codec_type: "audio", bit_rate: "128000" }],
      format: {
        duration: "3600.5",
        bit_rate: "128000",
        tags: { title: "My Book", artist: "Author" },
      },
    });

    const result = parseProbeOutput(raw, stubFile);
    expect(result).not.toBeNull();
    expect(result!.duration).toBeCloseTo(3600.5);
    expect(result!.bitrate).toBe(128);
    expect(result!.codec).toBe("aac");
    expect(result!.title).toBe("My Book");
    expect(result!.artist).toBe("Author");
    expect(result!.relativePath).toBe("test.mp3");
    expect(result!.size).toBe(1000);
  });

  it("returns null for invalid JSON", () => {
    expect(parseProbeOutput("not json", stubFile)).toBeNull();
  });

  it("returns null when format is missing", () => {
    expect(parseProbeOutput("{}", stubFile)).toBeNull();
  });

  it("handles missing tags gracefully", () => {
    const raw = JSON.stringify({
      streams: [{ codec_name: "mp3", codec_type: "audio" }],
      format: { duration: "60" },
    });

    const result = parseProbeOutput(raw, stubFile);
    expect(result).not.toBeNull();
    expect(result!.title).toBeNull();
    expect(result!.artist).toBeNull();
  });

  it("falls back to stream duration when format duration missing", () => {
    const raw = JSON.stringify({
      streams: [{ codec_name: "mp3", codec_type: "audio", duration: "120" }],
      format: {},
    });

    const result = parseProbeOutput(raw, stubFile);
    expect(result).not.toBeNull();
    expect(result!.duration).toBe(120);
  });
});

describe("probeFiles", () => {
  let testDir: string;
  let audioFile: string;

  beforeAll(async () => {
    testDir = await mkdtemp(join(tmpdir(), "booktui-probe-"));
    audioFile = join(testDir, "test.mp3");
    execSync(
      `ffmpeg -y -f lavfi -i "sine=frequency=440:duration=1" -metadata title="Probe Test" "${audioFile}"`,
      { stdio: "ignore" },
    );
  });

  afterAll(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("probes a real audio file", async () => {
    const files: ScannedFile[] = [{ absolutePath: audioFile, relativePath: "test.mp3", size: 100 }];

    const { results, errors } = await probeFiles(files, 1);
    expect(errors).toHaveLength(0);
    expect(results).toHaveLength(1);
    expect(results[0]!.codec).toBe("mp3");
    expect(results[0]!.title).toBe("Probe Test");
    expect(results[0]!.duration).toBeGreaterThan(0);
  });

  it("reports errors for non-audio files", async () => {
    const files: ScannedFile[] = [
      { absolutePath: "/tmp/nonexistent-file.mp3", relativePath: "nope.mp3", size: 0 },
    ];

    const { results, errors } = await probeFiles(files, 1);
    expect(results).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("tracks progress via callback", async () => {
    const files: ScannedFile[] = [{ absolutePath: audioFile, relativePath: "test.mp3", size: 100 }];

    const calls: number[] = [];
    await probeFiles(files, 1, (done) => {
      calls.push(done);
    });

    expect(calls.length).toBeGreaterThan(0);
    expect(calls[calls.length - 1]).toBe(1);
  });
});
