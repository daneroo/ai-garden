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

- [x] Remove deno.json, deno.lock
- [x] Create package.json (scripts: lint, check, test, fmt, fmt:check, ci)
- [x] Create tsconfig.json (strict, jsx: react-jsx, jsxImportSource:
      @opentui/react)
- [x] Add eslint + prettier configs
- [x] bun add commander @opentui/core @opentui/react react
- [x] bun add -d vitest typescript eslint prettier @types/react
- [x] Update .gitignore (node_modules instead of deno cache)

Port source files (Deno API -> Node/Bun API):

- [x] types.ts: Deno.FileInfo -> Stats from node:fs
- [x] config.ts: Deno.args -> process.argv, Deno.env -> process.env, Deno.stat
      -> node:fs/promises stat, Deno.exit -> process.exit, Deno.errors ->
      ENOENT/EACCES error codes
- [x] traverse.ts: Deno.lstat -> lstat, Deno.readDir -> readdir, @std/path ->
      node:path
- [x] xattr.ts: Deno.Command -> node:child_process execFile (not Bun.spawn —
      vitest runs in Node)
- [x] validate.ts: isSymlink (property) -> isSymbolicLink() (method), same for
      isDirectory/isFile
- [x] index.ts: import.meta.main stays (Bun supports it)

Port tests (Deno.test -> vitest):

- [x] config_test.ts -> config.test.ts (vitest describe/test/expect)
- [x] index_test.ts -> index.test.ts (execFile subprocess tests)
- [x] traverse_test.ts -> traverse.test.ts
- [x] validate_test.ts -> validate.test.ts
- [x] xattr_test.ts -> xattr.test.ts

Cleanup:

- [x] Remove src/tui/ scaffolding (will redo in Phase 5)
- [x] Update CLAUDE.md (bun run ci, bun add)
- [x] Update AGENTS.md (bun references)
- [x] bun run ci green
- [x] All 27 tests passing under vitest

### Phase 5 — OpenTUI progress view

- [x] ScanState interface + createScanState() factory + makeScanCallback()
- [x] Mutable bridge pattern: traversal mutates state, React polls at 100ms
- [x] Renderer setup (exitOnCtrlC, useAlternateScreen)
- [x] Progress component: path stack (grey, indented), aggregate summary
- [x] Elapsed time, rate-based ETA, items/s rate
- [x] In-progress directory dimming (fg="#666666")
- [x] Cleanup on exit/error (try/finally + renderer.destroy())
- [x] Unit tests for scan-state (6 tests, no OpenTUI dependency)
- [x] CI green (35 tests)

### Phase 6 — OpenTUI results table

- [x] Scrollable table with persistent header (title + summary stays across views)
- [x] Columns: mode (ls-like via formatMode), xattrs (compact with ..prefix), path (indented)
- [x] Keyboard controls (q/esc clean exit, up/down, left/right sort column, r reverse, g/G jump, home/end)
- [x] Sort by path and xattrs with relativePath tie-breaker
- [x] Per-field violation colorization (red on mode/xattr/path independently)
- [x] Legend bar with keybinding summary
- [x] Root "." displayed as "/" in path column
- [x] xattr common prefix ellipsis (com.docker.grpcfuse.ownership -> ..ownership)
- [x] Timer stops after scan, elapsed frozen, summary simplified for results view
- [x] Clean exit via renderer.destroy() (no cursor artifacts)
- [x] ErrorBoundary wraps App for defensive render exception handling
- [x] Pure format helpers in format.ts (no OpenTUI dependency) with 26 unit tests
- [x] CI green (61 tests)

### Phase 7 — Violations-only filter + sort simplification

- [x] `v` key toggles violations-only filter (resets cursor to top)
- [x] filterViolations() keeps violation rows + ancestor directories
- [x] ancestorPaths() computes parent chain from root to parent
- [x] De-duplicate shared ancestors (Set-based)
- [x] Ancestor rows rendered dim (fg="#666666") when filter active
- [x] Removed sortCol state, SortColumn type, left/right key handlers
- [x] Always sort by path; shift-up/shift-down and `r` reverse direction
- [x] Header shows violation count in summary line
- [x] Updated legend: shift-up/down/r reverse, v violations
- [x] 9 new tests (4 ancestorPaths + 5 filterViolations), removed 2 sortByXattrs tests
- [x] CI green (68 tests)

### Phase 8 — Polish / refactor / docs

- [x] README updated: Deno references replaced with Bun, keybindings section added
- [x] No dead imports or stale Deno references in source
- [x] CI green (68 tests)

### Issues

- [x] tsconfig misses seed-recommended OpenTUI/Node types (node, @opentui/react). (tsconfig.json:13)
- [x] Terminal cleanup on non-render errors is weak. startTui() returns cleanup, but caller discards it; traversal/config errors after renderer start can skip explicit destroy.( index.ts:19 render.tsx:8)
- [ ] xattrs failures are silently swallowed; rare, but should throw. xattr.ts:22 - caught at top level (like we did with stat failures)
- [ ] xattrs cell does not implement explicit ellipsis truncation requirement. It pads but can overflow. (ResultsTable.tsx:139)
- [ ] add mtime column
- [ ] make scanning multipass (better counts and time - prepares for fix pass)

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
- Phase 4.5
  - Full Deno -> Bun migration (OpenTUI requires bun:ffi at runtime)
  - Scaffold: package.json, tsconfig.json, eslint.config.js, .prettierrc
  - All source files ported: Deno.\* APIs -> node:fs/promises, node:path,
    Bun.spawn
  - Tests run under `bun --bun vitest` for full Bun runtime access (Bun.spawn).
  - Added setXattr(path, name, value) export — get/set consistency, tests use
    module's own setXattr instead of local helper.
  - Deno.FileInfo properties (isSymlink, isDirectory) -> Stats methods
    (isSymbolicLink(), isDirectory())
  - All 5 test files ported from Deno.test to vitest, sync APIs replaced with
    async (node:fs/promises)
  - Removed console.warn from getXattrNames — silently returns [] on failure
  - Removed deno.json, deno.lock, .prettierrc (all defaults), .prettierignore
    (prettier v3 respects .gitignore)
  - CLAUDE.md, AGENTS.md updated to bun commands
  - 27 tests passing, bun run ci green
