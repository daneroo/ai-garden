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

- [ ] Implement strict single-process sequential traversal
- [ ] Implement two-phase directory lifecycle (`dir-pre`, `dir-post`) and file
      phase (`file`)
- [ ] Ensure hidden/symlink entries are emitted but never traversed
- [ ] Enforce deterministic lexical ordering by full `relativePath`
- [ ] Implement one-record-per-node lifecycle updates
- [ ] Add traversal and lifecycle tests
- [ ] CI green

### Phase 3 - Validation rules + fail-fast error handling

- [ ] Implement validation rules (mode, xattrs, hidden, symlink)
- [ ] Implement derived fields (`modePerm`, validity flags, violations)
- [ ] Ensure fatal failures bubble to top-level error handler
- [ ] Add validation tests
- [ ] CI green

### Phase 4 - xattr helpers + integration tests + strategy notes

- [ ] Implement xattr collection using Bun subprocess and system `xattr`
- [ ] Filter `com.apple.provenance`
- [ ] Fail fast if xattr binary missing
- [ ] Fail run on per-path xattr command failure
- [ ] Add xattr integration tests under gitignored `data/`
- [ ] Record `xattr -r` / `xattr -rl` research and strategy decision in this file
- [ ] CI green

### Phase 5 - OpenTUI progress view

- [ ] Implement renderer lifecycle (`exitOnCtrlC`, `useAlternateScreen`)
- [ ] Implement progress stack view and aggregate metrics
- [ ] Implement elapsed and ETA display
- [ ] Ensure `renderer.destroy()` on all exits/errors
- [ ] Add progress logic tests
- [ ] CI green

### Phase 6 - OpenTUI results table

- [ ] Implement interactive table with sticky header
- [ ] Implement columns (`mode`, `xattrs`, `path`) and default path ascending
      sort
- [ ] Implement keybindings (scroll, reverse, quit, top/bottom fallbacks)
- [ ] Implement colorized validation fields and control legend
- [ ] Keep canonical path sort semantics and deterministic tie behavior
- [ ] Add results formatting/sorting tests
- [ ] CI green

### Phase 7 - Violations-only filter

- [ ] Implement `v` toggle (`all` vs `violations-only`)
- [ ] Include ancestor context rows (deduped, dimmed)
- [ ] Keep canonical ordering in filtered mode
- [ ] Add filtering tests
- [ ] CI green

### Phase 8 - Polish / refactor / docs

- [ ] Final docs cleanup (`README.md` usage and keybindings)
- [ ] Code audit for seed compliance
- [ ] CI green

## Decisions / Notes

- Phase 1 completed with minimal non-TUI entrypoint (`src/index.ts`) that only
  validates startup config; traversal/TUI work begins in later phases.

## Session Audit Trail

- 2026-03-03 15:07 local - Session started by user. Requested phase-by-phase
  implementation with PLAN.md progress tracking and user review/commit at each
  phase.
- 2026-03-03 15:09 local - Phase 1 completed. Added scaffold, Bun scripts,
  TypeScript/ESLint config, `.env`/`.env.example`, config resolution/validation,
  and initial CLI/config tests. CI green (`bun run ci`).
