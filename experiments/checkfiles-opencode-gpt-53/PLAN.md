# PLAN.md - checkfiles-opencode-gpt-53

## Harness

- Agent: OpenCode (`openai/gpt-5.3-codex`)
- Workflow: phase-by-phase review and commit by user
- CI gate: run `bun run ci` after edits; if needed run `bun run fmt` then rerun
  `bun run ci`

## Goal

Implement the `checkfiles` seed as a deterministic filesystem validation CLI/TUI
using Bun, TypeScript, OpenTUI, and commander.

## Milestones

### Phase 1 - Scaffold + scripts + env/config validation

- [x] Create experiment scaffold (`README.md`, `AGENTS.md`, `PLAN.md`,
      `.gitignore`, `.env.example`)
- [x] Configure Bun scripts (`lint`, `check`, `test`, `fmt`, `fmt:check`, `ci`)
- [x] Configure TypeScript/OpenTUI compiler settings
- [x] Implement CLI parsing (`-r, --rootpath`) with commander
- [x] Implement root path resolution order (flag, then `ROOT_PATH` from env)
- [x] Implement startup root path validation (exists, directory, readable)
- [x] Add tests for config and basic CLI behavior
- [x] CI green

### Phase 2 - Deterministic traversal engine + node record lifecycle

- [x] Implement strict single-process sequential traversal
- [x] Implement two-phase directory lifecycle (`dir-pre`, `dir-post`) and file
      phase (`file`)
- [x] Ensure hidden/symlink entries are emitted but never traversed
- [x] Enforce deterministic lexical ordering by full `relativePath`
- [x] Implement one-record-per-node lifecycle updates
- [x] Add traversal and lifecycle tests
- [x] CI green

### Phase 3 - Validation rules + fail-fast error handling

- [x] Implement validation rules (mode, xattrs, hidden, symlink)
- [x] Implement derived fields (`modePerm`, validity flags, violations)
- [x] Ensure fatal failures bubble to top-level error handler
- [x] Add validation tests
- [x] CI green

### Phase 4 - xattr helpers + integration tests + strategy notes

- [x] Implement xattr collection using Bun subprocess and system `xattr`
- [x] Filter `com.apple.provenance`
- [x] Fail fast if xattr binary missing
- [x] Fail run on per-path xattr command failure
- [x] Add xattr integration tests under gitignored `data/`
- [x] Record `xattr -r` / `xattr -rl` research and strategy decision in this file
- [x] CI green

### Phase 5 - OpenTUI progress view

- [x] Implement renderer lifecycle (`exitOnCtrlC`, `useAlternateScreen`)
- [x] Implement progress stack view and aggregate metrics
- [x] Implement elapsed and ETA display
- [x] Ensure `renderer.destroy()` on all exits/errors
- [x] Add progress logic tests
- [x] CI green

### Phase 6 - OpenTUI results table

- [x] Implement interactive table with sticky header
- [x] Implement columns (`mode`, `xattrs`, `path`) and default path ascending
      sort
- [x] Implement keybindings (scroll, reverse, quit, top/bottom fallbacks)
- [x] Implement colorized validation fields and control legend
- [x] Keep canonical path sort semantics and deterministic tie behavior
- [x] Add results formatting/sorting tests
- [x] CI green

### Phase 7 - Violations-only filter

- [x] Implement `v` toggle (`all` vs `violations-only`)
- [x] Include ancestor context rows (deduped, dimmed)
- [x] Keep canonical ordering in filtered mode
- [x] Add filtering tests
- [x] CI green

### Phase 8 - Polish / refactor / docs

- [ ] Final docs cleanup (`README.md` usage and keybindings)
- [ ] Code audit for seed compliance
- [ ] CI green

## Decisions / Notes

- Phase 1 completed with minimal non-TUI entrypoint (`src/index.ts`) that only
  validates startup config; traversal/TUI work begins in later phases.
- Phase 2 keeps traversal model minimal (`relativePath`, `basename`, `stat`,
  `xattrs`) and carries lifecycle in traversal events (`dir-pre`, `dir-post`,
  `file`) to avoid redundant persisted derived fields.
- Phase 3 introduces a separate validation/derivation layer (`buildInspectedRecord`)
  so traversal remains raw and deterministic while UI/reporting can consume the
  full required record shape.
