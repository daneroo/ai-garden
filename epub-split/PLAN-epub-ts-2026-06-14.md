# Validate epub.ts Against epub.js

Date: 2026-06-14

## Objective

Validate that `@likecoin/epub-ts/node` reproduces the epub.js behavior this
project relies on, while running directly in Node without Playwright.

During this experiment:

- Browser `epubjs@0.3.93`, invoked through Playwright, is the reference.
- `@likecoin/epub-ts/node` is the candidate.
- `compare` is a fixed reference-versus-candidate mode.
- Parsing is sequential: epub.js first, then epub.ts.
- Lingo is removed from the active implementation.

After equivalence is demonstrated to our satisfaction, removal of epub.js and
Playwright requires explicit approval. The project will then become a
single-parser EPUB validator for the structural and content invariants we care
about.

Storyteller evaluation is intentionally outside this plan.

## Working Branch

Begin implementation on:

```bash
git switch -c feature/epub-split-epubts
```

Do not create the branch as part of planning.

## Principles

- Keep `ParserResult` as the typed, parser-neutral comparison boundary.
- Keep adapter transformations minimal and symmetric.
- Start with strict equality at every stage.
- Add normalization only after a real corpus mismatch demonstrates the need.
- Document every normalization and never use it to hide missing information.
- Collect all useful differences for a book instead of returning after the
  first mismatch.
- A candidate improvement over an epub.js bug is not automatically a failure.
- Do not add automated tests; this is a corpus-validation experiment.
- Continue running both Deno and Node type-checks until a concrete incompatibility
  requires reconsidering Deno.
- Do not add JSON output or benchmark instrumentation.

## CLI During Validation

Parser modes:

```text
-p epubjs   Playwright/browser reference
-p epubts   Node candidate
-p compare  Fixed epubjs versus epubts comparison
```

`compare` becomes the default during the experiment.

Verbosity retains the current yargs count behavior:

- No `-v`: verbosity 0
- `-v`: verbosity 1
- `-vv` or `-v -v`: verbosity 2

Presentation behavior:

- Verbosity 0: concise mismatch categories and final totals.
- Verbosity 1: parser failures and up to 15 details per mismatch category.
- Verbosity 2: all differences and relevant side-by-side diagnostics.
- Truncation affects presentation only, never comparison totals.

## Corpus Domains

- `test`: checked-in Gutenberg books for fast, reproducible iteration.
- `space`: primary real-world corpus and the main validation gate.
- `drop`: overlapping secondary corpus, used after `space` to expose books not
  present there and path or storage-specific behavior.

Do not combine `space` and `drop` totals because the corpora substantially
overlap. Do not implement deduplication unless overlap becomes an actual
operational problem.

Use shell timing only:

```bash
time pnpx tsx index.ts -r test -p compare
time pnpx tsx index.ts -r space -p compare
time pnpx tsx index.ts -r drop -p compare
```

## Reports and Findings

Keep manual Markdown report generation under the existing `data/reports/`
convention:

```text
data/reports/parser-validation-space-epubjs.md
data/reports/parser-validation-drop-epubjs.md
data/reports/parser-validation-space-epubts.md
data/reports/parser-validation-drop-epubts.md
data/reports/epubjs-vs-epubts-test.md
data/reports/epubjs-vs-epubts-space.md
data/reports/epubjs-vs-epubts-drop.md
```

The CLI does not write reports automatically. Redirect output as needed. These
reports are local generated evidence under the ignored `data/` directory and
must not remain tracked in Git.

Create `FINDINGS-epub-ts-2026-06-14.md` only when the first meaningful mismatch
needs interpretation, or when recording the final conclusion. Reports contain
raw evidence; the findings document records:

- Root cause of each meaningful mismatch class.
- Classification and whether it blocks acceptance.
- Normalizations introduced and their justification.
- Relevant report or book references.
- Final equivalence decision.

Leave existing Lingo reports and historical plans unchanged.

## Phase 0: Standalone Parser Baselines

This phase is a hard gate before any `compare` corpus run. Validate each parser
independently so comparison cannot hide a broken adapter or a changed reference.

- [x] Run `epubjs` alone over the complete `space` corpus and save
      `data/reports/parser-validation-space-epubjs.md`.
- [x] Run `epubjs` alone over the complete `drop` corpus and save
      `data/reports/parser-validation-drop-epubjs.md`.
- [x] Compare fresh epub.js reports with the historical reports. Corpus counts
      may grow, but the baseline behavior must remain the same: complete every
      book and emit no new per-book error sections.
- [x] Investigate and resolve every epub.js baseline regression before
      proceeding.
