# PLAN.md — checkfiles-claude-opus-46

## Harness

- Agent: Claude Code (Opus 4.6)
- CI gate: `bun run ci` after every edit (was `deno task ci` before Phase 4.5)

## Goal

Implement the `checkfiles` seed: a deterministic filesystem validation CLI/TUI
using Bun, OpenTUI, and React. (Migrated from Deno in Phase 4.5 — OpenTUI
requires Bun runtime.)

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

- [x] Mode validation (file 0644, dir 0755)
- [x] xattr validation (must be empty)
- [x] Hidden entry violation flagging
- [x] Symlink violation flagging
- [x] validate() returns string[] — pure function over FileNode, not in FileNode
- [x] Integration tests with fixtures (7 integration + 2 unit, 22 total)
- [x] CI green

### Phase 4 — xattr helpers + integration tests

- [x] Research: xattr behavior (see findings below)
- [x] xattr collection via Deno.Command subprocess
- [x] Parse stdout as newline-delimited attribute names
- [x] Per-attr hex value reads (xattr -px) — not needed, validation only checks
      presence not values
- [x] Fail fast if xattr command missing (checkXattrAvailable)
- [x] Graceful per-path failure (warning + empty array)
- [x] Integration tests: 5 tests with real xattr calls (27 total)
- [x] CI green

### Phase 4.5 — Migrate Deno to Bun

OpenTUI requires Bun at runtime (bun:ffi for native Zig bindings). Deno
type-checks pass but runtime crashes. Seed rewritten to Bun stack.

Scaffold:

- [ ] Remove deno.json, deno.lock
- [ ] Create package.json (scripts: lint, check, test, fmt, fmt:check, ci)
- [ ] Create tsconfig.json (strict, jsx: react-jsx, jsxImportSource:
      @opentui/react)
- [ ] Add eslint + prettier configs
- [ ] bun add commander @opentui/core @opentui/react react
- [ ] bun add -d vitest typescript eslint prettier @types/react
- [ ] Update .gitignore (node_modules instead of deno cache)

Port source files (Deno API -> Node/Bun API):

- [ ] types.ts: Deno.FileInfo -> Stats from node:fs
- [ ] config.ts: Deno.args -> process.argv, Deno.env -> process.env, Deno.stat
      -> node:fs/promises stat, Deno.exit -> process.exit, Deno.errors ->
      ENOENT/EACCES error codes
- [ ] traverse.ts: Deno.lstat -> lstat, Deno.readDir -> readdir, @std/path ->
      node:path
- [ ] xattr.ts: Deno.Command -> Bun.spawn
- [ ] validate.ts: no changes expected (pure function)
- [ ] index.ts: import.meta.main stays (Bun supports it)

Port tests (Deno.test -> vitest):

- [ ] config_test.ts -> config.test.ts (vitest describe/test/expect)
- [ ] index_test.ts -> index.test.ts (Bun.spawn subprocess tests)
- [ ] traverse_test.ts -> traverse.test.ts
- [ ] validate_test.ts -> validate.test.ts
- [ ] xattr_test.ts -> xattr.test.ts

Cleanup:

- [ ] Remove src/tui/ scaffolding (will redo in Phase 5)
- [ ] Update CLAUDE.md (bun run ci, bun add)
- [ ] Update AGENTS.md (bun references)
- [ ] bun run ci green
- [ ] All 27 tests passing under vitest

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
- xattr research findings (Phase 4):
  - Per-path `xattr <file>` is simplest: one attr name per line, sorted by us
  - `xattr -r` / `xattr -rl` recurse and prefix output with path — more complex
    to parse, but could be faster than per-file subprocess calls on large trees
    (single process vs N processes). Consider as optimization if per-path calls
    become a bottleneck.
  - `xattr -px <attr> <file>` reads hex values — not needed, validation only
    checks presence
  - com.apple.provenance is kernel-enforced, cannot be removed (xattr -d/-c
    silently fail), present on all files created since macOS 15+. Validation
    must treat it as expected/ignorable, not a violation.
- OpenTUI requires Bun runtime (bun:ffi for native Zig bindings). Deno
  type-checks pass but runtime crashes with "ERR_UNSUPPORTED_ESM_URL_SCHEME:
  Received protocol 'bun'". This forced a full Deno -> Bun migration in Phase
  4.5. Seed document rewritten accordingly.

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
- Phase 3
  - validate.ts: pure function validate(FileNode) -> string[]
  - Rules: mode (644/755), xattrs, hidden, symlink
  - validate_test.ts: 7 integration tests + 2 unit tests (22 total)
- Phase 4
  - xattr.ts: checkXattrAvailable() (fail fast), getXattrNames() (per-path,
    sorted, graceful failure)
  - xattr_test.ts: 5 integration tests with real xattr subprocess calls (27
    total)
  - Research: per-path calls chosen over -r recursive, com.apple.provenance is
    sticky/unremovable on macOS 15+
  - xattr -px (value reads) not needed — validation checks presence not values
