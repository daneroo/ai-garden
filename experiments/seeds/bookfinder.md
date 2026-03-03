# bookfinder Requirements

Audiobook scanner CLI tool. Recursively scans directories for audio files and
extracts metadata using ffprobe.

## Status

- Winner: `bookfinder-opencode-gpt-5-2` : subjectively the best ui
- Experiment concluded.
  - `bookfinder-opencode-gpt-5-2`: best ui, had benefit of seeing other
    implementations
  - `bookfinder-opencode-kimi`: good enough, proof kimi can follow a good spec
  - `bookfinder-claude-opus-4-5`: good ui, first to implement open-tui,
    - more work because of unrefined spec, api, tanstack,...
  - `bookfinder-antigravity-gemini-3-pro-high`: ok, prettier output

## Workflow / CI

- Each experiment created from this seed should include a local `AGENTS.md`.
- Each experiment should include a `PLAN.md` with milestones and a Session Audit
  Trail.
- That `AGENTS.md` should instruct the agent to run `bun run ci` after
  completing a meaningful task/phase, and to fix failures before proceeding.
- Dependencies must be added with `bun add` / `bun add -d` (never by editing
  `package.json` directly).

## Tech Stack / Runtime

- **Bun** must be used as the runtime (not Node.js)

## CLI Interface

