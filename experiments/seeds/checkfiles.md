# checkfiles Requirements

Deterministic filesystem validation CLI/TUI. Recursively traverses a root path,
inspects files and directories, and verifies required filesystem properties
(permissions, xattrs, hidden entries, symlinks) in reproducible order.

## Project Objective (Hard Requirement)

- Validate inspected tree properties:
  - each file must have mode `0644`
  - each directory must have mode `0755`
  - files/directories should have no xattrs
  - hidden entries (`.`-prefixed basename) should not be present
  - symlinks should not be present
- Primary output is interactive TUI with violations highlighted.

## Workflow / CI

- Each experiment created from this seed should include a local `AGENTS.md`.
- Each experiment should include a `PLAN.md` with milestones and a Session Audit
  Trail.
- `AGENTS.md` should require this loop after **every edit/modification**:
  - run `bun run ci`
  - if formatting/checks fail, run `bun run fmt` (includes Markdown formatting
    when configured), then rerun `bun run ci`
  - do not mark phase/task complete until CI is green
- Dependencies must be added with `bun add` / `bun add -d` (never by editing
  `package.json` directly).

## Tech Stack / Runtime

- **Bun** is required runtime and package manager (not Deno/Node runtime paths).
- Language: TypeScript.
- TUI stack: `@opentui/core`, `@opentui/react`, `react`.

## CLI Interface

- Use `commander` for argument parsing/help/version/error handling.
- Flags:
  - `-r, --rootpath <path>`: root directory to inspect (optional override)
- Root path resolution order:
  1. `--rootpath`
  2. `ROOT_PATH` from environment / `.env`
- Fail fast if no root path is resolved.
- Resolved root path must be validated at startup (exists, directory, readable).

## Environment Configuration

- Require both:
  - `.env` for local machine config (must be gitignored)
  - `.env.example` checked into repo
- Both files should define:

```dotenv
ROOT_PATH=/Volumes/Space/Staging
```

## Core Traversal Rules (Hard Requirement)

- Traverse **both** directories and files.
- Traversal must be single-process and strictly sequential:
  - no worker threads
  - no parallel metadata probing
  - no concurrency pools
- Symlinks must never be traversed.
- Hidden directories should not be recursed into.
- Directory visitation is **two-phase**:
  - `dir-pre`: inspect directory before children
  - `dir-post`: inspect directory after all children
- Files are single-phase (`file`).
- Required order for each directory `D`:
  1. Emit `dir-pre` for `D`
  2. Read immediate children of `D`
  3. Sort children deterministically
  4. Visit each child in sorted order
  5. Emit `dir-post` for `D`
- This guarantees children appear before the parent's final (`dir-post`) state.
- Root directory must also produce both `dir-pre` and `dir-post`.
- Data model must be **one record per filesystem node** (not one row per event):
  - `dir-pre` creates/marks a directory record as in-progress
  - `dir-post` updates the same directory record to completed
  - files are created once and immediately completed

## Deterministic Ordering (Hard Requirement)

- Child ordering must be reproducible across runs on unchanged data.
- Sort by full relative path ascending, using locale-independent lexical compare.
- Document comparator choice in code comments and tests.

## Metadata Collection

Collect metadata for each node record:

- `kind`: `dir` or `file`
- `phase`: `dir-pre` | `dir-post` | `file` (internal event marker)
- `status`: `in-progress` | `completed` (record lifecycle state)
- `relativePath`
- `basename`
- `depth`
- `isHidden` (basename starts with `.`)
- `isSymlink`
- `mtimeMs` (epoch milliseconds; null when unavailable)
- `modePerm` (permission bits `mode & 0o777`, formatted as octal string like
  `755`)
- `xattrs` (array of attribute names)
- `modeValid` (whether mode matches required value for kind)
- `xattrsValid` (whether xattrs array is empty)
- `violations` (list of rule failures for that node)

### Hidden + Symlink Rules (Hard Requirement)

- Hidden entries (`isHidden === true`) are violations and must be flagged.
- Symlink entries (`isSymlink === true`) are violations and must be flagged.
- Symlink targets must not be resolved.
- Hidden directories and symlink directories must not be traversed.
- Hidden and symlink entries must still appear in results as violation rows.

