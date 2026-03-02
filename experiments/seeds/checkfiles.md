# checkfiles Requirements

Deterministic filesystem validation CLI/TUI. Recursively traverses a root path,
inspects files and directories, and verifies required filesystem properties
(permissions and xattrs) in a reproducible order.

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
- That `AGENTS.md` should require this loop after **every edit/modification**:
  - run `deno task ci`
  - if formatting/checks fail, run `deno fmt` (includes Markdown formatting)
  - rerun `deno task ci`
  - do not mark phase/task complete until CI is green
- Dependencies must be added with `deno add` (never by editing `deno.json`
  import maps manually).

## Tech Stack / Runtime

- **Deno** is required runtime/tooling (`deno run`, `deno test`, `deno lint`,
  `deno check`).
- No Bun/Node runtime APIs in application code.
- TUI stack: OpenTUI + React via npm packages in Deno.

## CLI Interface

- Flag parsing should use Deno-native tooling (`@std/cli/parse-args`) unless a
  stronger reason is documented.
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
- This guarantees children appear before the parent’s final (`dir-post`) record.
- Root directory must also produce both `dir-pre` and `dir-post`.
- Data model must be **one record per filesystem node** (not one row per event):
  - `dir-pre` creates/marks a directory record as in-progress
  - `dir-post` updates the same directory record to completed
  - files are created once and immediately completed

## Deterministic Ordering (Hard Requirement)

- Child ordering must be reproducible across runs on unchanged data.
- Sort by full relative path, ascending, using a locale-independent comparator
  (no locale-sensitive collation).
- Document comparator choice in code comments and tests.

## Metadata Collection

Collect metadata for each emitted record:

- `kind`: `dir` or `file`
- `phase`: `dir-pre` | `dir-post` | `file` (internal event marker)
- `status`: `in-progress` | `completed` (record lifecycle state)
- `relativePath`
- `basename`
- `isHidden` (basename starts with `.`)
- `isSymlink`
- `mtimeMs` (epoch milliseconds; null when unavailable)
- `modePerm` (permission bits `mode & 0o777`, formatted as octal string like
  `755`)
- `xattrs` (array of attribute names)
- `modeValid` (whether mode matches required value for kind)
- `xattrsValid` (whether xattrs array is empty)
- `violations` (list of rule failures for that item)

### Hidden + Symlink Rules (Hard Requirement)

- Hidden entries (`isHidden === true`) are violations and must be flagged.
- Symlink entries (`isSymlink === true`) are violations and must be flagged.
- Symlink targets must not be resolved.
- Hidden directories and symlink directories must not be traversed.
- Hidden and symlink entries must still appear in results as violation rows.

### xattrs (Hard Requirement)

- xattrs must be collected using system `xattr` command (not a JS xattr library)
- Use Deno subprocess APIs (`new Deno.Command(...)`).
- A single path can have multiple xattrs; collect **all** attribute names.
- Parse `xattr <path>` stdout as newline-delimited attribute names.
- For value-level diagnostics, use per-attr reads (`xattr -px <attr> <path>`)
  and parse hex safely.
- If xattr command is missing, fail fast with a clear fatal error.
- If xattr fails for a specific path, record warning and continue with
  `xattrs: []`.

## TUI / UX

- Use OpenTUI for interactive mode.
- TUI renderer should be configured with:
  - `exitOnCtrlC: true`
  - `useAlternateScreen: true`
- Must always clean up terminal state (`renderer.destroy()` on exit/error).

### TUI Architecture (Best-of Guidance)

- Prefer a componentized layout:
  - `src/tui/render.tsx` (renderer/root lifecycle)
  - `src/tui/App.tsx` (phase orchestration)
  - `src/tui/ProgressView.tsx`
  - `src/tui/ResultsTable.tsx`
- Keep traversal logic outside UI components (UI consumes structured progress
  and records).

### Progress View

- Show stack of currently scanned path segments, one row per level.
- Example rows:
  - `<root>`
  - `level-1`
  - `level-2`
  - `leaf file/directory` (when applicable)
- Show aggregate summary:
  - total items
  - files:directories counts (rendered as `F:D`)
  - processed items
  - remaining items
  - elapsed time
  - estimated remaining time (rate-based estimate)
- Directory rows that are currently in-progress may be visually dimmed/greyed.
- When a directory finishes (`dir-post`), its row returns to normal/completed
  styling.

### Results View

- Interactive, scrollable table over inspected items.
- Initial table may render a compact path label to save space:
  - `displayPath = indent(depth) + basename`
  - where `indent(depth)` is fixed-width spacing per depth level
- Sorting must use canonical full path (`relativePath`), not `displayPath`.
- Reverse sort must reverse canonical sort order, not display-text order.
- Preferred follow-up optimization: directory-grouped view to reduce repeated
  path prefixes.
- v1 table columns (in order):
  - `mode` (derived)
  - `path`
  - `xattrs`
