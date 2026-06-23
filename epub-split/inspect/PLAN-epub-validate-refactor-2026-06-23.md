# EPUB Validate Refactor — Action Plan

Date: 2026-06-23
Branch: `feature/epub-validate-refactor`
Design: `DESIGN-epub-validate-refactor-2026-06-23.md`
Status: `PLANNING — not started`

This is the tracked, cold-executable task list. A fresh session should be able
to read this top-to-bottom and start the next unchecked gate without prior
context. Architecture and rationale live in the design doc.

---

## Cold-start contract (read first)

- Working directory for all commands below: `epub-split/inspect/`.
- Git root is `ai-garden/` (two levels up). Use `git -C /Users/daniel/Code/iMetrical/ai-garden …`.
- Do **one gate at a time**. Stop at the end of a gate and report; Daniel
  approves before the next gate starts.
- Each gate lists **Tasks** (checkboxes) and a **Verifiable outcome** (the
  checks that must pass). Do not advance with a failing check.
- Do not commit after every edit. Commit once per gate, when its outcome is met
  and Daniel has reviewed. Branch is already `feature/epub-validate-refactor`.
- Naming rules that have been corrected repeatedly: parser is `storyteller`
  (never `storyteller-node`); the DOM-parser field is `domParser` (never
  `engine`); the project is *validate* (the directory stays `inspect/` only
  because the restructure is deferred).

## Current state snapshot (as of 2026-06-23)

Toolchain and commands that exist now:

- `bun install` — installs deps; `postinstall` runs `playwright install chromium`.
- `bun run inspect` — `build:browser` then `bun run src/index.ts`. Processes
  **all** roots; rejects any CLI argument. ~1,301 books; slow (launches Chromium).
- `bun run build:browser` — bundles `src/browser/entry.ts` → `dist/epubts-browser.js`.
- `bunx tsc --noEmit` — typecheck (the `typecheck` script calls `tsc --noEmit`).
- **There are no tests and no `test` script.** `bun test` finds nothing today.
  Gate 1 establishes the first tests and adds the script. Until then, TEST is
  not an available primitive.

Config facts (`src/config.ts`):

- `ROOTS`: `test` → `../test-books` (4 EPUBs, committed in-repo), `space` →
  `/Volumes/Space/Reading/audiobooks`, `drop` → Dropbox EBook folder. Only
  `test` is portable; `space`/`drop` exist on Daniel's machine.
  **Note:** config.ts currently lists these as test, **drop, space** — the
  intended scan order is test, **space, drop** (drop, scanned last, absorbs
  cross-root duplicates). Gate 0A reorders config before capturing the baseline.
- `PARSER_NAMES = ["epubts-browser", "epubts-node", "storyteller-node"]` —
  the `storyteller-node` entry is renamed to `storyteller` in Gate 0B.
- `REPORT_SCHEMA_VERSION = 6` (the old three-parser schema).
- Reports are replaced atomically via `.reports-next` / `.reports-previous`.

Current source files and roles (`src/`):

| File | Role |
|---|---|
| `index.ts` | runner entry; loops roots → browser → node → storyteller → reports |
| `books.ts` | corpus discovery, hashing, report-name assignment |
| `browser-transport.ts` | Playwright host; streams EPUB via ephemeral Bun server |
| `browser/entry.ts` | in-browser epub.ts call (bundled to IIFE) |
| `browser/protocol.ts` | harness protocol types |
| `node-parser.ts` | epubts-node orchestrator (spawns per-book workers) |
| `node-open-one.ts` | subprocess: open one book via epub.ts node (+jsdom fallback) |
| `storyteller-parser.ts` | storyteller orchestrator (spawns per-book workers) |
| `storyteller-open-one.ts` | subprocess: open one book via Storyteller |
| `metadata-utils.ts` | epub.ts sentinel + `optional`/`optionalDate` helpers |
| `reports.ts` | report generation (index.md, run.json, per-book JSON) |
| `types.ts` | all shared types (three-parser model) |
| `config.ts` | roots, paths, parser names, schema version |

## Division of labor (who runs what)

- **Claude (each gate)**: write code; run TYPECHECK; write/run unit tests
  (TEST) against **curated fixtures** (see "Fixture matrix"); commit when green
  and reviewed. Claude does **not** run the full corpus.