### xattrs (Hard Requirement)

- xattrs must be collected using system `xattr` command (not a JS xattr library).
- Use Bun subprocess APIs (`Bun.spawn` or `Bun.spawnSync`).
- A single path can have multiple xattrs; collect **all** attribute names.
- Parse `xattr <path>` stdout as newline-delimited attribute names.
- Filter out `com.apple.provenance` from validation/display for now (it is
  kernel-enforced and not practically fixable).
- For value-level diagnostics, use per-attr reads (`xattr -px <attr> <path>`)
  and parse hex safely.
- If xattr command is missing, fail fast with a clear fatal error.
- If xattr fails for a specific path, throw and fail the run (unexpected state).

## TUI / UX

- Use OpenTUI for interactive mode.
- TUI renderer should be configured with:
  - `exitOnCtrlC: true`
  - `useAlternateScreen: true`
- Must always clean up terminal state (`renderer.destroy()` on exit/error).

### TUI Architecture (Best-of Guidance)

- Prefer componentized layout:
  - `src/tui/render.tsx` (renderer/root lifecycle)
  - `src/tui/App.tsx` (phase orchestration)
  - `src/tui/ProgressView.tsx`
  - `src/tui/ResultsTable.tsx`
- Keep traversal/validation logic outside UI components (UI consumes structured
  progress and records).

### Progress View

- Show stack of currently scanned path segments, one row per level.
- Example rows:
  - `<root>`
  - `level-1`
  - `level-2`
  - `leaf file/directory` (when applicable)
- Show aggregate summary (node-based, not event-based):
  - total items
  - files:directories counts (rendered as `F:D`)
  - processed items
  - remaining items
  - elapsed time
  - estimated remaining time (rate-based estimate)
- Directory rows that are in-progress may be visually dimmed/greyed.
- When a directory finishes (`dir-post`), its row returns to normal/completed
  styling.

### Results View

- Interactive, scrollable table over inspected node records.
- Initial table may render compact path label to save space:
  - `displayPath = indent(depth) + basename`
  - where `indent(depth)` is fixed-width spacing per depth level
- Sorting must use canonical full path (`relativePath`), not `displayPath`.
- Reverse sort must reverse canonical sort order, not display-text order.
- Preferred follow-up optimization: directory-grouped view to reduce repeated
  path prefixes.
- v1 table columns (in order):
  - `mode` (derived)
  - `xattrs`
  - `path`
- `mode` should use ls-like derived display:
  - kind prefix (`d` directory, `-` file, `l` symlink)
  - rwx bits derived from `mode & 0o777`
  - append `@` when xattrs exist
  - examples: `drwxr-xr-x`, `-rw-r--r--`, `-rw-r--r--@`, `lrwxr-xr-x`
- Required keyboard controls:
  - `q` / `esc` quit
  - up/down scroll line
  - `v` toggle `all` / `violations-only` view
  - `r` or `shift-up`/`shift-down` reverse sort order on current column
  - `cmd-up` / `cmd-down` jump to top/bottom
  - fallback for terminals without cmd-modifier support: `g` / `G` (or
    `home`/`end`) must provide top/bottom jump
- Keep table header visible while scrolling.
- Sorted column header must display UTF-8 direction arrow (`↑` or `↓`).
- Include legend for keyboard controls at the bottom of the screen.
- Legend must include violations toggle key (`v`).
- Validation-status fields (mode/xattr) should be colorized:
  - red for violation
  - pass/non-violating rows should use default terminal foreground color
- Default startup sort:
  - column: `path`
  - direction: ascending
- Sort semantics (hard requirement):
  - only `path` sorting is required in v1
  - `path` sort uses lexical compare on full `relativePath`
  - tie-breaker for equal paths is `relativePath` (stable deterministic order)