- [x] Run `epubts` alone over the complete `space` corpus and save
      `data/reports/parser-validation-space-epubts.md`.
- [x] Run `epubts` alone over the complete `drop` corpus and save
      `data/reports/parser-validation-drop-epubts.md`.
- [x] Require both epub.ts runs to attempt every discovered book and finish
      with zero unclassified parse failures.
- [x] Record any compatibility workaround as a visible parser warning and in
      `FINDINGS-epub-ts-2026-06-14.md`; do not silently normalize failures.
- [x] Do not resume `compare` on `space` or `drop` until this phase is complete.
- [x] Remove the four force-added `parser-validation-*-epubjs.md` and
      `parser-validation-*-epubts.md` files from Git tracking with
      `git rm --cached`, while preserving the local files under ignored
      `data/reports/`. Do not remove or modify `data/reports-orig/`.

Standalone report commands:

```bash
pnpx tsx index.ts -p epubjs -r space > data/reports/parser-validation-space-epubjs.md
pnpx tsx index.ts -p epubjs -r drop > data/reports/parser-validation-drop-epubjs.md
pnpx tsx index.ts -p epubts -r space > data/reports/parser-validation-space-epubts.md
pnpx tsx index.ts -p epubts -r drop > data/reports/parser-validation-drop-epubts.md
```

## Failure Model

Each adapter must capture book-specific failures independently.

- A successful parse returns the parsed result and any parser warnings.
- A book-specific failure records parser, stage, category, and message.
- One parser failing does not terminate the corpus run.
- Both parsers failing is recorded and is not automatically equivalence.
- Setup or system failures abort immediately so they can be corrected before a
  corpus run.
- Unexpected programming invariant failures abort because continuing could
  invalidate the experiment.

Comparison messages use:

- `reference (epubjs)`
- `candidate (epubts)`

The comparison functions derive concrete names from `ParserResult.parser`,
while the CLI guarantees reference-first ordering.

Classify investigated mismatches as:

- `candidate regression`
- `reference bug fixed by candidate`
- `representation difference`
- `normalization needed`
- `unresolved`

Candidate regressions block acceptance. Other categories require documentation
and judgment.

## Phase 1: Atomic Adapter Switch

This phase must be one coherent, runnable checkpoint. Do not leave `compare`
without a second parser.

- [x] Add `@likecoin/epub-ts` and its Node peer dependency, `linkedom`, with
      pnpm.
- [x] Add an `epubts` adapter using `@likecoin/epub-ts/node`.
- [x] Read each EPUB with `node:fs/promises` and pass an exact sliced
      `ArrayBuffer` to epub.ts.
- [x] Reuse the existing epub.js extraction semantics where necessary: the
      same readiness points, selected fields, TOC traversal, spine lookup, and
      content extraction behavior. Do not use Playwright in the epub.ts adapter.
- [x] Change fixed `compare` mode to epub.js reference versus epub.ts candidate.
- [x] Make `compare` the default CLI parser mode.
- [x] Add `epubts` and remove `lingo` from parser choices.
- [x] Generalize hard-coded Lingo/epub.js parameter names and messages to
      reference/candidate terminology.
- [x] Remove the Lingo adapter and `@lingo-reader/epub-parser` dependency.
- [x] Remove Lingo-specific warning handling.
- [x] Remove `jsdom` and `@types/jsdom`; retain `zod` while Playwright remains.
- [x] Preserve sequential parsing: epub.js first, epub.ts second.
- [x] Run Node and Deno type-checks.
- [x] Run the initial comparison on the `test` domain.

Checkpoint commit:

```text
refactor: replace lingo comparison with epubts
```

## Phase 2: Parse Outcome and Manifest

Validate one stage across the primary corpus before adding the next stage.

- [x] Compare independent parser success and failure outcomes.
- [x] Compare manifest values strictly before adding normalization.
- [x] Report manifest count differences without returning early.
- [x] Report keys missing from either side.
- [x] Report all relevant field differences for common entries.
- [x] Run `test`, then the complete `space` corpus.
- [x] Investigate and classify all meaningful mismatch patterns.
- [x] Add only narrowly justified manifest normalization, if required.
- [x] Run `drop` after `space` and investigate unique or path-specific results.
- [x] Save Markdown reports under `data/reports/`.

The first checkpoint commit already introduces manifest comparison. Additional
commits are allowed when investigation reveals a coherent manifest-specific
fix, but every commit must leave the experiment runnable.

## Phase 3: Spine and Reading Order

Do not start until parse outcome and manifest behavior are understood on
`space`.