- **Daniel (each gate that touches the runner)**: run the full corpus
  (`bun run inspect`) for DETERMINISM and PARITY, paste the headline numbers.
  This matches existing practice ("I run full corpus").
- **Only full-corpus runs are meaningful end-to-end.** The `test` root is all
  EPUB 3.0 (Gutenberg) — it cannot exercise EPUB 2 / epub2-unsupported, bad-zip
  failures, entity-truncation, or the LinkeDOM hang. So there is no useful
  "smoke run" on a corpus root; coverage of those cases comes from curated
  fixtures (unit tests) and from Daniel's full run. No root-filter feature is
  planned.

## Verification primitives

Each gate names the ones it requires. Cite numbers; do not assert.

- **TYPECHECK** — `cd epub-split/inspect && bunx tsc --noEmit` is clean.
- **TEST** — `bun test` green (available only after Gate 1 creates it).
- **DETERMINISM** — `git add epub-split/inspect/reports`, run the full corpus
  again, then `git diff --exit-code -- epub-split/inspect/reports` returns 0
  (the re-run produced byte-identical output). (Daniel's full run.)
- **PARITY** — the gate's headline metric matches the baseline captured in
  Gate 0A (not the last-known snapshot, which the growing corpus will have moved).

## Parity baseline (captured fresh at start, then frozen)

The corpus grows week to week, so absolute counts drift. The binding baseline
is therefore **captured once at the start of development** (Gate 0A) by a final
run of the *current* (pre-refactor) runner, and **frozen for the duration** —
PARITY means "matches that captured baseline," not "matches last week's
snapshot."

What is invariant regardless of corpus size (these must always hold):
- epubts-browser and epubts-node agree on metadata for ~99%+ of books.
- The entity-truncation titles below still truncate on the node path.
- Roughly 28% EPUB 3 / 72% EPUB 2; storyteller opens only the EPUB 3 share.
- A jsdom fallback exists for the LinkeDOM synchronous-hang books.

The numbers below are the **last-known snapshot** (Schema 6, `reports/index.md`,
FINDINGS 2026-06-19) — illustrative, to be re-captured before Gate 1.

Corpus (last-known):
- 1,301 occurrences: `test` 4, `space` 589, `drop` 708.
- 754 distinct books by SHA-256; 537 SHA groups appear in more than one root.

Open outcomes (by occurrence, /1,301):
- epubts-browser: 1,301 opened, 0 failed.
- epubts-node: 1,301 opened, 0 failed, **15 via jsdom fallback** (9 distinct
  hanging books: Sourcery, Revelation Space 01, Thud!, Shakespeare Four Great
  Histories, Rapture of the Nerds, Gwynne Valour, Ken Liu Veiled Throne,
  Malazan Omnibus, Steve Jobs).
- storyteller: 368 opened, 933 failed. By distinct book (754): 213 EPUB 3
  opened, 523 EPUB 2 rejected, 17 "could not read package document", 1 bad zip.

Version split (by occurrence): 368 (28.3%) EPUB 3, 933 (71.7%) EPUB 2.

Metadata comparison histogram (title / creator / date):

| Status              | title | creator | date |
|---------------------|------:|--------:|-----:|
| all-agree           |   364 |     368 |  368 |
| node-differs        |     2 |       0 |    0 |
| storyteller-differs |     0 |       0 |    0 |
| browser-differs     |     0 |       0 |    0 |
| all-differ          |     2 |       0 |    0 |
| browser-node-agree  |   927 |     931 |  801 |
| browser-node-differ |     5 |       1 |    0 |
| unavailable         |     1 |       1 |  132 |

Entity-truncation bug (epubts-node, LinkeDOM) — must still surface in Gate 6:
- "His Majesty's Dragon" → "His Majesty" (splits at `'`)
- "Legends & Lattes…" → "Legends" (splits at `&`)
- "Bookshops & Bonedust" → "Bookshops"
- "Austerity Ecology & the Collapse-Porn Addicts…" → "Austerity Ecology"
- "The Reverse Centaur's Guide to Life After AI" → "The Reverse Centaur"

## Reports strategy

- Gate 0A renames the current Schema-6 `reports/` to `baseline/` (after a fresh
  deterministic run) and commits it. `baseline/` is the **frozen parity oracle**
  — never regenerated.
- The new pipeline writes a fresh `reports/` from Gate 2 onward, so old and new
  coexist without two live runners (`baseline/` is data, not a runner).
- `baseline/` is removed once metadata parity is fully reconciled (end of
  Gate 6); git retains it permanently.

## Report layout (fixed now — adapters depend on it)

```
reports/
  index.md                            # human summary (corpora table + counts)
  run.json                            # manifest: versions, roots, inventory
  parsers/<sha256>/<parser>.json      # one ParserOutput per (content, parser)
  comparisons/<sha256>/<a>--<b>.json  # one ComparisonResult per (content, pair)
  details/<sha256>.md                 # per-book detail, only on disagreement
```

- Keyed by full `sha256` (content-addressed). Identical bytes ⇒ identical parse,
  so each `parsers/<sha256>/…` is written once regardless of how many roots hold
  a copy. Occurrence-vs-distinct lives only in `run.json` / `index.md`.
- `pair` filename is `<parserA>--<parserB>.json`, e.g.
  `epubts-node--epubts-browser.json`, `epubts-node--storyteller.json`.

`index.md` opens with the corpora-discovery table (per root: found, deduped,
distinct), then per-parser open-outcome counts, then per-pair metadata
histograms. **Scan order = config order: test, space, drop**, so a book in both
`space` and `drop` is distinct in `space`, deduped in `drop`:

```
| root  | found | deduped | distinct |
|-------|------:|--------:|---------:|
| test  |     4 |       0 |        4 |
| space |   yyy |       0 |      yyy |
| drop  |   zzz |    ~537 |  zzz-537 |
| total |     N |       D |      N-D |
```

`deduped` = files whose `sha256` was already seen earlier in scan order.

**Human-readable reports name parsers explicitly.** `index.md` and
`details/*.md` never print the schema-internal `a`/`b` / `a-only` / `b-only`;
they render "epubts-node only", "storyteller only", or
"epubts-node ≠ epubts-browser". The `a`/`b` form is legal only in the JSON
schema, where `parserA`/`parserB` name the sides.

**Rows are grouped by root (scan order test, space, drop), then sorted by
filename** — never by sha or parsed metadata (unreliable: entity truncation,
nulls). Each book appears once, under the root that first introduced it, so
later-root groups show only their new content (the deduped duplicates sit under
their first-seen root). Within a group the root prefix is dropped (the header
names the root); the filename embeds author-title and is the stable sort key.
`index.md` links to `details/<sha256>.md` using the filename as the label.

## Schema invariants (Gate 1 must enforce via Zod refinements)

- `schemaVersion` is top-level: `{ schemaVersion, meta, content? }`.
- `openStatus: "opened"` ⇒ `content` present, `openFailure` absent.
- `openStatus: "open-failed"` ⇒ `openFailure` present, `content` absent.
- `openStatus: "epub2-unsupported"` ⇒ `content` absent, `openFailure` absent.
- `content.metadata` is required when `content` exists; its six fields are
  required and `string | null` (null = "parser exposed nothing"; no "absent").
- `domParser` present ⇒ `parser === "epubts-node"` and `openStatus === "opened"`.
- `parserVersion`: epub.ts paths use `ePub.VERSION`; storyteller uses the
  installed package version read at runtime. Never hardcoded.

## Fixture matrix (Gate 1 builds this)

Fixtures live in a dedicated `fixtures/` dir loaded **directly by unit tests**,
not as a corpus root — keeping curated test inputs separate from the real
corpus. The 4 in-repo `test-books` are **all EPUB 3.0** (Gutenberg: flatland,
nicomachean-ethics, alice-in-wonderland, tale-of-two-cities), so they cover the
happy path only and cannot stand in for the cases below. Gate 1 builds the
matrix (committed, minimized where possible):

| Case | Why | Source |
|---|---|---|
| EPUB 3, clean | happy path, all parsers open | reuse a test-book |
| EPUB 2, clean | storyteller `epub2-unsupported`; epub.ts opens | add one |
| bad zip | `open-failed` (EOCD-not-found) on all parsers | craft a truncated zip |
| entity in title (`&`, `'`) | reproduce LinkeDOM truncation in Gate 6 | craft minimal OPF |
| LinkeDOM hang → jsdom | exercise `domParser: "jsdom"` fallback | minimize a known hanging book if feasible; else corpus-only |

Where a case cannot be safely minimized/committed (notably the LinkeDOM hang),
note it as corpus-only and verify it through Daniel's full run instead.

## Naming table (apply in Gate 0B)

| Current | New | Role |
|---|---|---|
| `books.ts` | `corpus.ts` | corpus discovery + hashing + dedup |
| `node-parser.ts` | `epubts-node.ts` | epubts-node adapter |
| `node-open-one.ts` | `epubts-node-worker.ts` | subprocess: open one book |
| `storyteller-parser.ts` | `storyteller.ts` | storyteller adapter |
| `storyteller-open-one.ts` | `storyteller-worker.ts` | subprocess: open one book |
| `browser-transport.ts` | `epubts-browser.ts` | Playwright harness adapter |
| `metadata-utils.ts` | `epubts-utils.ts` | epub.ts sentinel/optional helpers |
| `browser/entry.ts`, `browser/protocol.ts` | (keep) | — |
| `reports.ts`, `types.ts`, `config.ts`, `index.ts` | (keep) | — |

Adapters named after the parser; subprocess entry points get `-worker`; drop
the ambiguous `node` prefix (Node.js vs epubts-node).

---

## Gate 0A — Capture + freeze the parity baseline (Daniel runs)

No source changes. Establishes the numeric oracle on the *current* corpus with
known-good (pre-refactor) code.

- [ ] Set `ROOTS` order in `config.ts` to **test, space, drop** (currently
      test, drop, space) so the baseline reflects the intended scan order.
- [ ] Run the current runner: `bun run inspect`.
- [ ] DETERMINISM: `git add epub-split/inspect/reports`; `bun run inspect` again;
      `git diff --exit-code -- epub-split/inspect/reports` returns 0.
- [ ] `git mv epub-split/inspect/reports epub-split/inspect/baseline`; commit
      as the frozen oracle.
- [ ] Record this run's headline numbers (open rates, version split, comparison
      histogram, distinct-hash + multi-root-group counts) into the "Parity
      baseline" section above, replacing the last-known snapshot. Frozen from here.