- Filtering:
  - support toggle for `all` vs `violations-only`
  - keyboard shortcut `v` must toggle this filter
  - in `violations-only`, show only rows where `violations.length > 0`
  - include ancestor directories for each violating row as context rows
  - context rows must be visually distinct (dim/grey), with no violation color
  - context rows are included only for path hierarchy readability
  - de-duplicate shared ancestor rows when multiple violations share parents
  - ordering in `violations-only` remains canonical path order
  - context rows are not collapsible in v1
  - context rows are not independently sortable/filter-matched rows
- `xattrs` display formatting:
  - strip `com.<vendor>.` prefix for readability where applicable
  - when multiple xattrs exist, show first compacted name plus `+N`
  - truncate with ellipsis when width-constrained

## Output

- Show progress during traversal, then results table.
- Initial table order must match deterministic traversal order before
  interactive re-sorting.

## Error Handling

- Fatal errors (invalid root path, missing xattr command) should exit code 1.
- `readdir` -> `lstat` mismatches and per-path xattr command failures should be
  treated as fatal and bubble to top-level error handling.
- On fatal errors after TUI initialization, restore terminal state before
  propagating/logging the error.
- Successful run exits code 0.

## package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "check": "tsc --noEmit",
    "test": "vitest run",
    "fmt": "prettier --write .",
    "fmt:check": "prettier --check .",
    "ci": "bun run fmt:check && bun run lint && bun run check && bun run test"
  }
}
```

## Dependencies

- `@opentui/core`, `@opentui/react`, `react`
- `commander`
- `xattr` system command available in PATH

## Test Fixtures (Hard Requirement)

- Integration tests must use local `data/` directory (gitignored, never checked
  in).
- Tests create fixture files/directories programmatically at test time.
- Fixtures should cover:
  - normal files/directories
  - hidden entries
  - symlinks
  - non-standard permissions
  - files/directories with xattrs
- Each test/test group must own setup and teardown to prevent contamination.

## Implementation Notes

- TypeScript/OpenTUI setup in `tsconfig.json` should include:
  - `"jsx": "react-jsx"`
  - `"jsxImportSource": "@opentui/react"`
  - `"types": ["bun", "node"]`
- Keep filesystem node model minimal/raw (`relativePath`, `basename`, `stat`,
  `xattrs`) and treat traversal event (`pre`/`post`/`leaf`) as callback context,
  not persistent node state.
- Use distinct TUI lifecycle methods for:
  - user quit (destroy renderer + exit 0)
  - error cleanup (destroy renderer only, then rethrow)
- Keep row-count math explicit:
  - `visibleRows = terminalHeight - chromeLines` (header, separator, status)
- Add tests for:
  - deterministic traversal order and two-phase directory lifecycle
  - mode formatting (`mode & 0o777`) and xattr parser behavior
  - validation rules (`0644` file, `0755` dir, no xattrs, hidden/symlink
    violations)
  - results behavior (compact display path, canonical sort, deterministic
    tie-breaker, violations-only filtering)
- xattr helpers should have integration tests using real `xattr` subprocess
  calls against temp test files/directories.

## Research Items (Required)

- Verify exact behavior/parseability of recursive xattr listing via
  `xattr -r` and `xattr -rl`:
  - does one command reliably return all path + name/value pairs?
  - is output format stable enough for machine parsing?
  - how does it behave with binary values and unusual filenames?
- Decide whether implementation should:
  - keep per-path xattr calls (simple, explicit), or
  - switch to recursive bulk xattr read for performance.
- Record findings in `PLAN.md` before finalizing xattr collection strategy.

## PLAN / TASK Guidance (Required)

- Seed must guide generated `PLAN.md` with ordered phases and priorities.
- Recommended phase order:
  1. scaffold + scripts + env/config validation
  2. deterministic traversal engine + node record lifecycle
  3. validation rules (mode/xattr/hidden/symlink) + fail-fast error handling
  4. xattr helpers + integration tests
  5. OpenTUI progress view
  6. OpenTUI results table (sort, compact path display, legends)
  7. violations-only filter
  8. polish/refactor/docs
- Priority guidance:
  - correctness and determinism over UI polish
  - traversal and validation correctness are blocking prerequisites for TUI work
  - CI green (`bun run ci`) is required before closing each phase
