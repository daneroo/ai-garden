import { describe, expect, test } from "bun:test";
import { formatDuration, parseDuration } from "../libnu/duration.ts";

describe("parseDuration", () => {
  test("parses hours", () => {
    expect(parseDuration("1h")).toBe(3600);
    expect(parseDuration("2h")).toBe(7200);
    expect(parseDuration("37h")).toBe(133200);
  });

  test("parses minutes", () => {
    expect(parseDuration("1m")).toBe(60);
    expect(parseDuration("30m")).toBe(1800);
    expect(parseDuration("90m")).toBe(5400);
  });

  test("parses seconds", () => {
    expect(parseDuration("1s")).toBe(1);
    expect(parseDuration("30s")).toBe(30);
    expect(parseDuration("90s")).toBe(90);
  });

  test("parses combined formats", () => {
    expect(parseDuration("1h30m")).toBe(5400);
    expect(parseDuration("2h15m30s")).toBe(8130);
    expect(parseDuration("1m30s")).toBe(90);
    expect(parseDuration("1h1s")).toBe(3601);
  });

  test("parses plain numbers as seconds", () => {
    expect(parseDuration("60")).toBe(60);
    expect(parseDuration("3600")).toBe(3600);
    expect(parseDuration("0")).toBe(0);
  });

  test("handles whitespace and case", () => {
    expect(parseDuration(" 1h ")).toBe(3600);
    expect(parseDuration("1H")).toBe(3600);
    expect(parseDuration("1H30M")).toBe(5400);
  });

  test("throws on empty string", () => {
    expect(() => parseDuration("")).toThrow("cannot be empty");
    expect(() => parseDuration("  ")).toThrow("cannot be empty");
  });

  test("throws on invalid format", () => {
    expect(() => parseDuration("abc")).toThrow("Invalid duration format");
    expect(() => parseDuration("1x")).toThrow("Invalid duration format");
    expect(() => parseDuration("h1")).toThrow("Invalid duration format");
    expect(() => parseDuration("1h2")).toThrow("Invalid duration format");
  });
});

describe("formatDuration", () => {
  test("formats hours only", () => {
    expect(formatDuration(3600)).toBe("1h");
    expect(formatDuration(7200)).toBe("2h");
    expect(formatDuration(133200)).toBe("37h");
  });

  test("formats minutes only", () => {
    expect(formatDuration(60)).toBe("1m");
    expect(formatDuration(1800)).toBe("30m");
  });

  test("formats seconds only", () => {
    expect(formatDuration(1)).toBe("1s");
    expect(formatDuration(30)).toBe("30s");
    expect(formatDuration(59)).toBe("59s");
  });

  test("formats combined", () => {
    expect(formatDuration(5400)).toBe("1h30m");
    expect(formatDuration(8130)).toBe("2h15m30s");
    expect(formatDuration(90)).toBe("1m30s");
    expect(formatDuration(3601)).toBe("1h1s");
  });

  test("formats zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  test("throws on negative", () => {
    expect(() => formatDuration(-1)).toThrow("cannot be negative");
  });
});

describe("roundtrip", () => {
  test("parse then format preserves value", () => {
    const values = ["1h", "30m", "45s", "1h30m", "2h15m30s", "0s"];
    for (const v of values) {
      expect(formatDuration(parseDuration(v))).toBe(v);
    }
  });
});
