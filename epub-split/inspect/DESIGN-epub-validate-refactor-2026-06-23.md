# EPUB Validate Refactor Design

Date: 2026-06-23

Companion plan (tracked tasks, gates, verifiable outcomes):
`PLAN-epub-validate-refactor-2026-06-23.md`

This document is the architecture: schemas, principles, structure. It answers
*what* and *why*. The plan answers *how* and *in what order*, and tracks
progress.

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

- **Infrastructure from epub-split/inspect/**: Bun, subprocess isolation, jsdom fallback,
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

`schemaVersion` is **top-level**; `meta` and `content` are the two sections.

```ts
{
  schemaVersion: number;       // bumped when any field is added or changed
  meta: Meta;
  content?: Content;           // present iff meta.openStatus === "opened"
}
```

### Meta (provenance and parameters)

```ts
interface Meta {
  parser: "epubts-browser" | "epubts-node" | "storyteller";
  parserVersion: string;       // see invariants for the exact source per parser
  domParser?: "linkedom" | "jsdom"; // epubts-node only, only when opened
  openStatus: "opened" | "open-failed" | "epub2-unsupported";
  openFailure?: { category: string; message: string };
}
```

There is no `stage` field. The browser path has two phases (transport, then
open), but a transport failure means *we* could not deliver bytes to the parser
— it is a harness/infrastructure failure, not the parser's verdict on the book,
so it aborts the run (loudly) rather than being recorded as a per-book
`open-failed`. `openStatus` is therefore a pure parser verdict, and `openFailure`
carries only the parser's own error name and message (which may hint at
transport trouble if it ever surfaces).

`epub2-unsupported` is a first-class status for Storyteller (not an error —
expected behavior for EPUB 2 books). This lets the runner reason about it
cleanly without special-casing parser names.

### Content (pure book data — parser-agnostic)

`content` is **present iff `openStatus === "opened"`**. v1 content is **three
metadata fields only** — `title`, `creator`, `date` — each **required and
nullable** (`string | null`). `null` means "this parser exposed no value"; there
is no "field absent" state at v1, which keeps "parser did not expose" distinct
from "schema does not yet model it".

The other Dublin Core fields (language, publisher, identifier, …) are
deliberately **out of v1**: they proved too unreliable across parsers to be
worth comparing, and that unreliability is itself a finding. Later content
sections (manifest/spine/toc/chapters) are added as optional top-level keys in
later schema versions — absence then means "not modelled by this schema version
yet".

```ts
interface Content {
  metadata: {                  // required when content is present
    title: string | null;
    creator: string | null;
    date: string | null;
  };
  manifest?: ManifestItem[];   // added in a later schema version
  spine?: SpineItem[];
  toc?: TocEntry[];
  // chapters (per-spine XHTML): deferred to a later gate
}
```

### Schema invariants (enforced by Zod refinements)

- `openStatus: "opened"` ⇒ `content` present, `openFailure` absent.
- `openStatus: "open-failed"` ⇒ `openFailure` present, `content` absent.
- `openStatus: "epub2-unsupported"` ⇒ `content` absent, `openFailure` absent
  (the status is self-describing; Storyteller's message is constant — no
  per-book reason is stored).
- `domParser` present ⇒ `parser === "epubts-node"` and `openStatus === "opened"`.
- `parserVersion` source is exact: epub.ts paths use the library's runtime
  `ePub.VERSION`; storyteller uses the installed `@storyteller-platform/epub`
  package version read at runtime. Never hardcoded.

Zod validates the whole object. Schema version increments whenever a field is
added or changed.

### Assembly and the schema firewall

The three adapters run in different runtimes (in-page browser IIFE; node and
storyteller subprocesses), so each returns only a **minimal raw open-result**
— `{ openStatus, metadata | null, parserVersion, openFailure? }` — in whatever
shape is natural for it (the in-page bundle stays tiny and validation-free).
A single shared host-side `buildParserOutput(parser, sha, openResult)` is the
**one place** that assembles the full object (adds parser name, sha,
schemaVersion) and Zod-validates it. Adapters are not contorted to fit a common
shape beyond that minimal contract.

This boundary is the **firewall**: every parser-specific mess (the LinkeDOM
hang, jsdom fallback, subprocess kills, raw-vs-decoded entities) stays sealed
behind `ParserOutput`. Everything downstream — comparison, reporting — only ever
sees clean, validated data and never knows how it was produced.

### Determinism: no wall-clock provenance

Provenance lives in two places — `parserVersion` in each `meta` (the output is
self-describing) and a full block in `run.json` (runner version, `Bun.version`,
Chromium version, package set, roots, inventory). Neither may contain a
timestamp, hostname, or any run-instant value, or the byte-identical-rerun
invariant breaks. (This is different from the `shortSha` anti-pattern: a version
is genuine provenance, not a value derivable from a sibling field.)

## Comparison Output Schema

The runner decides whether comparison is possible by inspecting
`ParserOutput.meta.openStatus` for both inputs **before** invoking the
comparator. Open failures and `epub2-unsupported` are runner-level concerns;
they never enter the comparison layer. A comparator only receives two
successfully-opened outputs.

`compareBook(a: ParserOutput, b: ParserOutput): ComparisonResult`

```ts
interface ComparisonResult {
  schemaVersion: number;    // top-level, independent of ParserOutput's
  parserA: string;          // carried from meta for reporting only
  parserB: string;
  metadata?: MetadataComparison;
  manifest?: ManifestComparison;
  spine?: SpineComparison;
  toc?: TocComparison;
  // chapters: deferred
}
```

Each content section owns its own typed warnings — element-specific and
composable, never a flat global enum.

### Pairwise field status (retires the old 8-way taxonomy)

The old three-way taxonomy (`all-agree` / `node-differs` / `all-differ` / …)
is **retired** — it only existed because comparison was baked as 3-way. A
pairwise comparator produces, per field, one of five statuses:

```ts
type PairFieldStatus =
  | "agree"        // both present, equal
  | "differ"       // both present, unequal
  | "a-only"       // a present, b null
  | "b-only"       // a null, b present
  | "both-null";   // neither present
```

`MetadataComparison` is `{ title, creator, date }` (the v1 fields), each a
record carrying `{ status, a, b }` where `a`/`b` are the values from
`parserA`/`parserB`. Per-pair histograms count these statuses per field.
(`a`/`b` are schema-internal; human-readable reports name the parsers explicitly
— see "Human-readable rendering".)

### Equality is exact-lexical; cleanup belongs to the adapter

`compareField` does a dumb exact `===` on the two values. It **never** massages
values to force agreement — no entity decoding, no whitespace collapsing, no
case folding. This is deliberate: storyteller returns raw entities
(`Centaur&#x2019;s`) where epub.ts decodes them (`Centaur's`), and that
raw-vs-decoded gap is a genuine, attributable interoperability fact the tool
exists to surface; normalizing it away would hide it (and would break parity,
which was computed lexically).

The only value cleanup that happens is *per-parser, at extraction time, in the
adapter* — e.g. epub.ts's `0101-01-01T00:00:00+00:00` zero-date becomes `null`
in the `ParserOutput` because that is what the value *means* for that parser.
The comparator sees only the cleaned-but-not-cross-normalized values. Semantic
equality (decode-then-compare) is explicitly a *later* layer, added when we
actually use the parser; v1 does the minimum so we can see exactly what each
parser yields.

### Parity projection (validation only)

Comparison runs **only when both inputs are `opened`**, so each pair's
population is the books both parsers opened (node×browser = all books;
node×storyteller = the EPUB 3 share). Parity does **not** reconstruct the old
8-way histogram. The metric is the per-field **mismatch count**:

```
mismatch = differ + a-only + b-only      (everything that is not agree/both-null)
```

The baseline's per-field statuses collapse onto the two pairs:

- **node×browser** mismatch = baseline rows where node ≠ browser
  (`node-differs` + `browser-differs` + `all-differ` + `browser-node-differ`);
  this bundles present-vs-present (`differ`) and present-vs-null (`a-only`/
  `b-only`). Worked example (title, last-known): 2 + 0 + 2 + 5 = **9**; the
  entity-truncation books are inside this set.
- **node×storyteller** mismatch (over the EPUB 3 both-opened share) = baseline
  rows where node ≠ storyteller (`node-differs` + `storyteller-differs` +
  `all-differ`). Worked example (title): 2 + 0 + 2 = **4**.

Pairwise node×browser + node×storyteller cannot, by construction, distinguish
`node-differs` from `all-differ` (that needs browser×storyteller, which we do
not run). That distinction is a discarded 3-way artifact, not a parity loss:
both collapse to "node mismatches its partner", which is what we care about.

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
which path to open (first occurrence in root scan order); the report shows all
roots.

`deduplicate: false` preserves **occurrence-level inventory and parity counts**
(the `index.md` denominators list every occurrence). It does **not** force
re-parsing: parser outputs stay content-addressed and are reused per `sha256`
(see below). `deduplicate: true` additionally collapses the *inventory* to one
row per `sha256`.

**`deduplicate: false` is the default** until metadata parity is fully
reconciled (through the comparator gate), because the Gate 0 baseline is counted
by occurrence; flipping the default would move the denominator. Either way,
parsing runs once per distinct content — dedup only changes which counts the
inventory reports.

### Parsing is content-addressed; dedup is a reporting concern

A parser given identical bytes returns identical output, so `ParserOutput` is
keyed by `sha256` on disk (`parsers/<sha256>/<parser>.json`) and parsed once
per distinct content regardless of how many roots hold a copy. The
occurrence-vs-distinct distinction therefore lives only in the **inventory**
(`run.json` + `index.md`), never in the parser/comparison outputs. This is why
dedup never changes a parser or comparison result — only which counts the
inventory reports.

## Report Layout

Defined up front (adapters need it before they can write):

```
reports/
  index.md                           # top-level overview only (see below)
  <parserA>--<parserB>.md            # one human report PER PAIR
  run.json                           # manifest: runner/pkg versions, roots, inventory
  parsers/<sha256>/<parser>.json     # one ParserOutput per (content, parser)
  comparisons/<sha256>/<a>--<b>.json # one ComparisonResult per (content, pair)
  details/<sha256>.md                # per-book detail, only when a mismatch exists
```

The human report is split:

- **`index.md`** — top-level only: the corpora-discovery table, per-parser
  open-outcome counts, the genuine-`open-failed` list, and links out to each
  pair report. It does not contain comparison histograms.
- **`<parserA>--<parserB>.md`** (e.g. `epubts-node--epubts-browser.md`,
  `epubts-node--storyteller.md`) — one per pair: that pair's both-opened
  denominator, per-field mismatch histogram, not-compared-by-reason breakdown,
  and the grouped-by-root / filename-sorted list of *that pair's* mismatches,
  each linking to its `details/<sha256>.md`.
- **`details/<sha256>.md`** — per-book, written only when at least one pair has
  a field mismatch (differ / a-only / b-only); shows each parser's actual value
  side by side. `epub2-unsupported` and plain open-failures never trigger one.

`baseline/` (frozen Gate 0 oracle) sits beside `reports/` with the same layout
as the *old* Schema-6 tree; it is never regenerated.

### `index.md` — corpora discovery table

`index.md` opens with a discovery table: per root, files found and how many were
dropped as duplicates of content already seen earlier in scan order
(distinct = found − deduped). **Scan order is config order: `test`, `space`,
`drop`** — so a book in both `space` and `drop` counts as distinct in `space`
and deduped in `drop` (the later root absorbs the duplicate):

```
| root  | found | deduped | distinct |
|-------|------:|--------:|---------:|
| test  |     4 |       0 |        4 |
| space |   yyy |       0 |      yyy |
| drop  |   zzz |    ~537 |  zzz-537 |
| total |     N |       D |      N-D |
```

(Illustrative: the ~537 multi-root SHA groups land mostly against `drop`, the
last root scanned.) Followed by per-parser open-outcome counts and the per-pair
metadata histograms.

### Human-readable rendering

`index.md` and `details/*.md` always **name the parsers explicitly** — never
the schema-internal `a`/`b` / `a-only` / `b-only`. A field rendered for a pair
reads, e.g., "epubts-node only" (b is null), "storyteller only" (a is null), or
"epubts-node ≠ epubts-browser" (both present, differ). The `a`/`b` form is legal
only inside the JSON schema, where `parserA`/`parserB` name the sides.

**Rows are grouped by root, then ordered by filename — never by sha or by
parsed metadata.** On disk everything is content-addressed
(`parsers/<sha256>/…`), but the sha carries no human meaning and parsed
title/creator is unreliable (entity truncation, nulls — that is partly what we
are validating). So the human view is organised as:

- **Group by root, in scan order** (test, space, drop).
- Each book appears **once**, under the root that first introduced it. Later-root
  groups therefore show only that root's new content; the cross-root duplicates
  (the deduped ones) sit under their first-seen root, not repeated.
- **Within a group, sort by filename** (the relative path with the root prefix
  dropped — the group header already names the root). The filename embeds
  author-title, so it is the stable, meaningful sort key.

`index.md` links to `details/<sha256>.md` using the **filename** as the visible
link label.

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

| Stays from epub-split/inspect/ | Changes |
|---|---|
| Bun toolchain | No baked-in 3-way comparison |
| Subprocess isolation + jsdom fallback | Parser adapters produce `ParserOutput` (Zod); `domParser` field replaces `engine` |
| Playwright harness for browser | Generic `compareBook(a, b)` replaces per-field comparison |
| Atomic report replacement | Corpus module hides dedup logic |
| Deterministic corpus discovery | Element-specific typed warnings replace inline status strings |
| Per-book JSON + Markdown reports | Reports structured around comparison pairs, not parser names |

## Gate Roadmap (high level)

The tracked, task-level breakdown with verifiable outcomes lives in the plan.
This is the shape:

| Gate | Scope |
|---|---|
| 0A | Capture + freeze the parity baseline (current runner). |
| 0B | Pure source rename (no report regeneration). |
| 1 | Zod `ParserOutput` schema + fixtures + tests. No parsing run. |
| 2 | Corpus module + report layout + `run.json` writer (no adapters). |
| 3 | epubts-node adapter → `ParserOutput` (metadata only). |
| 4 | epubts-browser adapter → `ParserOutput` (metadata only). |
| 5 | storyteller adapter → `ParserOutput` (metadata, epub2-unsupported). |
| 6 | Generic pairwise `compareBook` + pair reports + parity projection. |
| 7 | Dedup collapse mode (optional; corpus basics already in Gate 2). |
| 8 | Expand content to manifest + spine; expand comparison. |
| 9 | Expand to TOC. |
| 10 | Expand to chapter content (raw → canonical → text). |
| 11 | Consolidate findings into one document (closeout). |

Schema/type-only gates (1, 2) verify by typecheck + unit tests. Gates that
touch the runner (3+) run the full corpus for determinism + parity. Scope
expands one content section at a time so findings remain attributable.

**Gates 8–10 are intentionally high-level here.** The structural comparison
taxonomies (manifest/spine/toc/chapter warnings) are designed when that work
starts, not now — the detailed plan is revisited as soon as Gate 8 begins.

## Design-level Open Questions

These are architecture decisions still open; sequencing/tracking is in the plan.

1. **Directory restructure timing** — promote `epub-split/inspect/` to
   **`epub-validate/`** (confirmed name). Deferred (not done in this plan); see
   plan Gate 0B. `epub-validate` is the first of a planned *family* of
   validators (mp4 parsing, etc.) in a future monorepo, where parsers and
   interfaces may split into sub-libraries — which is exactly why the schema
   firewall, decoupled comparator, and per-artifact schema versions are chosen
   now. The monorepo is not being built yet; we just avoid foreclosing it.

2. **Parser scope long-term** — does epubts-browser stay, or graduate to
   "sanity-check only" and eventually drop? Decision deferred until the
   comparator gate (Gate 6) evidence is in.

(The reports-migration question is resolved in the plan: the Gate 0 baseline is
frozen in `baseline/`; the new pipeline writes a fresh `reports/`; git is the
permanent archive.)
