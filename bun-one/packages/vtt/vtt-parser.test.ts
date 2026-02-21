import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { VttFileSchema as VttFileSchemaValibot } from "./vtt-schema-valibot";
import { VttFileSchema as VttFileSchemaZod } from "./vtt-schema-zod";
import {
  parseComposition,
  parseRaw,
  parseTranscription,
  parseVttFile,
} from "./vtt-parser";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { VttFile } from "./vtt-schema-zod";

const FIXTURES = join(import.meta.dir, "test/fixtures/vtt");

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf-8");
}

// Both zod and valibot implement Standard Schema's ~standard.validate()
// interface, but their concrete types differ. The cast erases the
// library-specific type so the parser only sees the common interface.
// The outer for-loop runs every test block twice — proving the parser
// works identically regardless of which library backs the validation.
const schemas: [string, StandardSchemaV1<unknown, VttFile>][] = [
  ["zod", VttFileSchemaZod as StandardSchemaV1<unknown, VttFile>],
  ["valibot", VttFileSchemaValibot as StandardSchemaV1<unknown, VttFile>],
];

// ---------------------------------------------------------------------------
// Data-driven: same assertions, both schema libraries
// ---------------------------------------------------------------------------

for (const [name, schema] of schemas) {
  describe(`parseVttFile [${name}]`, () => {
    test("transcription — happy path", () => {
      const input = loadFixture("roadNotTaken-transcription-seg00.vtt");
      const { value, warnings } = parseVttFile(input, { schema });
      expect(warnings).toEqual([]);
      expect("provenance" in value).toBe(true);
      expect("cues" in value).toBe(true);
      expect("segments" in value).toBe(false);
      if ("cues" in value) {
        expect(value.cues).toHaveLength(9);
      }
    });

    test("1-segment composition — happy path", () => {
      const input = loadFixture("roadNotTaken-composition-e2e.vtt");
      const { value, warnings } = parseVttFile(input, { schema });
      expect(warnings).toEqual([]);
      expect("segments" in value).toBe(true);
      if ("segments" in value) {
        expect(value.segments).toHaveLength(1);
        expect(value.segments[0]!.cues).toHaveLength(9);
      }
    });

    test("2-segment composition — happy path", () => {
      const input = loadFixture("roadNotTaken-composition-2seg.vtt");
      const { value, warnings } = parseVttFile(input, { schema });
      expect(warnings).toEqual([]);
      if ("segments" in value) {
        expect(value.segments).toHaveLength(2);
        // Seg 0: 6 cues, Seg 1: 3 cues
        expect(value.segments[0]!.cues).toHaveLength(6);
        expect(value.segments[1]!.cues).toHaveLength(3);
      }
    });

    test("raw VTT — no provenance", () => {
      const input = loadFixture("raw-no-provenance.vtt");
      const { value, warnings } = parseVttFile(input, { schema });
      expect(warnings).toEqual([]);
      expect("provenance" in value).toBe(false);
      if ("cues" in value) {
        expect(value.cues).toHaveLength(2);
      }
    });

    test("invalid: STYLE block produces warning", () => {
      const input = loadFixture("invalid-style-block.vtt");
      const { warnings } = parseVttFile(input, { schema, strict: false });
      expect(warnings.some((w) => w.includes("STYLE"))).toBe(true);
    });

    test("invalid: non-provenance note produces warning", () => {
      const input = loadFixture("invalid-non-provenance-note.vtt");
      const { warnings } = parseVttFile(input, { schema, strict: false });
      expect(warnings.some((w) => w.includes("NOTE Provenance"))).toBe(true);
    });

    test("invalid: wrong segment count produces warning", () => {
      const input = loadFixture("invalid-wrong-segment-count.vtt");
      const { warnings } = parseVttFile(input, { schema, strict: false });
      expect(warnings.some((w) => w.includes("Segment count mismatch"))).toBe(
        true,
      );
    });

    test("strict mode throws on convention violations", () => {
      const input = loadFixture("invalid-style-block.vtt");
      expect(() => parseVttFile(input, { schema, strict: true })).toThrow(
        "[VTT PARSE ERRORS]",
      );
    });
  });

  describe(`sugar functions [${name}]`, () => {
    test("parseTranscription narrows type", () => {
      const input = loadFixture("roadNotTaken-transcription-seg00.vtt");
      const result = parseTranscription(input, schema);
      expect(result.provenance.model).toBe("tiny.en");
      expect(result.cues).toHaveLength(9);
    });

    test("parseComposition narrows type", () => {
      const input = loadFixture("roadNotTaken-composition-e2e.vtt");
      const result = parseComposition(input, schema);
      expect(result.provenance.segments).toBe(1);
      expect(result.segments).toHaveLength(1);
    });

    test("parseRaw narrows type", () => {
      const input = loadFixture("raw-no-provenance.vtt");
      const result = parseRaw(input, schema);
      expect(result.cues).toHaveLength(2);
    });

    test("parseTranscription throws on composition input", () => {
      const input = loadFixture("roadNotTaken-composition-e2e.vtt");
      expect(() => parseTranscription(input, schema)).toThrow(
        "Expected VttTranscription",
      );
    });

    test("parseComposition throws on transcription input", () => {
      const input = loadFixture("roadNotTaken-transcription-seg00.vtt");
      expect(() => parseComposition(input, schema)).toThrow(
        "Expected VttComposition",
      );
    });

    test("parseRaw throws on transcription input", () => {
      const input = loadFixture("roadNotTaken-transcription-seg00.vtt");
      expect(() => parseRaw(input, schema)).toThrow("Expected VttRaw");
    });
  });
}
