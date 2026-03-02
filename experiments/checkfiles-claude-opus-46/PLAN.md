# PLAN.md — checkfiles-claude-opus-46

## Harness

- Agent: Claude Code (Opus 4.6)
- CI gate: `deno task ci` after every edit

## Goal

Implement the `checkfiles` seed: a deterministic filesystem validation CLI/TUI
using Deno, OpenTUI, and React.

## Milestones

### Phase 1 — Scaffold + Deno tasks + env/config validation

- [ ] deno.json with tasks, JSX config, dependencies
- [ ] .env.example and .gitignore
- [ ] CLI flag parsing (`-r, --rootpath`)
- [ ] Root path resolution (flag > env > fail fast)
- [ ] Root path validation (exists, directory, readable)
- [ ] CI green

### Phase 2 — Deterministic traversal engine + node record lifecycle

- [ ] Test fixture helper: programmatic setup/teardown in gitignored `data/`
- [ ] FileNode record type (kind, phase, status, metadata fields)
- [ ] Two-phase directory visitation (dir-pre / dir-post)
- [ ] Single-record-per-node data model
- [ ] Deterministic child sorting (locale-independent comparator)
- [ ] Hidden/symlink skip rules (no recurse, but emit violation record)
- [ ] Integration tests for traversal order and two-phase emission (fixtures
      cover: normal files/dirs, hidden entries, symlinks)
- [ ] CI green

### Phase 3 — Validation rules + warnings/errors

- [ ] Mode validation (file 0644, dir 0755)
- [ ] xattr validation (must be empty)
- [ ] Hidden entry violation flagging
- [ ] Symlink violation flagging
- [ ] Violation list per record
- [ ] Integration tests with fixtures (non-standard perms, hidden, symlinks)
- [ ] CI green

### Phase 4 — xattr helpers + integration tests

- [ ] Research: xattr -r / xattr -rl behavior (record findings here)
- [ ] xattr collection via Deno.Command subprocess
- [ ] Parse stdout as newline-delimited attribute names
- [ ] Per-attr hex value reads (xattr -px)
- [ ] Fail fast if xattr command missing
- [ ] Graceful per-path failure (warning + empty array)
- [ ] Integration tests: fixtures with xattrs set/cleared via real xattr calls
- [ ] CI green

### Phase 5 — OpenTUI progress view

- [ ] Renderer setup (exitOnCtrlC, useAlternateScreen)
- [ ] Progress component: path stack, aggregate summary
- [ ] Elapsed time, rate-based ETA
- [ ] In-progress directory dimming
- [ ] Cleanup on exit/error
- [ ] CI green

### Phase 6 — OpenTUI results table

- [ ] Scrollable table with header pinned
- [ ] Columns: mode (ls-like), path (compact/indented), xattrs
- [ ] Keyboard controls (q/esc, arrows, sort cycling, reverse, jump)
- [ ] Sort by path and xattrs with relativePath tie-breaker
- [ ] Violation colorization (red)
- [ ] Legend bar
- [ ] Tests for compact path rendering and canonical sort
- [ ] CI green

### Phase 7 — Violations-only filter

- [ ] Toggle with `v` key
- [ ] Show only rows with violations > 0
- [ ] Include ancestor directories as dim context rows
- [ ] De-duplicate shared ancestors
- [ ] Maintain canonical path order
- [ ] Tests for filter behavior
- [ ] CI green

### Phase 8 — Polish / refactor / docs

- [ ] README updates with usage instructions
- [ ] Code cleanup
- [ ] Final CI green

## Decisions / Notes

- Test fixtures are programmatically created in gitignored `data/` — no
  checked-in fixture assets. Each test handles its own setup/teardown.

## Session Audit Trail

- Session 1: Scaffolded experiment structure (README, AGENTS, CLAUDE, PLAN,
  deno.json, placeholder src/index.ts)