Verifiable outcome: `baseline/` committed; determinism shown; baseline numbers
recorded in this plan. Commit: "chore(validate): freeze parity baseline".

## Gate 0B — Pure source rename (no behavior change, no report regeneration)

- [x] Branch `feature/epub-validate-refactor` created.
- [x] `PLAN-…` renamed to `DESIGN-…`; this plan written.
- [x] Superseded headers added to the two three-parser docs.
- [x] README banner points to the refactor docs.
- [ ] `git mv` each source file per the naming table.
- [ ] Update every import specifier and subprocess-spawn path to the new names.
- [ ] Rename `PARSER_NAMES` entry `storyteller-node` → `storyteller`; update all
      uses (config, types, reports, index, workers). Keep package/runner name
      `epub-inspect` for now — it changes with the deferred directory restructure.
- [ ] **Do not run the corpus / do not regenerate reports.** The rename touches
      the parser-name string that would appear in regenerated reports; since
      `baseline/` is the frozen numeric oracle (label-independent), we simply do
      not regenerate. Verify by typecheck + build only.
- [ ] Directory restructure `inspect/` → `epub-validate/`: **deferred**.

Verifiable outcome: TYPECHECK clean; `bun run build:browser` succeeds; `git
status` shows only source renames (no `baseline/` or `reports/` change). Commit:
"refactor(validate): rename sources, storyteller-node→storyteller".