- After user review, Phase 3 was simplified to reduce intermediate types:
  inspected-record type moved to `src/types.ts`, validation builder collapsed to
  a single `inspectNode()` function, and scan pipeline kept minimal.
- Phase 4 xattr findings:
  - `xattr -r <root>` outputs one line per path/attribute in the form
    `<path>: <attr>`.
  - `xattr -rl <root>` appends values in the form `<path>: <attr>: <value>`,
    and binary-like values are not stable for strict machine parsing without
    extra normalization.
  - Both recursive formats are parseable but awkward for unusual filenames and
    value payloads; per-path `xattr <path>` is simpler and less error-prone.
  - Decision: keep per-path xattr calls for correctness and clarity; revisit
    recursive bulk mode only if profiling shows subprocess overhead is material.
  - `xattr -px <attr> <path>` returns hex with spacing (for example `00 FF 7F`),
    so any future value-level parsing should normalize whitespace.
- Phase 5 keeps progress UI intentionally narrow: scan mutates `ScanState`, App
  polls immutable snapshots, and renderer lifecycle is explicit in
  `startTui()/destroy()`.
- Phase 6 keeps results sorting scope narrow (path only), with keyboard reverse
  and canonical lexical compare over full `relativePath`.
- Phase 7 adds `violations-only` as a view filter (not a new sort mode):
  violating rows stay authoritative, ancestor rows are context-only and dimmed.

## Session Audit Trail

- 2026-03-03 15:07 local - Session started by user. Requested phase-by-phase
  implementation with PLAN.md progress tracking and user review/commit at each
  phase.
- 2026-03-03 15:09 local - Phase 1 completed. Added scaffold, Bun scripts,
  TypeScript/ESLint config, `.env`/`.env.example`, config resolution/validation,
  and initial CLI/config tests. CI green (`bun run ci`).
- 2026-03-03 15:15 local - Phase 2 completed. Added traversal engine and raw
  node model (`src/traverse.ts`, `src/types.ts`) with deterministic lexical
  ordering, two-phase directory lifecycle, hidden/symlink non-recursion rules,
  and traversal tests (`src/traverse.test.ts`). CI green (`bun run ci`).
- 2026-03-03 15:37 local - Phase 3 completed. Added derived inspected-record
  builder (`src/validate.ts`), scan pipeline (`src/scan.ts`), top-level fatal
  error handling in CLI (`src/index.ts`), and tests for validation/fail-fast
  behavior (`src/validate.test.ts`, `src/scan.test.ts`, `src/index.test.ts`).
  CI green (`bun run ci`).
- 2026-03-03 15:40 local - Phase 3 refinement per user feedback. Reduced
  unnecessary intermediate typing and helper layering in validation code while
  keeping behavior unchanged. CI green (`bun run ci`).
- 2026-03-03 15:44 local - Phase 4 completed. Added xattr helpers
  (`src/xattr.ts`), wired scan to collect xattrs by default (`src/scan.ts`),
  added startup xattr availability check (`src/index.ts`), and added xattr
  integration tests (`src/xattr.test.ts`). Recorded xattr recursive-output
  research and strategy decision. CI green (`bun run ci`).
- 2026-03-03 15:48 local - Phase 5 completed. Added OpenTUI progress renderer
  and app (`src/tui/render.tsx`, `src/tui/App.tsx`, `src/tui/ProgressView.tsx`),
  mutable scan-state bridge (`src/tui/scan-state.ts`), wired traversal events to
  progress updates in CLI (`src/index.ts`), and added progress logic tests
  (`src/tui/scan-state.test.ts`). CI green (`bun run ci`).
- 2026-03-03 15:51 local - Phase 6 completed. Added results table view
  (`src/tui/ResultsTable.tsx`) and formatting helpers (`src/tui/format.ts`) with
  tests (`src/tui/format.test.ts`), wired app to switch from progress to results
  after scan completion, and kept canonical path sort + reverse keybindings.
  CI green (`bun run ci`).
- 2026-03-03 15:53 local - Phase 7 completed. Added `v` filter toggle in
  results table, ancestor context row support with dedupe/dim rendering,
  canonical order retention in filtered mode, and filtering helpers/tests
  (`ancestorPaths`, `filterViolations`) in `src/tui/format.ts` and
  `src/tui/format.test.ts`. CI green (`bun run ci`).
