# PLAN.md — checkfiles-claude-opus-46

## Harness

- Agent: Claude Code (Opus 4.6)
- CI gate: `deno task ci` after every edit

## Goal

Implement the `checkfiles` seed: a deterministic filesystem validation CLI/TUI
using Deno, OpenTUI, and React.

## Milestones

### Phase 1 — Scaffold + Deno tasks + env/config validation

- [x] deno.json with tasks, JSX config, dependencies
- [x] .env.example and .gitignore
- [x] CLI flag parsing (`-r, --rootpath`)
- [x] Root path resolution (flag > env > fail fast)
- [x] Root path validation (exists, directory, readable)
- [x] CI green

### Phase 2 — Deterministic traversal engine + node record lifecycle

- [x] Test fixture helper: programmatic setup/teardown in gitignored `data/`
- [x] FileNode record type (minimal: relativePath, basename, stat, xattrs)
- [x] TraversalEvent as callback parameter ("pre" | "post" | "leaf")
- [x] Two-phase directory visitation (pre/post via callback events)
- [x] Single-record-per-node data model (pre and post reference same object)
- [x] Deterministic child sorting (readSortedChildren, locale-independent)
- [x] Hidden/symlink skip rules (no recurse, emitted as leaf)
- [x] All async (no Sync APIs)
- [x] Integration tests (7 tests: pre/post, child ordering, deterministic sort,
      leaf events, hidden dirs, symlinks, same-object identity)
- [x] CI green

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
- Switched from `@std/cli/parse-args` to `commander` for automatic --help,
  --version, and invalid-flag error handling.
- FileNode is minimal raw data (relativePath, basename, stat, xattrs). No
  derived fields (kind, phase, status, isHidden, modeValid, violations) — those
  belong to later validation/presentation layers.
- TraversalEvent ("pre"/"post"/"leaf") is a callback parameter, not a node
  property — separates scanning process from filesystem data.
- stat is non-nullable: lstat failure on a readDir result is fatal.
- Removed formatModePerm — presentation concern for Phase 6 (ls-like format).

## Audit Trail

- Phase 0
  - Scaffolded experiment (README, AGENTS, CLAUDE, PLAN, deno.json,
    src/index.ts)
  - Added test fixtures hard requirement to seed (programmatic data/ fixtures)
- Phase 1
  - config.ts: CLI flag parsing, root path resolution/validation
  - config_test.ts: 4 integration tests
  - index_test.ts: 2 subprocess CLI tests (--help, unknown flag)
  - Switched @std/cli to commander for --help support (seed updated)
  - Fixed --env-file to --env, created .env, added Usage to README
- Phase 2
  - types.ts: FileNode (relativePath, basename, stat, xattrs), TraversalEvent,
    TraversalCallback
  - traverse.ts: two-phase recursive walker with readSortedChildren
  - traverse_test.ts: 7 integration tests (13 total)
  - Refactors from review: separated TraversalEvent from node data, stripped
    FileNode to raw facts (reuse stat instead of entryType/kind/phase/status),
    all async, stat non-nullable, removed formatModePerm