## Gate 1 — `ParserOutput` schema + fixtures + tests (no parsing run)

- [ ] Add `zod` dependency. Add `"test": "bun test"` to package.json scripts.
- [ ] `src/schema.ts`: Zod schema `{ schemaVersion, meta, content? }` with the
      invariants from "Schema invariants" above enforced via `.refine`/
      `.superRefine`. `PARSER_OUTPUT_SCHEMA_VERSION = 1`.
- [ ] Infer TS types from Zod (`z.infer`) — single source of truth.
- [ ] Build the fixture matrix (see "Fixture matrix" above): add EPUB 2, bad-zip,
      and entity-in-title fixtures; document the LinkeDOM-hang case as
      corpus-only if it cannot be minimized.
- [ ] `src/schema.test.ts`: valid fixture parses; each invariant violation is
      rejected (opened-without-content, open-failed-without-openFailure,
      domParser-on-wrong-parser, etc.); each `openStatus` round-trips.

Verifiable outcome: TYPECHECK + TEST green. Committed sample `ParserOutput`
fixtures. No corpus run.

## Gate 2 — Corpus module + report layout + `run.json` writer (no adapters yet)

The corpus module and the content-addressed inventory it feeds are needed here,
because the report layout (`parsers/<sha256>/…`) and the discovery table both
depend on them. This is the substantive corpus work; Gate 7 is only the optional
collapse mode. The `corpus.ts` renamed in Gate 0B already does discovery +
hashing — formalize it here.

