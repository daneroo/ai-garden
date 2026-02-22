import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseVtt } from "./vtt-parser";

const FIXTURES = join(import.meta.dir, "test/fixtures/vtt");

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf-8");
}

// Run every test twice — proving the parser works identically
// regardless of which schema library backs the validation.
const schemaImpls = ["zod", "valibot"] as const;

for (const impl of schemaImpls) {
  describe(`parseVtt [${impl}]`, () => {
    test("transcription — happy path", () => {
      const { value, warnings } = parseVtt(
        loadFixture("roadNotTaken-transcription-seg00.vtt"),
        { schema: impl },
      );
      expect(warnings).toEqual([]);
      expect(value.type).toBe("transcription");
      if (value.type === "transcription") {
        expect(value.value.cues).toHaveLength(9);
        expect(value.value.provenance.model).toBe("tiny.en");
      }
    });

    test("1-segment composition — happy path", () => {
      const { value, warnings } = parseVtt(
        loadFixture("roadNotTaken-composition-e2e.vtt"),
        { schema: impl },
      );
      expect(warnings).toEqual([]);
      expect(value.type).toBe("composition");
      if (value.type === "composition") {
        expect(value.value.segments).toHaveLength(1);
        expect(value.value.segments[0]!.cues).toHaveLength(9);
        expect(value.value.provenance.segments).toBe(1);
      }
    });

    test("2-segment composition — happy path", () => {
      const { value, warnings } = parseVtt(
        loadFixture("roadNotTaken-composition-2seg.vtt"),
        { schema: impl },
      );
      expect(warnings).toEqual([]);
      if (value.type === "composition") {
        expect(value.value.segments).toHaveLength(2);
        expect(value.value.segments[0]!.cues).toHaveLength(6);
        expect(value.value.segments[1]!.cues).toHaveLength(3);
      }
    });

    test("raw VTT — no provenance", () => {
      const { value, warnings } = parseVtt(
        loadFixture("raw-no-provenance.vtt"),
        { schema: impl },
      );
      expect(warnings).toEqual([]);
      expect(value.type).toBe("raw");
      if (value.type === "raw") {
        expect(value.value.cues).toHaveLength(2);
      }
    });

    test("invalid: STYLE block produces warning", () => {
      const { warnings } = parseVtt(loadFixture("invalid-style-block.vtt"), {
        schema: impl,
      });
      expect(warnings.some((w) => w.includes("STYLE"))).toBe(true);
    });

    test("invalid: non-provenance note produces warning", () => {
      const { warnings } = parseVtt(
        loadFixture("invalid-non-provenance-note.vtt"),
        { schema: impl },
      );
      expect(warnings.some((w) => w.includes("NOTE Provenance"))).toBe(true);
    });

    test("invalid: wrong segment count produces warning", () => {
      const { warnings } = parseVtt(
        loadFixture("invalid-wrong-segment-count.vtt"),
        { schema: impl },
      );
      expect(warnings.some((w) => w.includes("Segment count mismatch"))).toBe(
        true,
      );
    });

    test("strict mode throws on convention violations", () => {
      const input = loadFixture("invalid-style-block.vtt");
      expect(() => parseVtt(input, { schema: impl, strict: true })).toThrow(
        "[VTT PARSE ERRORS]",
      );
    });

    test("overlapping cues produce monotonicity warning", () => {
      const input = [
        "WEBVTT",
        "",
        "00:00:00.000 --> 00:00:10.000",
        "First cue",
        "",
        "00:00:09.000 --> 00:00:20.000",
        "Overlapping cue",
        "",
      ].join("\n");
      const { warnings } = parseVtt(input, { schema: impl });
      expect(warnings.some((w) => w.includes("Monotonicity"))).toBe(true);
      expect(warnings.some((w) => w.includes("1 violation(s)"))).toBe(true);
    });

    test("classifyVttFile returns correct type for each artifact", () => {
      const transcription = parseVtt(
        loadFixture("roadNotTaken-transcription-seg00.vtt"),
        { schema: impl },
      );
      expect(transcription.value.type).toBe("transcription");

      const composition = parseVtt(
        loadFixture("roadNotTaken-composition-e2e.vtt"),
        { schema: impl },
      );
      expect(composition.value.type).toBe("composition");

      const raw = parseVtt(loadFixture("raw-no-provenance.vtt"), {
        schema: impl,
      });
      expect(raw.value.type).toBe("raw");
    });
  });
}
