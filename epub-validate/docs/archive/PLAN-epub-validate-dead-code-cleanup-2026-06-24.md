# EPUB Validate Dead-Code Cleanup Plan

Date: 2026-06-24
Branch: `codex/epub-validate-dead-code-cleanup`
Status: `COMPLETED`

## Goal

Remove stale inspect-era code left behind by the schema-first `epub-validate`
refactor without changing parser behavior, report semantics, or report bytes.

The cleanup starts with the known smell:

- `src/reports.ts` appears to be the old three-parser report writer.
- `src/types.ts` still mixes active root/corpus types with old inspect-era
  parser and report models.

As we discover more potentially dead code, handle it in progressive gates. Each
gate should be small enough to review independently and commit independently.

## Termination Criteria

The cleanup is complete only when both checks pass after the final gate:

- `bun run ci`
- `bun run validate` recreates the existing `reports/` tree with no report diff

For the final validation, run:

```bash
bun run ci
bun run validate
git diff --exit-code -- reports
```

`dist/epubts-browser.js` may be rebuilt by `bun run validate`; inspect any diff
before deciding whether it is expected generated output or an unintended change.

## Ground Rules

- Do not change parser adapter behavior.
- Do not change comparison semantics.
- Do not change generated report content or layout.
- Prefer deleting dead code over rewriting it.
- Before deleting a file or type, prove it has no live imports with `rg`.
- If a symbol is partly live, split the live part into a narrow module before
  deleting the dead part.
- Every commit requires the full gate verification below: `bun run ci`,
  Daniel-run `bun run validate`, and `git diff --exit-code -- reports`. Do not
  commit a gate on CI alone.
- Daniel runs `bun run validate`, not Codex. Codex may run `bun run ci` and
  inspect the post-validate diffs.
- Commit at the end of each completed gate only after its full verification
  passes.
- If discovery finds a non-obvious candidate, add it to this plan before
  deleting it.
- Keep active planning and findings documents in `docs/`. Move superseded
  material to `docs/archive/`.

## Gate 0 — Docs Convention, Baseline, And Inventory

Status: `COMPLETED`

Tasks:

- [x] Create branch `codex/epub-validate-dead-code-cleanup`.
- [x] Confirm worktree starts clean.
- [x] Make `docs/` the home for active plans, designs, and findings.
- [x] Move completed/superseded refactor plan and design to `docs/archive/`.
- [x] Keep the consolidated findings in `docs/` while README TODOs still depend
      on that context.
- [x] Update README to own the live TODO list and document the `docs/` /
      `docs/archive/` convention.
- [x] Search for references to `src/reports.ts`, `generateReports`, and legacy
      `src/types.ts` symbols.
- [x] Capture a concise dead-code inventory in this plan.
- [x] Review and approve this plan before code deletion begins.

Verification:

```bash
bun run ci
# Daniel runs: bun run validate
git diff --exit-code -- reports
```

`git status --short --branch` should show only intentional docs changes plus any
expected non-report generated files, which must be inspected before commit.

Commit:

- `docs(validate): organize cleanup planning`

## Gate 1 — Remove Legacy Report Writer

Status: `COMPLETED`

Known candidate:

- `src/reports.ts`

Tasks:

- [x] Confirm no live import path reaches `src/reports.ts`.
- [x] Delete `src/reports.ts`.
- [x] Remove or update stale references in docs only if they describe current
      state incorrectly. Avoid rewriting historical archive docs unless needed.
- [x] Run `bun run ci`.
- [x] Daniel runs `bun run validate`.
- [x] Confirm `git diff --exit-code -- reports`.
- [x] Inspect any non-report generated diffs.

Verification:

```bash
bun run ci
# Daniel runs: bun run validate
git diff --exit-code -- reports
```

Commit:

- `refactor(validate): remove legacy report writer`

## Gate 2 — Split Active Root Types From Legacy Inspect Types

Status: `COMPLETED`

Known candidate:

- `src/types.ts`

Audit findings:

- Live imports: `RootName`, `RootConfig`, `DiscoveredBook`, `HashedBook`.
- `RootName` and `RootConfig` moved to `src/config.ts` (that module already
  owns the `ROOTS` constant and `PARSER_NAMES`).
- `DiscoveredBook` and `HashedBook` moved inline to `src/corpus.ts` (they
  have no other importers). `parserAttempts` removed from `HashedBook` — it
  was always initialized to `{}` and never read.
- All other symbols (`ParserPathAttempt` and its union, `BookObservation`,
  `BookInventoryEntry`, `RunReport`, `BrowserHarnessResult`, `BrowserRuntime`,
  `FieldComparison`, `MetadataComparison`, `ParserName` duplicate, etc.) had
  zero live imports and were deleted with the file.

Dead code spotted for Gate 3:

- `assignReportNames` in `src/corpus.ts` is exported but has no importers.
- `hashBook` is exported but only called internally in `discoverInventory`.
  Its `shortSha`/`reportFilename` fields in `HashedBook` are still initialized
  to `""` but are only written by `assignReportNames` (dead) and never read.