- [ ] `corpus.ts`: discovery + SHA-256 hashing + content-addressed inventory
      (group occurrences by `sha256`), and the found/deduped/distinct accounting
      per root in **config scan order (test, space, drop)**. Default behaviour is
      occurrence-level (`deduplicate: false`).
- [ ] Implement the report writer for the layout in "Report layout" above:
      `parsers/<sha256>/…`, `comparisons/<sha256>/…`, `details/…`, `run.json`,
      `index.md` (incl. corpora-discovery table, parsers named explicitly).
- [ ] Atomic replacement (reuse the existing `.reports-next` mechanism).
- [ ] Writer accepts (currently empty) parser/comparison collections so adapters
      in Gates 3–6 just feed it; parse-once-per-`sha256` reuse lives here.
- [ ] Unit test: synthetic inventory + `ParserOutput`/`ComparisonResult` values;
      assert the on-disk tree, discovery table, and `index.md` render
      deterministically and name parsers explicitly.

Verifiable outcome: TYPECHECK + TEST green. A sample `reports/` tree from
synthetic inputs, byte-identical across two writes. No corpus run.

### Partial runner state (Gates 3–5)

Adapters land one at a time: Gate 3 = node only, Gate 4 adds browser, Gate 5
adds storyteller. The runner invokes **only the adapters implemented so far**,
and `index.md` marks the not-yet-implemented parsers as `not-run` (rather than
emitting empty/failed `ParserOutput`s). Comparison pairs that need a missing
parser are simply not produced until both adapters exist (so pair reports first
appear in Gate 6).

## Gate 3 — epubts-node adapter → `ParserOutput`

- [ ] `epubts-node-worker.ts` emits a Zod-valid `ParserOutput` (metadata only).
- [ ] `epubts-node.ts` orchestrates workers; jsdom fallback sets `meta.domParser`.
- [ ] Runner writes `parsers/<sha256>/epubts-node.json`; `index.md` shows
      open-success rate and jsdom-fallback count.
- [ ] Unit test over `test-books` + fixtures: outputs Zod-valid; metadata matches
      known values; entity-fixture reproduces the truncation.

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, and PARITY
vs baseline: node opens every book, small jsdom-fallback count, 0 failures
(last-known: 1,301 / 0 / 15 fallback).

## Gate 4 — epubts-browser adapter → `ParserOutput`

- [ ] `epubts-browser.ts` (+ `browser/entry.ts`) emits a Zod-valid `ParserOutput`.
- [ ] Same metadata fields as the node adapter.
- [ ] Unit test on `test-books` + fixtures.

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, PARITY vs
baseline: browser opens every book, 0 failures (last-known: 1,301 / 0).

## Gate 5 — storyteller adapter → `ParserOutput`

- [ ] `storyteller-worker.ts` / `storyteller.ts` emit a Zod-valid `ParserOutput`.
- [ ] EPUB 2 archives → `openStatus: "epub2-unsupported"` (no content, no
      openFailure — per invariants). Genuine failures (package-read, bad-zip)
      stay `open-failed`.
- [ ] Unit test on `test-books` (EPUB 3 → opened) + EPUB 2 fixture
      (→ epub2-unsupported) + bad-zip fixture (→ open-failed).

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, PARITY vs
baseline: ~28% opened (EPUB 3 share), rest `epub2-unsupported`, small
`open-failed` residue (last-known: 368 opened; 17 package-read + 1 bad-zip real).

