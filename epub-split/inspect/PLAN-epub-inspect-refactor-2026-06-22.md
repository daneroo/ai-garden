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
  two-parser comparison, `ComparisonWarning` taxonomy.

## Goals

1. A versioned, Zod-validated **parser output schema** that any adapter fills.
2. A versioned, Zod-validated **comparison output schema** (`ComparisonWarning`
   taxonomy), generic over any two parser outputs.
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

`compareBook(a: ParserOutput, b: ParserOutput): ComparisonResult`

```ts
{
  schemaVersion: number;
  parserA: string;   // from a.meta.parser
  parserB: string;   // from b.meta.parser
  openable: boolean; // false if either parser could not open (incl. epub2-unsupported)
  warnings: ComparisonWarning[];
}
```

`ComparisonWarning` taxonomy (evolves from `epub-split/lib/types.ts`):

```
open.failure           — one or both parsers failed to open
open.epub2-unsupported — storyteller epub2 (expected, not an error)
metadata.field         — specific field differs
manifest.length        — item count differs
manifest.missing       — item present in A, absent in B (or vice versa)
manifest.href          — href differs for same id
manifest.mediaType     — mediaType differs for same id
spine.length           — item count differs
spine.idref            — ordered idref differs
spine.href             — ordered href differs
spine.linear           — linearity flag differs
toc.length             — sibling count differs at a given depth
toc.href               — entry href differs (same position)
toc.label              — entry label differs (same position)
chapter.length         — spine item count extracted differs
chapter.identity       — id or href mismatch at position
chapter.load.failure   — one parser failed to load a chapter
chapter.content.raw    — raw XHTML differs
chapter.content.canonical — canonical DOM differs
chapter.content.text   — normalized text differs
chapter.content.mismatch  — all levels differ
```

The comparison engine has no knowledge of which parsers produced A and B. The
`parserA`/`parserB` fields in the result are carried from the meta sections
for reporting only.

## Corpus Module

The corpus module is the only place that knows about roots, deduplication, and
pair selection. It exposes:

```ts
interface CorpusEntry {
  sha256: string;
  shortSha: string;
  roots: RootOccurrence[];   // which roots this hash appears in
  canonicalPath: string;     // one representative path for opening
  size: number;
}

function buildCorpus(options: {
  roots: RootConfig[];
  deduplicate: boolean;      // collapse drop+space duplicates by hash
}): CorpusEntry[]
```

When `deduplicate: true`, a book with the same SHA256 in both `drop` and
`space` appears once. The `roots` array records all occurrences for
traceability. The comparison run uses the canonical path; the report notes all
roots.

The current behaviour (process every occurrence in every root independently)
remains available via `deduplicate: false`.

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
