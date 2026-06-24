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

The cleanup is complete only when both checks pass:

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
- Commit at the end of each completed gate after its verification passes.
- If discovery finds a non-obvious candidate, add it to this plan before
  deleting it.
- Keep active planning and findings documents in `docs/`. Move superseded
  material to `docs/archive/`.

## Gate 0 — Docs Convention, Baseline, And Inventory

Status: `IN PROGRESS`

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

- `git status --short --branch` shows only intentional docs changes.

Commit:

- `docs(validate): organize cleanup planning`

## Gate 1 — Remove Legacy Report Writer

Status: `PENDING`

Known candidate:

- `src/reports.ts`

Tasks:

- [ ] Confirm no live import path reaches `src/reports.ts`.
- [ ] Delete `src/reports.ts`.
- [ ] Remove or update stale references in docs only if they describe current
      state incorrectly. Avoid rewriting historical archive docs unless needed.
- [ ] Run focused verification.

Verification:

```bash
bun run ci
```

Commit:

- `refactor(validate): remove legacy report writer`

## Gate 2 — Split Active Root Types From Legacy Inspect Types

Status: `PENDING`

Known candidate:

- `src/types.ts`

Current live surface appears to be:

- `RootName`
- `RootConfig`
- possibly corpus discovery/hash types if still used by `src/corpus.ts`

Tasks:

- [ ] Audit every exported symbol in `src/types.ts`.
- [ ] Move live shared root/corpus types to a narrow module, likely
      `src/corpus-types.ts` or directly into `src/corpus.ts` / `src/config.ts`
      if that fits existing ownership better.
- [ ] Update imports in `src/config.ts`, `src/corpus.ts`,
      `src/corpus.test.ts`, and `src/report-writer.ts`.
- [ ] Delete legacy inspect-era types once no live imports remain.
- [ ] Delete `src/types.ts` if nothing meaningful remains.

Verification:

```bash
bun run ci
```

Commit:

- `refactor(validate): narrow shared corpus types`

## Gate 3 — Search For Additional Dead Code

Status: `PENDING`

Tasks:

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
bun run validate
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
