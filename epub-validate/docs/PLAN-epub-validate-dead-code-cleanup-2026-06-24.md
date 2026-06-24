# EPUB Validate Dead-Code Cleanup Plan

Date: 2026-06-24
Branch: `codex/epub-validate-dead-code-cleanup`
Status: `PLANNING`

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

Status: `COMMITTED` (pending Daniel's `bun run validate`)

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

Status: `PENDING`

Known candidates from Gate 2 audit:

- `assignReportNames` in `src/corpus.ts` — exported, zero importers.
- `hashBook` in `src/corpus.ts` — exported, only called internally; if
  `assignReportNames` goes away, `shortSha` and `reportFilename` in
  `HashedBook` become fully dead too, and `HashedBook` can be simplified or
  inlined.

Tasks:

- [ ] Confirm `assignReportNames` has no live importers, then delete it.
- [ ] Once `assignReportNames` is gone, remove `shortSha` and `reportFilename`
      from `HashedBook` and the corresponding initializations in `hashBook`.
- [ ] Evaluate whether `hashBook`/`HashedBook` should remain exported or be
      made internal to `corpus.ts`.
- [ ] Search for exports with no imports after Gates 1-2.
- [ ] Search for old inspect-era names: `epub-inspect`, `BookObservation`,
      `ParserPathAttempt`, `RunReport`, `shortSha`, `reportFilename`,
      `node-opened`, `storyteller-opened`, `browser-node-differ`.
- [ ] Classify each hit as one of:
      - active code
      - historical docs/archive
      - generated report fixture / intentional evidence
      - dead code candidate
- [ ] Add any dead code candidates to this plan as new gates before editing.

Verification:

```bash
bun run ci
# Daniel runs: bun run validate
git diff --exit-code -- reports
```

Commit:

- If no code changes: no commit.
- If docs inventory changes only: `docs(validate): record dead-code audit`.
- If more code is removed: use a focused `refactor(validate): ...` commit.

## Gate 4 — Final Invariance Check

Status: `PENDING`

Tasks:

- [ ] Run full CI.
- [ ] Run full validation.
- [ ] Confirm generated reports are unchanged.
- [ ] Inspect non-report generated diffs, especially `dist/epubts-browser.js`,
      before deciding whether to keep or revert them.

Verification:

```bash
bun run ci
# Daniel runs: bun run validate
git diff --exit-code -- reports
```

Commit:

- Only commit final cleanup adjustments if Gate 4 reveals necessary changes.
- Otherwise, no final code commit is needed beyond the previous gate commits.

## Initial Dead-Code Inventory

Known from initial search:

- `src/reports.ts` has no live import from the current runner. It imports the
  old model from `src/types.ts`, writes old `books/` style reports, and still
  identifies the runner as `epub-inspect`.
- `src/types.ts` is mixed. `RootName` and `RootConfig` are live. Many later
  exports appear tied to `src/reports.ts` and the old three-parser report model.
