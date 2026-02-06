import { describe, expect, test } from "bun:test";
import { segment } from "./simpler.ts";

type TestCase = [string, number, number, ReturnType<typeof segment>];

describe("segment", () => {
  // prettier-ignore
  const cases: TestCase[] = [
    // case name                           dur  seg
    ["generates correct segment metadata", 250, 100, [
      { i: 0, start: 0, end: 100 },
      { i: 1, start: 100, end: 200 },
      { i: 2, start: 200, end: 300 },
    ]],
    ["handles single segment case (segmentSec=0)", 100, 0, [
      { i: 0, start: 0, end: 0 },
    ]],
    ["handles single segment case (segmentSec > audioDuration)", 100, 200, [
      { i: 0, start: 0, end: 200 },
    ]],
    ["calculates segment count correctly (rounding up)", 25, 10, [
      { i: 0, start: 0, end: 10 },
      { i: 1, start: 10, end: 20 },
      { i: 2, start: 20, end: 30 },
    ]],
  ];

  for (const [name, duration, segSec, expected] of cases) {
    test(name, () => {
      const s = segment(duration, segSec);
      expect(s).toEqual(expected);
    });
  }
});
