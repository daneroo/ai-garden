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

- `ROOTS`: `test` → `../test-books` (4 EPUBs, committed in-repo), `drop` →
  Dropbox EBook folder, `space` → `/Volumes/Space/Reading/audiobooks`. Only
  `test` is portable; `drop`/`space` exist on Daniel's machine.
- `PARSER_NAMES = ["epubts-browser", "epubts-node", "storyteller-node"]` —
  the `storyteller-node` entry is renamed to `storyteller` in Gate 0.
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
  (TEST) that exercise adapters against the 4 in-repo `test-books`; commit when
  green and reviewed. Claude does **not** run the full `drop`/`space` corpus
  (slow, and not the verification that matters for correctness).
- **Daniel (each gate that touches the runner)**: run the full corpus
  (`bun run inspect`) for DETERMINISM and PARITY, paste the headline numbers.
  This matches existing practice ("I run full corpus").
- Optional convenience (nice-to-have, Gate 6): a root filter (env var or arg)
  so Claude can smoke-run on `test` only. Until it exists, Claude relies on
  unit tests against `test-books`, not the full runner.

## Verification primitives

Each gate names the ones it requires. Cite numbers; do not assert.

- **TYPECHECK** — `cd epub-split/inspect && bunx tsc --noEmit` is clean.
- **TEST** — `bun test` green (available only after Gate 1 creates it).
- **DETERMINISM** — stage `reports/`, run the full corpus again, `git status`
  shows no change to `reports/`. (Daniel's full run.)
- **PARITY** — the gate's headline metric matches the baseline captured in
  Gate 0 (not the last-known snapshot, which the growing corpus will have moved).

## Parity baseline (captured fresh at start, then frozen)

The corpus grows week to week, so absolute counts drift. The binding baseline
is therefore **captured once at the start of development** (Gate 0) by a final
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
- 1,301 occurrences: `test` 4, `drop` 708, `space` 589.
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

Entity-truncation bug (epubts-node, LinkeDOM) — must still surface in Gate 5:
- "His Majesty's Dragon" → "His Majesty" (splits at `'`)
- "Legends & Lattes…" → "Legends" (splits at `&`)
- "Bookshops & Bonedust" → "Bookshops"
- "Austerity Ecology & the Collapse-Porn Addicts…" → "Austerity Ecology"
- "The Reverse Centaur's Guide to Life After AI" → "The Reverse Centaur"

## Reports strategy

- Old Schema-6 `reports/` stay frozen as the oracle until Gate 2 produces the
  equivalent new output, then are removed in the same commit. No two live
  runners at any point. Git (`dd265529`) is the permanent archive.
- New output: one `ParserOutput` JSON per (book, parser); one `ComparisonResult`
  JSON per (book, pair). Layout decided in Gate 2.

## Naming table (apply in Gate 0)

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

## Gate 0 — Doc reorg + rename (no behavior change)

- [x] Branch `feature/epub-validate-refactor` created.
- [x] `PLAN-…` renamed to `DESIGN-…`; this plan written.
- [x] Superseded headers added to the two three-parser docs.
- [x] README banner points to the refactor docs.
- [ ] `git mv` each source file per the naming table.
- [ ] Update every import specifier and subprocess-spawn path to the new names.
- [ ] Rename `PARSER_NAMES` entry `storyteller-node` → `storyteller`; update all
      uses (config, types, reports, index, workers). Keep package/runner name
      `epub-inspect` for now — it changes with the deferred directory restructure.
- [ ] Directory restructure `inspect/` → `epub-validate/`: **deferred** (do not
      do it in this plan).
- [ ] **Capture the parity baseline (Daniel runs).** Run the *current*
      pre-refactor runner once on the full corpus (`bun run inspect`), confirm
      DETERMINISM (re-run, no diff), and commit the resulting `reports/` as the
      frozen baseline. Record the headline numbers (open rates, version split,
      comparison histogram, distinct-hash count) into this plan's baseline
      section, replacing the last-known snapshot. These numbers are frozen for
      the rest of the refactor. Do this **before** any source rename touches
      behavior, so the baseline reflects known-good code on the current corpus.

Verifiable outcome: TYPECHECK clean. `bun run build:browser` succeeds. Renames
change no `reports/` content (pure rename — `git status` shows only source
renames). Baseline committed and its numbers recorded here. Commit the renames
separately: "refactor(validate): rename sources, storyteller-node→storyteller".

## Gate 1 — `ParserOutput` schema (Zod, versioned) + test harness

- [ ] Add `zod` dependency. Add `"test": "bun test"` to package.json scripts.
- [ ] `src/schema.ts`: Zod schema for `meta` (`schemaVersion`, `parser`,
      `parserVersion`, `domParser?`, `openStatus`
      ∈ {opened, open-failed, epub2-unsupported}, `openFailure?`).
- [ ] Zod schema for `content` (v1 = metadata only: title, creator, date,
      language, publisher, identifier — each `string | null`).
- [ ] `PARSER_OUTPUT_SCHEMA_VERSION = 1`.
- [ ] Infer TS types from Zod (`z.infer`) — single source of truth, no
      hand-written duplicates.
- [ ] `src/schema.test.ts`: a valid fixture parses; malformed fixtures are
      rejected; each `openStatus` variant round-trips through parse→serialize.

Verifiable outcome: TYPECHECK + TEST green. A committed sample `ParserOutput`
JSON fixture. No corpus run.

## Gate 2 — epubts-node adapter → `ParserOutput`

- [ ] `epubts-node-worker.ts` emits a Zod-valid `ParserOutput` (metadata only).
- [ ] `epubts-node.ts` orchestrates workers; jsdom fallback sets `meta.domParser`.
- [ ] Decide and document the new report layout; write one `ParserOutput` JSON
      per book.
- [ ] Summary surfaces open-success rate and jsdom-fallback count.
- [ ] Unit test: run the adapter over the 4 `test-books`; assert each output is
      Zod-valid and metadata matches known values.
- [ ] Remove old Schema-6 `reports/` in this commit (superseded).

Verifiable outcome: TYPECHECK + TEST. Daniel's full run gives DETERMINISM, and
PARITY against the Gate 0 baseline: epubts-node opens every book with a small
jsdom-fallback count, 0 failures (last-known: 1,301 / 0 / 15 fallback).

## Gate 3 — epubts-browser adapter → `ParserOutput`

- [ ] `epubts-browser.ts` (+ `browser/entry.ts`) emits a Zod-valid `ParserOutput`.
- [ ] Same metadata fields as the node adapter.
- [ ] Unit test on `test-books`.

Verifiable outcome: TYPECHECK + TEST. PARITY against the Gate 0 baseline:
epubts-browser opens every book, 0 failures (last-known: 1,301 / 0).

## Gate 4 — storyteller adapter → `ParserOutput`

- [ ] `storyteller-worker.ts` / `storyteller.ts` emit a Zod-valid `ParserOutput`.
- [ ] EPUB 2 archives → `openStatus: "epub2-unsupported"` (not an error).
- [ ] Unit test on `test-books`.

Verifiable outcome: TYPECHECK + TEST. PARITY against the Gate 0 baseline:
~28% open (the EPUB 3 share), the rest `epub2-unsupported`, with a small
residue of genuine `open-failed` (package-read + bad-zip). Last-known: 368
opened, 933 not-opened, of which 17 package-read + 1 bad-zip were real failures.

## Gate 5 — Generic `compareBook` (metadata)

- [ ] `compare.ts`: `compareBook(a, b): ComparisonResult`, parser-agnostic
      (knows parser names only via `meta.parser`, carried for reporting).
- [ ] Zod `ComparisonResult` + `MetadataComparison` with element-specific typed
      warnings (per design — not a flat enum). Parser-level open outcomes are
      **not** comparison concerns; the runner skips comparison unless both
      inputs are `opened`.
- [ ] Runner produces both pairs: node×browser, node×storyteller.
- [ ] Unit test: hand-built `ParserOutput` pairs exercise agree / differ /
      one-side-missing.

Verifiable outcome: TYPECHECK + TEST. PARITY against the Gate 0 baseline:
metadata disagreement counts reproduce the baseline histogram; the
entity-truncation titles still show as node-side disagreements.

## Gate 6 — Corpus module + single invocation

- [ ] `corpus.ts`: `buildCorpus({ roots, deduplicate }): CorpusEntry[]` where
      `CorpusEntry = { sha256, size, occurrences: DiscoveredBook[] }`
      (no `shortSha`, no wrapper types — derive short SHA at display).
- [ ] Hash-dedup collapses same-content books across roots.
- [ ] One command runs all parsers + both pairs end to end.
- [ ] (Optional) root filter so a subset run is possible.

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, and the
reported distinct-hash and multi-root-group counts reconcile with the Gate 0
baseline (last-known: 754 distinct, 537 multi-root groups).

## Gate 7 — Expand to manifest + spine

- [ ] Extend `content` schema; bump `PARSER_OUTPUT_SCHEMA_VERSION`.
- [ ] All three adapters populate manifest + spine.
- [ ] `compareBook` gains `ManifestComparison`, `SpineComparison`.

Verifiable outcome: TYPECHECK + TEST + DETERMINISM. Metadata PARITY still holds.
New structural findings recorded.

## Gate 8 — Expand to TOC

- [ ] `content.toc` (recursive); adapters populate it.
- [ ] `compareBook` gains `TocComparison`.

Verifiable outcome: TYPECHECK + TEST + DETERMINISM. Earlier-section parity holds.

## Gate 9 — Expand to chapter content

- [ ] Per-spine XHTML extraction in adapters.
- [ ] Comparison at three levels: raw → canonical DOM → normalized text.

Verifiable outcome: TYPECHECK + TEST + DETERMINISM. Earlier-section parity holds.

## Gate 10 — Consolidate findings (closeout)

Goal: one coherent findings document, not a pile of per-gate notes.

- [ ] Write `FINDINGS-epub-validate-2026-…md` consolidating: the surviving
      three-parser findings (entity-truncation, EPUB 2/3 split, Bun runtime,
      jsdom fallback) **and** every structural finding from Gates 7–9.
- [ ] Once consolidated, remove `FINDINGS-three-parser-inspect-2026-06-19.md`
      (its content is absorbed; git retains the original).
- [ ] Update README to describe the validate tool as built (not the experiment).
- [ ] Re-evaluate parser scope (does epubts-browser stay?) with Gate 6–9 evidence.

Verifiable outcome: a single findings doc; no orphaned FINDINGS files; README
matches the shipped tool.

---

## Progress log

(Append one line per completed gate: date · gate · headline metric · commit.)