- [x] Add the minimal spine representation required to `ParserResult`.
- [x] Extract it symmetrically from both adapters.
- [x] Compare strict ordered spine values first.
- [x] Preserve IDs, hrefs, ordering, and linearity where available.
- [x] Run `test`, then `space`, then `drop`.
- [x] Investigate and classify all meaningful differences before proceeding.

Checkpoint commit:

```text
feat: compare epub spine reading order
```

## Phase 4: Table of Contents

Do not start until spine behavior is understood on `space`.

- [x] Enable TOC comparison in `compareBook()`.
- [x] Remove remaining parser-specific assumptions from TOC comparison.
- [x] Compare strict TOC values before normalization.
- [x] Compare presence, labels, hrefs, order, and tree depth.
- [x] Preserve fragments, IDs, order, and nesting.
- [x] Add label whitespace or href normalization only when demonstrated by a
      real mismatch and recorded in findings.
- [x] Improve comparison handling for duplicate labels or hrefs if the corpus
      demonstrates that the existing set-based approach is insufficient.
- [x] Run `test`, then `space`, then `drop`.
- [x] Investigate and classify all meaningful differences before proceeding.

Checkpoint commit:

```text
feat: compare epub table of contents
```

## Phase 5: Metadata

Do not start until TOC behavior is understood on `space`.

- [x] Add only the metadata fields required for the comparison to
      `ParserResult`.
- [x] Extract the same metadata semantics from both adapters.
- [x] Compare strict values first, including multiplicity and ordering where
      observable and meaningful.
- [x] Add normalization only in response to explained corpus differences.
- [x] Run `test`, then `space`, then `drop`.
- [x] Investigate and classify all meaningful differences before proceeding.

Checkpoint commit:

```text
feat: compare epub metadata
```

## Phase 6: Chapter Content

Do not start until metadata behavior is understood on `space`.

- [ ] Add chapter results incrementally to `ParserResult`.
- [ ] Associate chapter content with ordered spine entries by ID and href.
- [ ] Start with raw chapter XHTML equality.
- [ ] Only when raw equality fails, compare canonically serialized DOM output.
- [ ] Only when canonical DOM equality fails, compare normalized extracted text.
- [ ] Treat similarity metrics as diagnostics only, never equality.
- [ ] Report the strictest level at which each chapter matches.
- [ ] For text mismatches, report lengths, stable hashes, and the first useful
      differing region.
- [ ] Run `test`, then `space`, then `drop`.
- [ ] Investigate and classify all meaningful differences.

Checkpoint commit:

```text
feat: compare epub chapter content
```

## Phase 7: Record the Decision

- [ ] Ensure final `test`, `space`, and `drop` reports are saved.
- [ ] Summarize explained differences and normalizations in
      `FINDINGS-epub-ts-2026-06-14.md`.
- [ ] State whether epub.ts is equivalent for the EPUB behavior this project
      requires.
- [ ] Record any accepted epub.ts improvements over epub.js reference behavior.
- [ ] Request explicit approval before removing epub.js or Playwright.

Checkpoint commit:

```text
docs: record epubts corpus validation findings
```

## Gated Phase 8: Remove the Reference Stack

Do not perform this phase without explicit approval after review of the corpus
reports and findings.

- [ ] Remove `epubjs` and `playwright` dependencies.
- [ ] Delete the Playwright epub.js adapter and browser helper.
- [ ] Delete `playwrightMaxSize.ts` if it has no remaining purpose.
- [ ] Remove obsolete Playwright-only support dependencies and code.
- [ ] Remove `epubjs` and `compare` CLI modes.
- [ ] Keep `epubts` as the sole parser and default.
- [ ] Retain `linkedom` as the Node DOM implementation.
- [ ] Run Node and Deno type-checks, reconsidering Deno only if a concrete
      incompatibility remains.

Checkpoint commit:

```text
refactor: remove epubjs playwright reference
```

## Gated Phase 9: Redefine the Project

Do not perform this phase without explicit approval.

- [ ] Rewrite the README around the final objective: use one epub.ts parser to
      validate every EPUB against the requirements and invariants we care about.
- [ ] Remove comparison-era usage instructions that no longer apply.
- [ ] Preserve the historical plans and reports as experimental evidence until
      a separate cleanup decision is made.
- [ ] Identify the first concrete EPUB invariants to enforce in subsequent work.

Checkpoint commit:

```text
docs: redefine epub validation objectives
```

## Completion Criteria

This plan is complete when one of these conclusions is documented:

1. epub.ts is accepted as equivalent for our requirements, the gated cleanup is
   approved and completed, and the repository is reoriented toward EPUB
   invariant validation.
2. epub.ts has unresolved or unacceptable regressions, Playwright remains, and
   the findings clearly document why replacement was rejected or deferred.
