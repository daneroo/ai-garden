# bookfinder

Audiobook scanner CLI tool. Recursively scans directories for audio files and
extracts metadata using ffprobe.

## Requirements

### Workflow / CI

- Each experiment created from this seed should include a local `AGENTS.md`.
- Each experiment should include a `PLAN.md` with milestones and a Session Audit
  Trail.
- That `AGENTS.md` should instruct the agent to run `bun run ci` after
  completing a meaningful task/phase, and to fix failures before proceeding.
- Dependencies must be added with `bun add` / `bun add -d` (never by editing
  `package.json` directly).

### Tech Stack / Runtime

- **Bun** must be used as the runtime (not Node.js)

### CLI Interface

- Use **Commander** (NOT Yargs) for argument parsing
- Flags:
  - `-r, --rootpath <path>` - Root directory to scan (required)
  - `-c, --concurrency <n>` - Max parallel ffprobe processes (default: 8)
  - `--json` - Output JSON instead of human-readable table

### File Scanning

- Recursively scan for extensions: `.m4b`, `.mp3`
- Parallel metadata extraction with a concurrency limit (default **8**,
  configurable via `--concurrency/-c`)
- Skip hidden files and directories
- Sort output by relative path ascending before printing

### TUI / UX

- Use OpenTUI for the interactive experience.
- The TUI owns stdout for interactive runs.
- `--json` bypasses the TUI and prints a JSON array to stdout.

**Progress View**

- Show scan/probe progress with total files, processed, running, and timing.
- Include a list of in-flight files (up to the current concurrency).

**Results View**

- After probing, show an interactive, scrollable results table.
- Sorting: left/right arrows cycle columns, `r` reverses order.
- Indicate sort order with arrows (↑/↓) next to column headers.
- Scrolling: arrows/j/k, page up/down, `g/G` top/bottom.
- `q` or `esc` exits the TUI.

### Metadata Extraction

Use `ffprobe` to extract:

- **Duration** (seconds, formatted as HH:MM:SS in table output)
- **Bitrate** (kbps)
- **Codec** (audio codec name)
- **Title** tag (if present) — maps to book title
- **Artist** tag (if present) — maps to author
- File path (relative to rootpath)
- File size

### Output Formats

**TUI (default):**

- After probing, show a scrollable results table in the TUI.
- Columns: Author, Title, Duration, Bitrate, Codec, File
- Sorting and scrolling per the TUI/UX section.

**JSON (`--json` flag):**

- Array of objects with all metadata fields
- Pretty-printed with 2-space indentation
- `--json` prints a single JSON array to stdout (not NDJSON)
- `--json` bypasses the TUI and prints directly to stdout

### Error Handling

- Skip files where ffprobe fails; surface warnings in the TUI and log to stderr
  for `--json` runs
- Continue processing remaining files
- Exit code 0 on success, 1 on fatal error

### package.json Scripts

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

### Dependencies

- `@opentui/core`, `@opentui/react`, `react` - TUI runtime
- `commander` - CLI argument parsing
- `ffprobe` (system dependency) - must be installed and in PATH

### Implementation Notes

- Use a concurrency-limited worker pool for parallel ffprobe calls
- Parse ffprobe JSON output (`-print_format json`)
- Handle ffprobe timeout (30s per file)
- The results table must keep headers visible at all times — compute visible
  row count as `terminalHeight - chromeLines` (header, separator, status bar)
  and cap data columns (Author, Title, File) with max widths and ellipsis
  truncation. Test with 100+ files early to catch overflow.