- `mode` should use ls-like derived display:
  - include kind prefix (`d` for directory, `-` for file, `l` for symlink)
  - include rwx bits derived from `mode & 0o777`
  - append `@` when xattrs exist
  - examples: `drwxr-xr-x`, `-rw-r--r--`, `-rw-r--r--@`, `lrwxr-xr-x`
- Required keyboard controls:
  - `q` / `esc` quit
  - up/down scroll line
  - left/right cycle sort column
  - `v` toggle `all` / `violations-only` view
  - `r` or `shift-up`/`shift-down` reverse sort order on current column
  - `cmd-up` / `cmd-down` jump to top/bottom
  - fallback for terminals without cmd-modifier support: `g` / `G` (or
    `home`/`end`) must provide top/bottom jump
- Keep table header visible while scrolling.
- Sorted column header must display UTF-8 direction arrow (`↑` or `↓`).
- Include legend for keyboard controls at the bottom of the screen.
- Legend must include the violations toggle key (`v`).
- Validation-status fields (mode/xattr) should be colorized:
  - red for violation
  - pass/non-violating rows should use default terminal foreground color
- Default startup sort:
  - column: `path`
  - direction: ascending
- Sort semantics (hard requirement):
  - sortable columns: `path` and `xattrs`
  - `path` sort uses lexical compare on full `relativePath`
  - `xattrs` sort uses lexical compare on `xattrSortKey`
  - `xattrSortKey` is generated by sorting xattr names lexically and joining
    with a stable delimiter
  - tie-breaker for all sorts: `relativePath` ascending (for deterministic
    order)
- Filtering:
  - support toggle for `all` vs `violations-only`
  - keyboard shortcut `v` must toggle this filter
  - in `violations-only`, show only rows where `violations.length > 0`
  - include ancestor directories for each violating row as context rows
  - context rows must be visually distinct (dim/grey), with no violation color
  - context rows are included only to provide path hierarchy readability
  - de-duplicate shared ancestor rows when multiple violations share parents
  - ordering in `violations-only` remains canonical path order
  - context rows are not collapsible in v1
  - context rows are not independently sortable/filter-matched rows
- `xattrs` display formatting:
  - render as concatenated sorted xattr names for readability
  - truncate cell with ellipsis when width-constrained
  - sorting must still use full untruncated `xattrSortKey`

## Output

- Show progress during traversal, then results table.
- Initial table order must match deterministic traversal order before
  interactive re-sorting.

## Error Handling

- Continue on per-path inspection failures (stat/xattr errors), log warning, and
  keep traversing.
- Fatal errors (invalid root path, missing xattr command) should exit with code
  1.
- Successful run (even with warnings) exits with code 0.

## deno.json Tasks

```json
{
  "tasks": {
    "run": "deno run --env-file -A src/index.ts",
    "lint": "deno lint",
    "check": "deno check src/index.ts",
    "test": "deno test -A",
    "fmt": "deno fmt",
    "fmt:check": "deno fmt --check",
    "ci": "deno task lint && deno task check && deno task test && deno task fmt:check"
  }
}
```

## Dependencies

- `npm:@opentui/core`, `npm:@opentui/react`, `npm:react`
- `jsr:@std/cli` for argument parsing
- `xattr` system command available in PATH

## Implementation Notes

- Use Deno JSX config for OpenTUI in `deno.json`:
  - `"jsx": "react-jsx"`
  - `"jsxImportSource": "npm:@opentui/react"`
- Keep row-count math explicit: `visibleRows = terminalHeight - chromeLines`
  (header, separator, status/help).
- Add tests for deterministic traversal order and two-phase directory emission.
- Add tests for mode formatting (`mode & 0o777`) and xattr parser behavior.
- Add tests for validation rules:
  - file mode must be `0644`
  - directory mode must be `0755`
  - xattrs must be empty
- xattr helper functions should have integration tests using real `xattr`
  subprocess calls against temp test files/directories.
- Add tests for results behavior:
  - compact `displayPath` rendering with indentation
  - canonical path sorting unaffected by compact display format
  - deterministic tie-breaker on `relativePath`
  - `violations-only` filter includes only violating rows

## Research Items (Required)

- Verify exact behavior/parseability of recursive xattr listing via `xattr -r`
  and `xattr -rl`:
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
  1. scaffold + Deno tasks + env/config validation
  2. deterministic traversal engine + node record lifecycle
  3. validation rules (mode/xattr/hidden/symlink) + warnings/errors
  4. xattr helpers + integration tests
  5. OpenTUI progress view
  6. OpenTUI results table (sort, compact path display, legends)
  7. violations-only filter
  8. polish/refactor/docs
- Priority guidance:
  - correctness and determinism over UI polish
  - traversal and validation correctness are blocking prerequisites for TUI work
  - CI green (`deno task ci`) is required before closing each phase
