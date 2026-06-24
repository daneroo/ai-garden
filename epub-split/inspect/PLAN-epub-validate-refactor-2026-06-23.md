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

The numbers below are the **FROZEN PARITY BASELINE** — captured 2026-06-23 from a
fresh, determinism-confirmed run of the pre-refactor (Schema 6) runner with the
`test, space, drop` scan order, committed in `baseline/`. PARITY in Gates 3–6
means "matches these numbers," not last week's snapshot. Do not edit.

Toolchain captured: runner epub-inspect 0.1.0, Bun 1.3.14, Chromium
149.0.7827.55, epub.ts 0.6.7, Storyteller 0.6.2, Playwright 1.61.0.

Corpus (frozen baseline):
- 1,304 occurrences: `test` 4, `space` 590, `drop` 710.
- 756 distinct books by SHA-256; 538 SHA groups appear in more than one root.
- Per-root found/deduped/distinct (scan order test, space, drop):
  test 4/0/4, space 590/7/583, drop 710/541/169 (deduped = sha already seen
  earlier in scan order; note `space` itself holds 7 internal duplicates).

Open outcomes (by occurrence, /1,304):
- epubts-browser: 1,304 opened, 0 failed.
- epubts-node: 1,304 opened, 0 failed, **15 via jsdom fallback** (9 distinct
  hanging books).
- storyteller: 368 opened, 936 failed. By distinct book (756): 213 EPUB 3
  opened, 525 EPUB 2 rejected, 17 "could not read package document", 1 bad zip.

Version split (by occurrence): 368 (28.2%) EPUB 3, 936 (71.8%) EPUB 2.

Metadata comparison histogram (title / creator / date):

| Status              | title | creator | date |
|---------------------|------:|--------:|-----:|
| all-agree           |   364 |     368 |  368 |
| node-differs        |     2 |       0 |    0 |
| storyteller-differs |     0 |       0 |    0 |
| browser-differs     |     0 |       0 |    0 |
| all-differ          |     2 |       0 |    0 |
| browser-node-agree  |   930 |     934 |  804 |
| browser-node-differ |     5 |       1 |    0 |
| unavailable         |     1 |       1 |  132 |

Parity projection (for Gate 6) collapses the table above onto the two pairs:
- node×browser title mismatch = node-differs + browser-differs + all-differ +
  browser-node-differ = 2 + 0 + 2 + 5 = **9**.
- node×storyteller title mismatch (EPUB 3 share) = node-differs +
  storyteller-differs + all-differ = 2 + 0 + 2 = **4**.

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
  index.md                            # top-level overview only
  <parserA>--<parserB>.md             # one human report PER PAIR
  run.json                            # manifest: versions, roots, inventory
  parsers/<sha256>/<parser>.json      # one ParserOutput per (content, parser)
  comparisons/<sha256>/<a>--<b>.json  # one ComparisonResult per (content, pair)
  details/<sha256>.md                 # per-book detail, only on mismatch