- Phase 5
  - src/tui/scan-state.ts: ScanState interface, createScanState(), makeScanCallback()
  - src/tui/ProgressView.tsx: 100ms polling via snap(), dirStack display (grey),
    summary line (items, F:D, processed, remaining, elapsed, rate, ETA)
  - src/tui/App.tsx: thin shell for ProgressView (Phase 6 adds results view)
  - src/tui/render.tsx: startTui() creates renderer + React root, returns cleanup
  - src/index.ts: wired traversal + TUI with try/finally cleanup
  - src/tui/scan-state.test.ts: 6 unit tests (no OpenTUI dependency)
  - Fixed OpenTUI constraint: <br> must be inside <text>, replaced with <text>
    spacers
  - 35 tests passing, bun run ci green
- Phase 6
  - src/tui/format.ts: ResultRow interface, formatMode() (ls-like rwx with @
    suffix), displayPath() (root "." -> "/"), buildResultRow() (calls validate,
    classifies per-field violations), sortByPath/sortByXattrs comparators,
    commonXattrPrefix() + compactXattr() for ..prefix ellipsis
  - src/tui/format.test.ts: 26 unit tests (formatMode, displayPath, buildResultRow
    with violation classification, sort comparators, xattr prefix/compact)
  - src/tui/ResultsTable.tsx: manual cursor/viewport (no scrollbox), useKeyboard
    for navigation + sort cycling + quit, per-field <span> coloring (mode/xattr/path
    independently red), legend bar
  - src/tui/App.tsx: owns persistent header (title + summary), polls scanState
    with 100ms timer that stops on done, renders ProgressView or ResultsTable
  - src/tui/ProgressView.tsx: simplified to stateless dirStack-only component,
    exports snap/Snapshot/formatElapsed for App
  - src/tui/render.tsx: ErrorBoundary class wraps App, onQuit callback destroys
    renderer then exits (clean alternate screen teardown)
  - src/tui/scan-state.ts: added results: ResultRow[] to ScanState, buildResultRow
    called on leaf/post events during traversal
  - src/index.ts: removed 300ms delay + cleanup, TUI stays alive for ResultsTable
  - Iterative fixes from review: timer freeze, ETA removal for results view,
    xattr prefix ellipsis, root "." -> "/", per-field coloring (not whole row),
    <span> not nested <text> (OpenTUI constraint), clean exit via renderer.destroy
  - 61 tests passing, bun run ci green
- Phase 7
  - src/tui/format.ts: added ancestorPaths() (parent chain from root to parent),
    filterViolations() (keeps violations + ancestor rows, deduped, path-sorted),
    removed sortByXattrs (no longer used)
  - src/tui/format.test.ts: 4 ancestorPaths tests (root/top-level/nested/deep),
    5 filterViolations tests (no violations/single/shared ancestors/root/all),
    removed 2 sortByXattrs tests
  - src/tui/ResultsTable.tsx: removed sortCol state, SortColumn type, left/right
    key handlers. Added showViolationsOnly state toggled by `v` (resets cursor).
    Ancestor rows dimmed when filter active. Always sorts by path, shift-up/down
    and `r` reverse direction. Updated legend.
  - src/tui/App.tsx: computes violationCount from results, shows in header
    summary line (items + violations + elapsed + rate)
  - 68 tests passing, bun run ci green
- Phase 8
  - README.md: replaced stale Deno references with Bun commands, added
    keybindings section documenting results view controls
  - Code audit: no dead imports, no stale Deno references, no cleanup needed
  - 68 tests passing, bun run ci green
- Issue : violations count
  - Bug: violations count showed 0 — useMemo on mutable array reference never
    re-ran. Fix: track violations counter in ScanState, increment in callback,
    expose via Snapshot. App reads s.violations from snapshot (updates on 100ms
    poll).
  - Added elapsed: and rate: labels to both summary lines
  - 68 tests passing, bun run ci green
- Issue: tsconfig types
  - Added "node" to types array. @opentui/react requires no change — JSX types
    come from jsxImportSource, and module types resolve normally. No functional
    gap existed; this makes Node built-in type coverage explicit.
  - 68 tests passing, bun run ci green
- Issue: terminal cleanup on traversal errors
  - startTui() now returns TuiHandle { quit, destroy } instead of a single
    cleanup fn. quit() is for user exit (destroy + exit 0); destroy() restores
    the terminal without exiting, for error paths.
  - index.ts wraps traverse() in try/catch: calls tui.destroy() then rethrows,
    so the alternate screen is always restored before any error output.
  - 68 tests passing, bun run ci green
