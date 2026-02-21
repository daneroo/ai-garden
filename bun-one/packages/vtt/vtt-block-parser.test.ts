import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  aggregateBlocks,
  checkNoRegionBlocksConvention,
  checkNoStyleBlocksConvention,
  checkOnlyProvenanceNotesConvention,
  validateBlocks,
  type VttBlock,
} from "./vtt-block-parser";

const FIXTURES = join(import.meta.dir, "test/fixtures/vtt");

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf-8");
}

describe("aggregateBlocks", () => {
  test("transcription fixture", () => {
    const blocks = aggregateBlocks(
      loadFixture("roadNotTaken-transcription-seg00.vtt"),
    );
    expect(blocks[0]!.type).toBe("SIGNATURE");
    expect(blocks[1]!.type).toBe("NOTE");
    expect(blocks[1]!.lines[0]).toStartWith("NOTE Provenance");
    // 9 cues in the transcription
    const cues = blocks.filter((b) => b.type === "CUE");
    expect(cues).toHaveLength(9);
  });

  test("1-segment composition fixture", () => {
    const blocks = aggregateBlocks(
      loadFixture("roadNotTaken-composition-e2e.vtt"),
    );
    expect(blocks[0]!.type).toBe("SIGNATURE");
    // Two NOTE Provenance blocks: composition header + segment 0
    const notes = blocks.filter((b) => b.type === "NOTE");
    expect(notes).toHaveLength(2);
    const cues = blocks.filter((b) => b.type === "CUE");
    expect(cues).toHaveLength(9);
  });

  test("2-segment composition fixture", () => {
    const blocks = aggregateBlocks(
      loadFixture("roadNotTaken-composition-2seg.vtt"),
    );
    const notes = blocks.filter((b) => b.type === "NOTE");
    expect(notes).toHaveLength(3); // composition header + 2 segments
    const cues = blocks.filter((b) => b.type === "CUE");
    expect(cues).toHaveLength(9);
  });

  test("raw VTT (no provenance)", () => {
    const blocks = aggregateBlocks(loadFixture("raw-no-provenance.vtt"));
    expect(blocks[0]!.type).toBe("SIGNATURE");
    expect(blocks.filter((b) => b.type === "NOTE")).toHaveLength(0);
    expect(blocks.filter((b) => b.type === "CUE")).toHaveLength(2);
  });

  test("throws on empty input", () => {
    expect(() => aggregateBlocks("")).toThrow("[FATAL] Empty VTT file.");
  });

  test("throws on missing WEBVTT signature", () => {
    expect(() => aggregateBlocks("NOT A VTT FILE")).toThrow(
      "File must start with 'WEBVTT'",
    );
  });

  test("detects STYLE blocks", () => {
    const blocks = aggregateBlocks(loadFixture("invalid-style-block.vtt"));
    expect(blocks.filter((b) => b.type === "STYLE")).toHaveLength(1);
  });
});

describe("block checkers", () => {
  test("checkNoStyleBlocksConvention — clean file", () => {
    const blocks = aggregateBlocks(
      loadFixture("roadNotTaken-transcription-seg00.vtt"),
    );
    expect(checkNoStyleBlocksConvention(blocks)).toEqual([]);
  });

  test("checkNoStyleBlocksConvention — catches STYLE", () => {
    const blocks = aggregateBlocks(loadFixture("invalid-style-block.vtt"));
    const warnings = checkNoStyleBlocksConvention(blocks);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("STYLE block not allowed");
  });

  test("checkNoRegionBlocksConvention — clean file", () => {
    const blocks: VttBlock[] = [
      { type: "SIGNATURE", lines: ["WEBVTT"] },
      { type: "CUE", lines: ["00:00:00.000 --> 00:00:01.000", "text"] },
    ];
    expect(checkNoRegionBlocksConvention(blocks)).toEqual([]);
  });

  test("checkNoRegionBlocksConvention — catches REGION", () => {
    const blocks: VttBlock[] = [
      { type: "SIGNATURE", lines: ["WEBVTT"] },
      { type: "REGION", lines: ["REGION id=fred"] },
    ];
    const warnings = checkNoRegionBlocksConvention(blocks);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("REGION block not allowed");
  });

  test("checkOnlyProvenanceNotesConvention — clean file", () => {
    const blocks = aggregateBlocks(
      loadFixture("roadNotTaken-composition-e2e.vtt"),
    );
    expect(checkOnlyProvenanceNotesConvention(blocks)).toEqual([]);
  });

  test("checkOnlyProvenanceNotesConvention — catches non-provenance note", () => {
    const blocks = aggregateBlocks(
      loadFixture("invalid-non-provenance-note.vtt"),
    );
    const warnings = checkOnlyProvenanceNotesConvention(blocks);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('Only "NOTE Provenance" notes are allowed');
  });
});

describe("validateBlocks", () => {
  const allCheckers = [
    checkNoStyleBlocksConvention,
    checkNoRegionBlocksConvention,
    checkOnlyProvenanceNotesConvention,
  ];

  test("happy path — no warnings", () => {
    const blocks = aggregateBlocks(
      loadFixture("roadNotTaken-transcription-seg00.vtt"),
    );
    expect(validateBlocks(blocks, allCheckers, false)).toEqual([]);
  });

  test("strict mode throws on violations", () => {
    const blocks = aggregateBlocks(loadFixture("invalid-style-block.vtt"));
    expect(() => validateBlocks(blocks, allCheckers, true)).toThrow(
      "[FATAL BLOCKS]",
    );
  });

  test("lenient mode collects without throwing", () => {
    const blocks = aggregateBlocks(loadFixture("invalid-style-block.vtt"));
    const warnings = validateBlocks(blocks, allCheckers, false);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