```

- Keyed by full `sha256` (content-addressed). Identical bytes ⇒ identical parse,
  so each `parsers/<sha256>/…` is written once regardless of how many roots hold
  a copy. Occurrence-vs-distinct lives only in `run.json` / `index.md`.
- `pair` filename is `<parserA>--<parserB>`, e.g.
  `epubts-node--epubts-browser`, `epubts-node--storyteller` (both `.json` under
  `comparisons/<sha256>/` and `.md` at top level).

The human report is split:
- **`index.md`** — top-level overview only: corpora-discovery table, per-parser
  open-outcome counts, the genuine-`open-failed` list, and links to each pair
  report. **No comparison histograms here.**
- **`<parserA>--<parserB>.md`** — per pair: both-opened denominator, per-field
  mismatch histogram, not-compared-by-reason breakdown, and the grouped/sorted
  list of that pair's mismatches linking to `details/<sha256>.md`.
- **`details/<sha256>.md`** — per book, mismatch-only, side-by-side values.

The corpora-discovery table (in `index.md`) is **scan order = config order:
test, space, drop**, so a book in both `space` and `drop` is distinct in
`space`, deduped in `drop`:

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
- `openFailure` is `{ category, message }` — **no `stage`**. Transport/infra
  failures abort the run (loudly); they are not per-book verdicts.
- `content.metadata` is required when `content` exists; its **three** fields
  (title, creator, date) are required and `string | null` (null = "parser
  exposed nothing"; no "absent"). language/publisher/identifier are out of v1
  (too unreliable to compare).
- `domParser` present ⇒ `parser === "epubts-node"` and `openStatus === "opened"`.
- `parserVersion`: epub.ts paths use `ePub.VERSION`; storyteller uses the
  installed package version read at runtime. Never hardcoded.
- **No timestamp / hostname / run-instant** anywhere in `ParserOutput` or
  `run.json` (determinism). Provenance yes, wall-clock no.

**Assembly (the firewall):** the three adapters return only a minimal raw
open-result (`{ openStatus, metadata | null, parserVersion, openFailure? }`) in
whatever shape is natural for them; one shared host-side
`buildParserOutput(parser, sha, openResult)` assembles the full object and is
the **only** place Zod runs. Parser-specific mess (hang, jsdom fallback, raw
entities) stays sealed behind `ParserOutput`; nothing downstream sees it.

## Fixture matrix (Gate 1 builds this)

Anything **we craft** to support unit/integration tests (including malformed
inputs) lives in **`test/fixtures/`** with descriptive names — loaded directly
by tests, never as a corpus root. The `test` corpus root (`../test-books`) stays
**valid EPUBs only**; the 4 in-repo books are all EPUB 3.0 Gutenberg (flatland,
nicomachean-ethics, alice-in-wonderland, tale-of-two-cities) and cover the happy
path only. Gate 1 builds the matrix (committed, minimized where possible):

| Case | File (suggested) | Why |
|---|---|---|
| EPUB 3, clean | reuse a test-book | happy path, all parsers open |
| EPUB 2, clean | `test/fixtures/epub2-minimal.epub` | storyteller `epub2-unsupported`; epub.ts opens |
| bad zip | `test/fixtures/malformed-truncated-zip.epub` | `open-failed` (EOCD-not-found) all parsers |
| entity in title | `test/fixtures/entity-ampersand-in-title.epub` | reproduce LinkeDOM truncation as a unit test |
| LinkeDOM hang → jsdom | (corpus-only) | exercise `domParser: "jsdom"` fallback |

The LinkeDOM hang cannot be safely minimized (it lives deep in epub.ts's parse
of specific real books) — it stays corpus-only, verified through Daniel's full
run. Gate 1 also adds a **placeholder/xfail test** documenting the entity
truncation and leaving a TODO to characterize the hang condition — the fixtures
are a good place to investigate the actual LinkeDOM failure later.

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

- [x] Set `ROOTS` order in `config.ts` to **test, space, drop** (currently
      test, drop, space) so the baseline reflects the intended scan order.
- [x] Run the current runner: `bun run inspect`.
- [x] DETERMINISM: `git add epub-split/inspect/reports`; `bun run inspect` again;
      `git diff --exit-code -- epub-split/inspect/reports` returns 0. (Daniel: exit 0.)
- [x] `git mv epub-split/inspect/reports epub-split/inspect/baseline`; commit
      as the frozen oracle.
- [x] Record this run's headline numbers (open rates, version split, comparison
      histogram, distinct-hash + multi-root-group counts) into the "Parity
      baseline" section above, replacing the last-known snapshot. Frozen from here.

Verifiable outcome: `baseline/` committed; determinism shown; baseline numbers
recorded in this plan. Commit: "chore(validate): freeze parity baseline".

## Gate 0B — Pure source rename (no behavior change, no report regeneration)

- [x] Branch `feature/epub-validate-refactor` created.
- [x] `PLAN-…` renamed to `DESIGN-…`; this plan written.
- [x] Superseded headers added to the two three-parser docs.
- [x] README banner points to the refactor docs.
- [x] `git mv` each source file per the naming table.
- [x] Update every import specifier and subprocess-spawn path to the new names.
- [x] Rename `PARSER_NAMES` entry `storyteller-node` → `storyteller`; update all
      uses (config, types, reports, index, workers). Keep package/runner name
      `epub-inspect` for now — it changes with the deferred directory restructure.
      (`stage: "browser-transport"` left untouched — a runtime stage value in the
      old schema, not a filename; the new schema drops `stage` in Gate 1.)
- [x] **Do not run the corpus / do not regenerate reports.** The rename touches
      the parser-name string that would appear in regenerated reports; since
      `baseline/` is the frozen numeric oracle (label-independent), we simply do
      not regenerate. Verify by typecheck + build only.
- [ ] Directory restructure `inspect/` → `epub-validate/`: **deferred** (not done).

Verifiable outcome: TYPECHECK clean; `bun run build:browser` succeeds; `git
status` shows only source renames (no `baseline/` or `reports/` change). Commit:
"refactor(validate): rename sources, storyteller-node→storyteller".

## Gate 1 — `ParserOutput` schema + fixtures + tests (no parsing run)

- [x] Add `zod` dependency (zod@4.4.3). Add `"test": "bun test"` to package.json.
- [x] `src/schema.ts`: Zod schema `{ schemaVersion, meta, content? }` with the
      invariants enforced via chained `.refine` (zod v4 keeps the object type, so
      inference stays clean) plus `z.strictObject` to reject stray keys
      (`stage`, wall-clock leaks). `PARSER_OUTPUT_SCHEMA_VERSION = 1`.
- [x] Infer TS types from Zod (`z.infer`) — single source of truth.
- [x] Build the fixture matrix in `test/fixtures/` (committed generator
      `build-fixtures.sh` + binaries): `epub2-minimal.epub`,
      `entity-ampersand-in-title.epub`, `malformed-truncated-zip.epub`;
      LinkeDOM-hang stays corpus-only.
- [x] `src/schema.test.ts`: 6 committed sample `ParserOutput`s validate +
      round-trip; 19 invariant-violation cases rejected (opened-without-content,
      open-failed-without-openFailure, `openFailure`-with-`stage`,
      domParser-on-wrong-parser, extra-key leaks, etc.); all-null metadata
      accepted.
- [x] `src/linkedom-quirks.test.ts`: two `test.todo` placeholders — the entity
      truncation (against the fixture) and the LinkeDOM hang, each with a TODO to
      characterize/flip in Gate 3.

Verifiable outcome: TYPECHECK + TEST green. Committed sample `ParserOutput`
fixtures + `test/fixtures/` inputs. No corpus run.

## Gate 2 — Corpus module + report layout + `run.json` writer (no adapters yet)

The corpus module and the content-addressed inventory it feeds are needed here,
because the report layout (`parsers/<sha256>/…`) and the discovery table both
depend on them. This is the substantive corpus work; Gate 7 is only the optional
collapse mode. The `corpus.ts` renamed in Gate 0B already does discovery +
hashing — formalize it here.

- [x] `corpus.ts`: pure `buildInventory(rootOrder, occurrences)` groups by
      `sha256` and tallies found/deduped/distinct per root in **scan order (test,
      space, drop)**; IO wrapper `discoverInventory(roots)` for the runner.
      Occurrence-level default (collapse mode stays Gate 7).
- [x] `report-writer.ts`: `writeReport(outputDir, input)` renders the full
      layout — `parsers/<sha256>/…`, `comparisons/<sha256>/…`, `details/…`,
      `run.json`, split `index.md` (corpora table + occurrence-weighted open
      counts + open-failed list, no histograms) and per-pair `<a>--<b>.md`
      (header + per-field outcomes + not-compared + mismatch list). Built
      complete now so Gates 3–6 just feed data. Parsers named explicitly; no
      timestamp in `run.json`. `ComparisonResult` schema added to `schema.ts`
      (shape only; `compareBook`/parity projection stay Gate 6).
- [x] Atomic replacement via `<outputDir>.next` / `.previous` swap.
- [x] Writer takes content-addressed `parserOutputs` / `comparisons` maps (one
      per `sha256`); content-addressing enforces parse-once-per-`sha256`.
- [x] Unit tests: `corpus.test.ts` (accounting, scan order, multi-root grouping)
      and `report-writer.test.ts` (synthetic inventory + ParserOutput +
      ComparisonResult → on-disk tree, occurrence-weighted counts, parsers named
      explicitly, byte-identical across two writes, no timestamp/machine-path
      leaks).

Verifiable outcome: TYPECHECK + TEST green (48 tests: 46 pass / 2 todo). Sample
`reports/` tree byte-identical across two writes. No corpus run. NOTE: the new
writer is not yet wired into the runner — old `index.ts`/`reports.ts` remain
untouched (and unrun) until Gate 3 begins the rewire.

### Partial runner state (Gates 3–5)

Adapters land one at a time: Gate 3 = node only, Gate 4 adds browser, Gate 5
adds storyteller. The runner invokes **only the adapters implemented so far**,
and `index.md` marks the not-yet-implemented parsers as `not-run` (rather than
emitting empty/failed `ParserOutput`s). Comparison pairs that need a missing
parser are simply not produced until both adapters exist (so pair reports first
appear in Gate 6).

## Gate 3 — epubts-node adapter → `ParserOutput`

- [x] Add the shared `buildParserOutput(parser, rawResult)` host-side assembler
      (`src/adapter.ts`) — the one Zod-validation site; reused by Gates 4–5.
- [x] `epubts-node-worker.ts` returns minimal raw result `{ ok, parserVersion,
      domParser, metadata }` / `{ ok, category, message }`; parserVersion passed
      as argv[4] by the parent (read once via Bun.resolveSync).
- [x] `epubts-node.ts` orchestrates workers and feeds the assembler via
      `openNode(absolutePath)`; runner writes `parsers/<sha256>/epubts-node.json`;
      `index.md` shows open-success rate (jsdom fallback counted via domParser field).
- [x] Unit test over `test-books` + fixtures: outputs Zod-valid; metadata matches
      known values; entity-fixture reproduces the truncation ("Legends " not
      "Legends & Lattes" — LinkeDOM keeps the space before `&`).

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, and PARITY
vs baseline: node opens every book, small jsdom-fallback count, 0 failures
(last-known: 1,301 / 0 / 15 fallback).

## Gate 4 — epubts-browser adapter → `ParserOutput`

- [x] `browser/entry.ts` returns the minimal raw open-result (no zod in the
      bundle); `epubts-browser.ts` feeds the shared assembler from Gate 3.
- [x] Same three metadata fields as the node adapter.
- [x] Unit test on `test-books` + fixtures.

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, PARITY vs
baseline: browser opens every book, 0 failures (last-known: 1,301 / 0).

## Gate 5 — storyteller adapter → `ParserOutput`

- [x] `storyteller-worker.ts` / `storyteller.ts` emit a Zod-valid `ParserOutput`.
- [x] EPUB 2 archives → `openStatus: "epub2-unsupported"` (no content, no
      openFailure — per invariants). Genuine failures (package-read, bad-zip)
      stay `open-failed`.
- [x] Unit test on `test-books` (EPUB 3 → opened) + EPUB 2 fixture
      (→ epub2-unsupported) + bad-zip fixture (→ open-failed).

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, PARITY vs
baseline: ~28% opened (EPUB 3 share), rest `epub2-unsupported`, small
`open-failed` residue (last-known: 368 opened; 17 package-read + 1 bad-zip real).

## Gate 6 — Pairwise `compareBook` + pair reports + parity projection

- [x] `compare.ts`: `compareBook(a, b): ComparisonResult`, parser-agnostic. The
      runner skips comparison unless both inputs are `opened` (open outcomes are
      not comparison concerns).
- [x] `compareField` is exact-lexical `===` (no entity/whitespace/case
      normalization — per-parser cleanup already happened in the adapter).
- [x] Zod `ComparisonResult` + `MetadataComparison` (title/creator/date): per
      field `{ status: PairFieldStatus, a, b }`
      (agree/differ/a-only/b-only/both-null). Reports render parser names, not
      `a`/`b` (see Report layout).
- [x] Runner writes `comparisons/<sha>/epubts-node--epubts-browser.json` and
      `…--storyteller.json`, and the two top-level pair reports
      `reports/epubts-node--epubts-browser.md`, `reports/epubts-node--storyteller.md`
      (each: both-opened denominator, per-field **mismatch** histogram (mismatch
      = differ + a-only + b-only), not-compared-by-reason, mismatch list →
      details). `index.md` links to both.
- [x] Implement the **parity projection** (design "Parity projection"): collapse
      the `baseline/` 8-way histogram into expected node×browser and
      node×storyteller **mismatch** counts, and assert the new pairwise counts
      match over each pair's both-opened population.
- [x] Unit test: hand-built pairs exercise all five `PairFieldStatus` values;
      projection math tested against the recorded baseline numbers.
- [x] After parity passes: `git rm -r baseline/` (git retains it).
- [x] Switch pair reports and parser-outcome table from occurrence-weighted to
      distinct-book counts (occ=1 per CorpusEntry). Projection targets updated.

Verifiable outcome: TYPECHECK + TEST. Daniel's full run: DETERMINISM, and PARITY
via projection — node×browser mismatch count and the entity-truncation books
match the baseline; node×storyteller mismatch count matches over the EPUB 3
share (last-known title mismatch: 9 and 4).

## Gate 7 — Dedup collapse mode (WILL NOT IMPLEMENT)

The content-addressed model already gives one CorpusEntry per sha256 with all
occurrences attached. A separate collapse flag adds UI polish with no downstream
value — the discovery table already shows found/deduped/distinct correctly.
Dropped 2026-06-24.

## Gate 8 — Expand content to manifest + spine

> **Revisit the detailed plan when Gate 8 begins.** Gates 8–10 are deliberately
> sketch-level: the structural comparison taxonomies (manifest/spine/toc/chapter
> warnings) are designed when the work starts, not now.

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

- 2026-06-23 · Gate 0A · baseline frozen: 1,304 occ / 756 distinct / 538 multi-root; node×browser title mismatch 9, node×storyteller 4 · chore(validate): freeze parity baseline
- 2026-06-23 · Gate 0B · 7 source files renamed, storyteller-node→storyteller; TYPECHECK clean, build:browser ok, no report regeneration · refactor(validate): rename sources, storyteller-node→storyteller
- 2026-06-23 · Gate 1 · zod@4 ParserOutput schema + 3 EPUB fixtures + 6 sample outputs; TEST 26 pass / 2 todo / 0 fail, TYPECHECK clean, no corpus run · feat(validate): add ParserOutput zod schema, fixtures, and tests
- 2026-06-23 · Gate 2 · content-addressed corpus inventory + full report-writer (new layout) + ComparisonResult shape; TEST 46 pass / 2 todo, byte-identical reruns, TYPECHECK clean, no corpus run · feat(validate): content-addressed corpus inventory + report writer (Gate 2)
- 2026-06-24 · Gate 3 · epubts-node adapter (adapter.ts + openNode); runner rewired to content-addressed node-only; entity truncation confirmed "Legends " (trailing space); TEST 51 pass / 1 todo / 0 fail, TYPECHECK clean · cc4f0aa4
- 2026-06-24 · Gate 4 · epubts-browser adapter; browser/entry.ts simplified (no DeclaredVersion, no Zod); BrowserTransport.open() returns ParserOutput; runner adds browser loop + provenance; ePub.VERSION is "0.3" (2-part); TEST 55 pass / 1 todo / 0 fail, TYPECHECK clean · df6b1190
- 2026-06-24 · Gate 5 · storyteller adapter; worker emits epub2-unsupported on EpubVersionError; openStoryteller() returns ParserOutput; runner adds storyteller loop + complete provenance; TEST 59 pass / 1 todo / 0 fail, TYPECHECK clean · 097dbd72
- 2026-06-24 · Gate 6 · compare.ts (compareBook, compareField, parity projection); runner wired with PAIRS + comparisons; pair reports + detail pages now live; switched to distinct-book counts (occ=1); baseline/ removed; TEST 69 pass / 1 todo / 0 fail, TYPECHECK clean · 655f73ac
- 2026-06-24 · Gate 7 · WILL NOT IMPLEMENT — content-addressed model already correct; collapse flag adds no value