- Use **Commander** (NOT Yargs) for argument parsing
- Flags:
  - `-r, --rootpath <path>` - Root directory to scan (required, override with
  - `ROOTPATH` in `.env`/`.env.example` (
    VALUE=`/Volumes/Space/Reading/audiobooks` ) **Implementation**: CLI must
    check for `.env` file presence or valid `ROOTPATH` env var.
  - `-c, --concurrency <n>` - Max parallel ffprobe processes (default: 8)
  - `--json` - Output JSON instead of human-readable table

## File Scanning

- Recursively scan for extensions: `.m4b`, `.mp3`
- Parallel metadata extraction with a concurrency limit (default **8**,
  configurable via `--concurrency/-c`)
- Skip hidden files and directories
- Sort output by relative path ascending before printing
  - Applies to `--json` output and the initial TUI results (before any
    interactive re-sort)

## TUI / UX

- Use OpenTUI for the interactive experience.
- The TUI owns stdout for interactive runs.
- `--json` bypasses the TUI and prints a JSON array to stdout.
- **Dynamic Sizing**: Column widths must scale with terminal width (avoid fixed
  character counts).
- **Clean Exit**: Restore terminal state on exit (e.g. `useAlternateScreen`,
  `renderer.destroy()`).

### Progress View

- Show scan/probe progress with total files, processed, running, and elapsed,
  remaining (estimated).
- Include a list of in-flight files (up to the current concurrency).

### Results View

- After probing, show an interactive, scrollable results table.
- Sorting: left/right arrows cycle columns, `r` reverses order.
- Indicate sort order with arrows (↑/↓) next to column headers.
- Scrolling: arrows/j/k, page up/down, `g/G` top/bottom.
- `q` or `esc` exits the TUI.

## Metadata Extraction

Use `ffprobe` to extract:

- **Duration** (seconds, formatted as HH:MM:SS in table output)
- **Bitrate** (kbps)
- **Codec** (audio codec name)
- **Title** tag (if present) — maps to book title
- **Artist** tag (if present) — maps to author
- File path (relative to rootpath)
- File size

## Output Formats

### TUI (default)

- After probing, show a scrollable results table in the TUI.
- Columns (in order): Author, Title, Duration, Bitrate, Codec, File
- Sorting and scrolling per the TUI/UX section.
- Some fields are very long you need a strategy for truncating/ellipsis
  - Show beginning of value, except filename, where the end is more important
    (e.g., `.../author/book.m4b`).

### JSON (`--json` flag)

- Array of objects with all metadata fields
- Pretty-printed with 2-space indentation
- `--json` prints a single JSON array to stdout (not NDJSON)
- `--json` bypasses the TUI and prints directly to stdout

## Error Handling

- Skip files where ffprobe fails; surface warnings in the TUI and log to stderr
  for `--json` runs
- Continue processing remaining files
- Exit code 0 on success, 1 on fatal error

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

- `@opentui/core`, `@opentui/react`, `react` - TUI runtime
- `commander` - CLI argument parsing
- `ffprobe` (system dependency) - must be installed and in PATH

## Implementation Notes

- Use a concurrency-limited worker pool for parallel ffprobe calls
  - **Concurrency**: Use an atomic-index worker pool (`nextIndex++`). Explicitly
    avoid `Promise.race` + `queue.shift()` (causes memory leaks).
- **TUI Layout**: `<box>` defaults to column layout. For tables, either use
  `flexDirection="row"` containers.
- **TypeScript**: Use `"jsxImportSource": "@opentui/react"` in `tsconfig.json`
  for proper intrinsic element types (`<box>`, `<text>`).
- Parse ffprobe JSON output (`-print_format json`)
- Handle ffprobe timeout (30s per file). **Crucial**: Use
  `AbortSignal.timeout(30000)` with `Bun.spawn` (or `subprocess.kill()`).
- The results table must keep headers visible at all times — compute visible row
  count as `terminalHeight - chromeLines` (header, separator, status bar) and
  avoid ambiguous extra chrome (padding/gap/blank spacer lines). OpenTUI clips
  overflow from the top; if headers disappear, suspect row-count math first. cap
  data columns (Author, Title, File) with max widths and ellipsis truncation.
  Test with 100+ files early to catch overflow.

## Compare Implementations

### Metrics

| Implementation                  | Prod | Files | LoC | Test LoC | Test/Prod | Cmplx/Fn | Cmplx/Sum |  Avg | P90 | Max |
| ------------------------------- | ---: | ----: | --: | -------: | --------: | -------: | --------: | ---: | --: | --: |
| `antigravity-gemini-3-pro-high` |    4 |     1 | 418 |        9 |      0.02 |       12 |        69 | 5.75 |   6 |  17 |
| `claude-opus-4-5`               |    8 |     4 | 689 |      323 |      0.47 |       20 |       124 | 6.20 |  10 |  20 |
| `opencode`                      |    4 |     1 | 193 |       41 |      0.21 |      n/a |       n/a |  n/a | n/a | n/a |
| `opencode-gemini-3-pro`         |    9 |     1 | 726 |        7 |      0.01 |       24 |       111 | 4.62 |   7 |  15 |
| `opencode-gpt-5-2`              |    9 |     4 | 917 |       99 |      0.11 |       39 |       190 | 4.87 |   8 |  25 |
| `opencode-kimi`                 |    8 |     1 | 615 |        5 |      0.01 |       17 |        76 | 4.47 |   6 |  15 |

### Compliance Notes

- `bookfinder-opencode` is not seed-compliant overall (Yargs instead of
  Commander, no OpenTUI flow, and JSON output shape diverges from required
  single array semantics).
- `bookfinder-antigravity-gemini-3-pro-high` has a good core scan/probe loop but
  misses key seed requirements (no explicit ffprobe timeout in code, fixed table
  widths, and incomplete renderer lifecycle config).
- `bookfinder-claude-opus-4-5` has strong test depth and solid TUI behavior, but
  diverges from seed contracts (`BOOKTUI_ROOTPATH` instead of `ROOTPATH`,
  fixed-width table layout, and result columns differ from required
  Author/Title/Duration/Bitrate/Codec/File order).
- `bookfinder-opencode-gemini-3-pro` is broadly functional but misses
  `.env.example` and still uses fixed table widths.
- `bookfinder-opencode-gpt-5-2` is the most robust engineering implementation
  (worker pool, timeout handling, dynamic table layout, interactive controls),
  but misses the seed env contract (`ROOTPATH` + `.env.example`) and its result
  columns differ from the seed’s required table columns.
- `bookfinder-opencode-kimi` is the closest overall to the seed behavior set:
  OpenTUI flow, dynamic sizing, required sort/navigation controls, in-flight
  progress, timeout handling, and required output shape. Main gaps are env name
  drift (`ROOT_PATH` vs `ROOTPATH`) and minimal test coverage.

### Key Lessons for Future Seeds

- Enforce env-contract names in tests (`ROOTPATH` vs `ROOT_PATH`) and require
  `.env.example`.
- Add acceptance tests for result-column order and required keybindings.
- Keep the “Bun-only/OpenTUI runtime” constraint explicit from the first phase.
