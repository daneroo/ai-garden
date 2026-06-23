# EPUB Inspect Refactor Plan

Date: 2026-06-22

## Status

`PLANNING — not started`

## Context

The three-parser feasibility experiment (Gates 1–5, completed 2026-06-22)
proved that the runner infrastructure is sound but the comparison architecture
is wrong. Baking three specific parsers and a 3-way comparison into a single
monolithic run does not scale: adding a fourth parser requires touching the
comparison logic everywhere, and there is no clean way to express "compare
these two parsers on this subset of books."

The old `epub-split/lib/` code had the right architecture: a `ParserResult`
schema that any parser fills, and a generic `compareBook(a, b)` that works on
any two results. It was abandoned because of the wrong toolchain (pnpm/tsx,
epubjs) and lack of schema validation. The refactor recombines:

- **Infrastructure from inspect/**: Bun, subprocess isolation, jsdom fallback,
  Playwright harness, atomic deterministic reports, corpus discovery + hashing.
- **Architecture from epub-split/lib/**: parser-agnostic output schema, generic
  two-parser comparison, element-specific warning types (names informed by the
  old ComparisonWarning taxonomy, structure is not).

## Goals

1. A versioned, Zod-validated **parser output schema** that any adapter fills.
2. A versioned, Zod-validated **comparison output schema** — element-specific
   typed warnings composable into a higher-level view, generic over any two
   parser outputs.
3. A single invocation that runs all configured parsers and comparison pairs.
4. A corpus module that hides deduplication and subset selection behind a clean
   interface.

## Parser Output Schema

The schema has two top-level sections.

### Meta (provenance and parameters)

```ts
{
  schemaVersion: number;
  parser: "epubts-browser" | "epubts-node" | "storyteller";
  parserVersion: string;       // package version
  domParser?: "linkedom" | "jsdom"; // epubts-node only
  openStatus: "opened" | "open-failed" | "epub2-unsupported";
  openFailure?: { stage: string; category: string; message: string };
}
```

`epub2-unsupported` is a first-class status for Storyteller (not an error —
expected behavior for EPUB 2 books). This allows the comparison layer to reason
about it cleanly without special-casing parser names.

### Content (pure book data — parser-agnostic)

Fields are populated only when `openStatus === "opened"`. Each field is
optional at the schema level; a missing field means the parser did not expose
it, not that the book lacks it.

```ts
{
  metadata?: {
    title: string | null;
    creator: string | null;
    date: string | null;
    language: string | null;
    publisher: string | null;
    identifier: string | null;
  };
  manifest?: ManifestItem[];   // { id, href, mediaType, properties? }
  spine?: SpineItem[];         // { idref, href, linear }
  toc?: TocEntry[];            // { id, href, label, children? } — recursive
  // content (per-spine XHTML): deferred to a later gate
}
```

Zod validates both sections. Schema version increments whenever a field is
added or changed.

## Comparison Output Schema

The runner decides whether comparison is possible by inspecting
`ParserOutput.meta.openStatus` for both inputs **before** invoking the
comparator. Open failures and `epub2-unsupported` are runner-level concerns;
they never enter the comparison layer. A comparator only receives two
successfully-opened outputs.

`compareBook(a: ParserOutput, b: ParserOutput): ComparisonResult`

Each content section owns its own typed warnings. Warnings are not a global
flat list — they are element-specific and composable. The presentation layer
projects them onto whatever summary view is needed.

```ts
// Sketch — exact types defined gate by gate as content sections are added
interface ComparisonResult {
  schemaVersion: number;
  parserA: string;          // carried from meta for reporting only
  parserB: string;
  metadata?: MetadataComparison;
  manifest?: ManifestComparison;
  spine?: SpineComparison;
  toc?: TocComparison;
  // content: deferred
}

interface SpineComparison {
  warnings: SpineWarning[];
}
type SpineWarning =
  | { type: "length"; a: number; b: number }
  | { type: "idref-mismatch"; index: number; a: string; b: string }
  | { type: "href-mismatch"; index: number; a: string; b: string }
  | { type: "linear-mismatch"; index: number; a: boolean; b: boolean };

// ManifestComparison, TocComparison, etc. follow the same pattern.
// Each is defined only when that gate is implemented.
```

The `ComparisonWarning` taxonomy from `epub-split/lib/types.ts` is a useful
reference for the warning *names* within each element, not a flat global enum
to replicate. The structure is progressive: Gate 5 defines `MetadataComparison`
only; later gates add sections without touching existing ones.

**Principle: parsers are completely separate from comparators.** A comparator
receives two `ParserOutput` values and knows nothing about which parser
produced them beyond the name carried in `meta.parser`.

## Corpus Module

The corpus module is the only place that knows about roots, deduplication, and
pair selection. It exposes:

```ts
interface CorpusEntry {
  sha256: string;        // authoritative identity; shortSha derived at display time
  size: number;
  occurrences: DiscoveredBook[];  // all paths, already typed — no new types needed
}

function buildCorpus(options: {
  roots: RootConfig[];
  deduplicate: boolean;  // collapse same-hash books across roots into one entry
}): CorpusEntry[]
```

When `deduplicate: true`, a book with the same SHA256 in both `drop` and
`space` appears as one entry with multiple `occurrences`. The runner picks
which path to open (e.g. first occurrence); the report can show all roots.

`deduplicate: false` processes every occurrence independently (current
behaviour).

## Comparison Pairs

A single invocation runs all parsers and produces both pairs:

```
epubts-node vs epubts-browser  — all corpus entries
epubts-node vs storyteller     — all corpus entries
                                  (epub2-unsupported handled cleanly by schema)
```

These are the two purposeful pairs from the README:
- **node vs browser**: verify the node path is equivalent to the browser path
  (our sanity check — browser is not the pipeline target)
- **node vs storyteller**: validate interoperability for audiobook alignment
  (storyteller is the alignment tool; node is the extraction path)

Additional pairs can be added by configuration without touching comparison
code.

## What Changes vs What Stays

| Stays from inspect/ | Changes |
|---|---|
| Bun toolchain | No baked-in 3-way comparison |
| Subprocess isolation + jsdom fallback | Parser adapters produce `ParserOutput` (Zod); `domParser` field replaces `engine` |
| Playwright harness for browser | Generic `compareBook(a, b)` replaces per-field comparison |
| Atomic report replacement | Corpus module hides dedup logic |
| Deterministic corpus discovery | `ComparisonWarning` taxonomy replaces inline status strings |
| Per-book JSON + Markdown reports | Reports structured around comparison pairs, not parser names |

## Gate Sequence

Gates follow the same protocol as the feasibility experiment: one gate at a
time, full corpus run, Daniel approves before the next gate starts.

| Gate | Scope |
|---|---|
| 1 | Define and Zod-validate `ParserOutput` schema. No parsing. |
| 2 | epubts-node adapter → `ParserOutput` (metadata only, schema v1) |
| 3 | epubts-browser adapter → `ParserOutput` (metadata only) |
| 4 | Storyteller adapter → `ParserOutput` (metadata only, epub2-unsupported) |
| 5 | Generic `compareBook` + `ComparisonWarning` schema (metadata fields only) |
| 6 | Corpus module with dedup; single-invocation runner; pair reports |
| 7 | Expand `ParserOutput` to manifest + spine; expand comparison |
| 8 | Expand to TOC |
| 9 | Expand to chapter content (raw → canonical → text) |

Each gate runs the full corpus. Scope expands one content section at a time so
findings remain attributable.

## Open Questions (resolve before Gate 1)

1. **Directory restructure first?** — promote `epub-split/inspect/` to
   `epub-inspect/` before starting. Low risk without a context move; worth
   doing cleanly before new source files are created.

2. **Keep existing reports?** — the current `reports/` reflects the old schema.
   Gate 1 will reset the report schema; old reports become historical evidence
   only.

3. **Parser scope** — does epubts-browser stay long-term, or does it graduate
   to "sanity-check only" and eventually drop? Decision can wait until Gate 6
   evidence is in.