Tasks:

- [x] Audit every exported symbol in `src/types.ts`.
- [x] Move live shared root/corpus types to a narrow module, likely
      `src/corpus-types.ts` or directly into `src/corpus.ts` / `src/config.ts`
      if that fits existing ownership better.
- [x] Update imports in `src/config.ts`, `src/corpus.ts`,
      `src/corpus.test.ts`, and `src/report-writer.ts`.
- [x] Delete legacy inspect-era types once no live imports remain.
- [x] Delete `src/types.ts` if nothing meaningful remains.

Verification:

```bash
bun run ci
# Daniel runs: bun run validate
git diff --exit-code -- reports
```

Commit:

- `refactor(validate): narrow shared corpus types`

## Gate 3 — Search For Additional Dead Code

Status: `COMPLETED`

Known candidates from Gate 2 audit (confirmed and resolved):

- `assignReportNames` — deleted (zero importers; `normalizeReportPath` deleted
  with it).
- `HashedBook` — simplified: `shortSha` and `reportFilename` removed; type
  made private; inlined as `DiscoveredBook & { size; sha256 }` in `hashBook`.
- `discoverBooks`, `hashBook`, `DiscoveredBook`, `CorpusOccurrence`,
  `RootDiscovery` — all made private (no external importers).

Additional dead exports found via `bunx knip` and resolved:

- `config.ts`: deleted `PARSER_NAMES` (only used by deleted `types.ts`),
  `TEMP_REPORTS_DIRECTORY`, `BACKUP_REPORTS_DIRECTORY`, `REPORT_SCHEMA_VERSION`.
- `schema.ts`: unexported 17 intermediate zod schemas (building blocks only
  used within the file); deleted 8 dead type aliases (`OpenStatus`, `DomParser`,
  `OpenFailure`, `Meta`, `Metadata`, `Content`, `PairFieldStatus`,
  `MetadataComparison`).
- `report-writer.ts`: made `RUN_MANIFEST_SCHEMA_VERSION` private.
- `compare.ts`: made `BaselineField` private.
- `epubts-utils.ts`: made `EPUBTS_ZERO_DATE` private.
- Added `knip.json` to declare runtime entry points (`browser/entry.ts`,
  `epubts-node-worker.ts`, `storyteller-worker.ts`) so future knip runs are
  clean.

Tasks:

- [x] Confirm `assignReportNames` has no live importers, then delete it.
- [x] Once `assignReportNames` is gone, remove `shortSha` and `reportFilename`
      from `HashedBook` and the corresponding initializations in `hashBook`.
- [x] Evaluate whether `hashBook`/`HashedBook` should remain exported or be
      made internal to `corpus.ts`.
- [x] Search for exports with no imports after Gates 1-2.
- [x] Search for old inspect-era names: `epub-inspect`, `BookObservation`,
      `ParserPathAttempt`, `RunReport`, `shortSha`, `reportFilename`,
      `node-opened`, `storyteller-opened`, `browser-node-differ`.
- [x] Classify each hit as one of:
      - active code
      - historical docs/archive
      - generated report fixture / intentional evidence
      - dead code candidate
- [x] Add any dead code candidates to this plan as new gates before editing.

Verification:

```bash
bun run ci
# Daniel runs: bun run validate
git diff --exit-code -- reports
```

Commit:

- `refactor(validate): dead-code audit and cleanup`

## Gate 4 — Final Invariance Check

Status: `COMPLETED`

Tasks:

- [x] Run full CI.
- [x] Run full validation.
- [x] Confirm generated reports are unchanged.
- [x] Inspect non-report generated diffs, especially `dist/epubts-browser.js`,
      before deciding whether to keep or revert them.

Verification:

```bash
bun run ci
# Daniel runs: bun run validate
git diff --exit-code -- reports
```

Commit:

- No additional commit needed — Gate 3 covered all changes.

## Initial Dead-Code Inventory

Known from initial search:

- `src/reports.ts` has no live import from the current runner. It imports the
  old model from `src/types.ts`, writes old `books/` style reports, and still
  identifies the runner as `epub-inspect`.
- `src/types.ts` is mixed. `RootName` and `RootConfig` are live. Many later
  exports appear tied to `src/reports.ts` and the old three-parser report model.

## Progress Log

### Gate 3 — tooling note

`bunx knip` (v6.20.0) was used to find unused exports, files, and
dependencies. It caught significantly more dead surface than manual `rg`
searches alone — 25 unused exports and 4 dead exported types beyond what the
initial audit identified. For future cleanup passes, run:

```bash
bunx knip
```

A `knip.json` was added to the project declaring the three runtime entry points
that `knip` cannot discover via static imports (`src/browser/entry.ts`,
`src/epubts-node-worker.ts`, `src/storyteller-worker.ts`). Without it, knip
reports those files and their dependencies as false positives.