## Gate 6 — Pairwise `compareBook` + pair reports + parity projection

- [ ] `compare.ts`: `compareBook(a, b): ComparisonResult`, parser-agnostic. The
      runner skips comparison unless both inputs are `opened` (open outcomes are
      not comparison concerns).
- [ ] Zod `ComparisonResult` + `MetadataComparison`: per field
      `{ status: PairFieldStatus, a, b }` (agree/differ/a-only/b-only/both-null).
      `index.md`/`details` render parser names, not `a`/`b` (see Report layout).
- [ ] Runner writes both pairs: `epubts-node--epubts-browser.json`,
      `epubts-node--storyteller.json`. `index.md` shows per-pair, per-field
      **mismatch** counts (mismatch = differ + a-only + b-only).
- [ ] Implement the **parity projection** (design "Parity projection"): collapse
      the `baseline/` 8-way histogram into expected node×browser and
      node×storyteller **mismatch** counts, and assert the new pairwise counts
      match over each pair's both-opened population.
- [ ] Unit test: hand-built pairs exercise all five `PairFieldStatus` values;
      projection math tested against the recorded baseline numbers.
- [ ] After parity passes: `git rm -r baseline/` (git retains it).

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, and PARITY
via projection — node×browser mismatch count and the entity-truncation books
match the baseline; node×storyteller mismatch count matches over the EPUB 3
share (last-known title mismatch: 9 and 4).

## Gate 7 — Dedup collapse mode (optional; corpus basics already in Gate 2)

The corpus module, content-addressed inventory, and found/deduped/distinct
accounting all landed in Gate 2. This gate adds only the optional collapse mode
and is deferrable — occurrence parity is already preserved without it.

- [ ] Formalize `buildCorpus({ roots, deduplicate }): CorpusEntry[]` with
      `CorpusEntry = { sha256, size, occurrences: DiscoveredBook[] }` (no
      `shortSha`, no wrapper types — short SHA derived at display).
- [ ] `deduplicate: true` collapses the **inventory** to one row per `sha256`;
      `deduplicate: false` stays the default (occurrence-level, baseline
      denominator). Neither changes parser/comparison outputs.

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM; the
corpora table's distinct + multi-root-group counts reconcile (last-known: 754
distinct, 537 multi-root groups). Occurrence-level totals unchanged from Gate 6.

## Gate 8 — Expand content to manifest + spine

- [ ] Extend `content` schema; bump `PARSER_OUTPUT_SCHEMA_VERSION`.
- [ ] All three adapters populate manifest + spine.
- [ ] `compareBook` gains `ManifestComparison`, `SpineComparison`.

Verifiable outcome: TYPECHECK + TEST + DETERMINISM. Metadata parity still holds.
New structural findings recorded.

## Gate 9 — Expand to TOC

- [ ] `content.toc` (recursive); adapters populate it.
- [ ] `compareBook` gains `TocComparison`.

Verifiable outcome: TYPECHECK + TEST + DETERMINISM. Earlier-section parity holds.

## Gate 10 — Expand to chapter content

- [ ] Per-spine XHTML extraction in adapters.
- [ ] Comparison at three levels: raw → canonical DOM → normalized text.

Verifiable outcome: TYPECHECK + TEST + DETERMINISM. Earlier-section parity holds.

## Gate 11 — Consolidate findings (closeout)

Goal: one coherent findings document, not a pile of per-gate notes.

- [ ] Write `FINDINGS-epub-validate-2026-…md` consolidating the surviving
      three-parser findings (entity-truncation, EPUB 2/3 split, Bun runtime,
      jsdom fallback) **and** every structural finding from Gates 8–10.
- [ ] Remove `FINDINGS-three-parser-inspect-2026-06-19.md` (absorbed; git keeps it).
- [ ] Update README to describe the validate tool as built (not the experiment).
- [ ] Re-evaluate parser scope (does epubts-browser stay?) with Gate 6–10 evidence.

Verifiable outcome: a single findings doc; no orphaned FINDINGS files; README
matches the shipped tool.

---

## Progress log

(Append one line per completed gate: date · gate · headline metric · commit.)
