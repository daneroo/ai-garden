import { describe, expect, test } from "bun:test";
import { join } from "node:path";

import { parserOutputSchema, type ParserOutput } from "./schema.ts";

const FIXTURE_DIR = join(
  import.meta.dir,
  "..",
  "test",
  "fixtures",
  "parser-outputs"
);

// The committed sample ParserOutputs — one per openStatus and per domParser
// variant. Each must validate and round-trip (strict schema does not transform,
// so the parsed value deep-equals the file).
const SAMPLE_NAMES = [
  "opened-epubts-node-linkedom",
  "opened-epubts-node-jsdom",
  "opened-epubts-browser",
  "opened-storyteller",
  "epub2-unsupported-storyteller",
  "open-failed-storyteller",
] as const;

describe("parserOutputSchema — committed sample fixtures", () => {
  for (const name of SAMPLE_NAMES) {
    test(`${name} is valid and round-trips`, async () => {
      const raw = (await Bun.file(join(FIXTURE_DIR, `${name}.json`)).json()) as unknown;
      const parsed = parserOutputSchema.parse(raw);
      expect(parsed).toEqual(raw as ParserOutput);
      expect(parserOutputSchema.safeParse(parsed).success).toBe(true);
    });
  }
});

// Each entry is a value that violates exactly one schema invariant and must be
// rejected. Written as untyped literals so type-level violations (a stray key,
// a wrong parser/domParser combination) are exercised at runtime by Zod, which
// is the firewall that actually runs in production.
const INVALID_CASES: ReadonlyArray<readonly [string, unknown]> = [
  [
    "opened without content",
    {
      schemaVersion: 5,
      meta: { parser: "epubts-node", parserVersion: "0.6.7", domParser: "linkedom", openStatus: "opened" },
    },
  ],
  [
    "opened carrying openFailure",
    {
      schemaVersion: 5,
      meta: {
        parser: "epubts-node",
        parserVersion: "0.6.7",
        domParser: "linkedom",
        openStatus: "opened",
        openFailure: { category: "X", message: "Y" },
      },
      content: { metadata: { title: "T", creator: "C", date: null }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
  [
    "open-failed without openFailure",
    {
      schemaVersion: 5,
      meta: { parser: "storyteller", parserVersion: "0.6.2", openStatus: "open-failed" },
    },
  ],
  [
    "open-failed carrying content",
    {
      schemaVersion: 5,
      meta: {
        parser: "storyteller",
        parserVersion: "0.6.2",
        openStatus: "open-failed",
        openFailure: { category: "X", message: "Y" },
      },
      content: { metadata: { title: "T", creator: "C", date: null }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
  [
    "epub2-unsupported carrying content",
    {
      schemaVersion: 5,
      meta: { parser: "storyteller", parserVersion: "0.6.2", openStatus: "epub2-unsupported" },
      content: { metadata: { title: "T", creator: "C", date: null }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
  [
    "epub2-unsupported carrying openFailure",
    {
      schemaVersion: 5,
      meta: {
        parser: "storyteller",
        parserVersion: "0.6.2",
        openStatus: "epub2-unsupported",
        openFailure: { category: "X", message: "Y" },
      },
    },
  ],
  [
    "domParser on epubts-browser",
    {
      schemaVersion: 5,
      meta: { parser: "epubts-browser", parserVersion: "0.6.7", domParser: "linkedom", openStatus: "opened" },
      content: { metadata: { title: "T", creator: "C", date: null }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
  [
    "domParser on storyteller",
    {
      schemaVersion: 5,
      meta: { parser: "storyteller", parserVersion: "0.6.2", domParser: "jsdom", openStatus: "opened" },
      content: { metadata: { title: "T", creator: "C", date: null }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
  [
    "domParser when not opened",
    {
      schemaVersion: 5,
      meta: {
        parser: "epubts-node",
        parserVersion: "0.6.7",
        domParser: "linkedom",
        openStatus: "open-failed",
        openFailure: { category: "X", message: "Y" },
      },
    },
  ],
  [
    "openFailure carrying a stage key",
    {
      schemaVersion: 5,
      meta: {
        parser: "storyteller",
        parserVersion: "0.6.2",
        openStatus: "open-failed",
        openFailure: { category: "X", message: "Y", stage: "storyteller-open" },
      },
    },
  ],
  [
    "extra top-level key (wall-clock leak)",
    {
      schemaVersion: 5,
      meta: { parser: "storyteller", parserVersion: "0.6.2", openStatus: "epub2-unsupported" },
      generatedAt: "2026-06-23T22:00:00Z",
    },
  ],
  [
    "extra meta key (hostname leak)",
    {
      schemaVersion: 5,
      meta: { parser: "storyteller", parserVersion: "0.6.2", openStatus: "epub2-unsupported", hostname: "galois" },
    },
  ],
  [
    "extra metadata field (out-of-v1)",
    {
      schemaVersion: 5,
      meta: { parser: "epubts-node", parserVersion: "0.6.7", domParser: "linkedom", openStatus: "opened" },
      content: { metadata: { title: "T", creator: "C", date: null, language: "en" }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
  [
    "metadata missing the date field",
    {
      schemaVersion: 5,
      meta: { parser: "epubts-node", parserVersion: "0.6.7", domParser: "linkedom", openStatus: "opened" },
      content: { metadata: { title: "T", creator: "C" }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
  [
    "empty parserVersion",
    {
      schemaVersion: 5,
      meta: { parser: "storyteller", parserVersion: "", openStatus: "epub2-unsupported" },
    },
  ],
  [
    "unknown parser name",
    {
      schemaVersion: 5,
      meta: { parser: "epubjs", parserVersion: "0.3.0", openStatus: "epub2-unsupported" },
    },
  ],
  [
    "unknown openStatus",
    {
      schemaVersion: 5,
      meta: { parser: "storyteller", parserVersion: "0.6.2", openStatus: "skipped" },
    },
  ],
  [
    "wrong schemaVersion",
    {
      schemaVersion: 4,
      meta: { parser: "storyteller", parserVersion: "0.6.2", openStatus: "epub2-unsupported" },
    },
  ],
  [
    "metadata field of wrong type",
    {
      schemaVersion: 5,
      meta: { parser: "epubts-node", parserVersion: "0.6.7", domParser: "linkedom", openStatus: "opened" },
      content: { metadata: { title: 42, creator: "C", date: null }, spine: [], manifest: [], spineHashes: [], toc: [] },
    },
  ],
];

describe("parserOutputSchema — invariant violations are rejected", () => {
  for (const [label, value] of INVALID_CASES) {
    test(`rejects: ${label}`, () => {
      expect(parserOutputSchema.safeParse(value).success).toBe(false);
    });
  }
});

describe("parserOutputSchema — accepted edge cases", () => {
  test("all three metadata fields may be null; empty spine is valid", () => {
    const value = {
      schemaVersion: 5,
      meta: { parser: "epubts-browser", parserVersion: "0.6.7", openStatus: "opened" },
      content: { metadata: { title: null, creator: null, date: null }, spine: [], manifest: [], spineHashes: [], toc: [] },
    };
    expect(parserOutputSchema.safeParse(value).success).toBe(true);
  });
});
