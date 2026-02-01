# Plan

## Harness

claude/opus-4.5

## Goal

Build a production-ready audiobook scanner CLI that discovers audio files, extracts metadata, and presents results through an interactive TUI or JSON output.

## Milestones

### Phase 1: Project Setup

- [x] Initialize Bun project with package.json
- [x] Configure TypeScript (tsconfig.json, strict mode)
- [x] Install dependencies (commander, opentui, ffprobe, types)
- [x] Create basic CLI entry point
- [x] Verify `bun run ci` works

### Phase 2: Core Scanning

- [x] Implement recursive directory scanner
- [x] Filter for supported audio formats (.m4b, .mp3)
- [x] Add progress indication during scan
- [x] Handle file system errors gracefully

### Phase 3: Metadata Extraction

- [x] Integrate ffprobe for audio metadata
- [x] Extract: title, artist, album, duration, bitrate, format
- [x] Handle missing/malformed metadata
- [x] Parse duration into human-readable format

### Phase 4: Interactive TUI

- [x] Implement OpenTUI table view
- [x] Display scanned audiobooks with metadata
- [ ] Add filtering by artist/album/title
- [x] Add sorting by different columns
- [x] Handle keyboard navigation

### Phase 5: Output Modes

- [ ] JSON output mode (--json flag)
- [ ] Pretty-print for human readability
- [ ] Summary statistics (total files, total duration, etc.)
- [ ] Export to file option

### Phase 6: Polish & Testing

- [ ] Write unit tests for core functions
- [ ] Add integration tests for CLI commands
- [ ] Improve error messages and help text
- [ ] Add README with usage examples
- [ ] Final CI validation

## Decisions/Notes

- Audio extensions scoped to `.m4b` and `.mp3` per seed spec (not the broader set initially planned)
- Used `node:child_process` execFile instead of `Bun.spawn` for ffprobe — vitest runs under Node, not Bun
- OpenTUI JSX requires `jsxImportSource: "@opentui/react"` in tsconfig
- OpenTUI text styling uses `<b>` tags and `attributes={TextAttributes.DIM}`, not `bold`/`dim` props
- Filtering (Phase 4) deferred — seed spec doesn't require it, only sorting/scrolling

## Learnings — OpenTUI Layout Pitfalls

### TUI content overflow silently clips from the top

When a `<box flexDirection="column">` contains more child lines than the
terminal height, OpenTUI clips from the **top**, not the bottom. This means
header rows disappear silently — no error, no warning, the data rows and
status line still render fine.

**Root cause in this project:** `pageSize` (the number of visible data rows)
was calculated with too-small overhead, so `header + separator + pageSize +
blank + status > terminal height`. The bug only manifested with large
datasets (enough rows to fill `pageSize`); small directories had fewer rows
than `pageSize` so the total content fit.

**Contributing factors that made this hard to debug:**
1. `padding={1}` on `<box>` consumes 2 lines (top + bottom) but it's easy to
   forget or miscount.
2. `<text>{"\n"}</text>` as a spacer element — unclear whether it occupies 1
   or 2 lines in a flex column layout.
3. The symptom (missing headers) looked like a rendering/styling bug, not a
   layout overflow bug, which led to many wrong fixes (changing bold attrs,
   span nesting, arrow placement).
4. The bug was data-dependent — worked with small test dirs, broke with the
   full library — which further obscured the cause.

**Fix:** Remove `padding` and the `<text>{"\n"}</text>` spacer. Calculate
`pageSize = height - N` where N is an exact count of non-data `<text>`
elements (header + separator + status = 3). Keep it simple and countable.

**Rule of thumb:** In a terminal TUI, every element that occupies a line must
be explicitly accounted for in the page size math. Avoid ambiguous spacers.
When headers vanish, suspect overflow before styling.

## Session Audit Trail

### Session 1 — 2026-02-01 (claude/opus-4.5)

**Phase 1 complete.** Initialized Bun project, configured TypeScript strict mode, installed all dependencies (commander, @opentui/core, @opentui/react, react, vitest, eslint, prettier, typescript-eslint), created CLI entry point with Commander skeleton, set up eslint/prettier configs. `bun run ci` passes all checks (fmt, lint, typecheck, test).

**Phase 2 complete.** Implemented recursive directory scanner (`src/scanner.ts`) with hidden file/dir skipping, .m4b/.mp3 filtering, sorted output by relative path. Wired into CLI with rootpath validation and progress output to stderr. 9 scanner tests + 1 placeholder = 10 tests passing. `bun run ci` green.

**Phase 3 complete.** Implemented ffprobe metadata extraction (`src/probe.ts`) with concurrency-limited worker pool, 30s timeout, JSON parsing of ffprobe output. Extracts duration, bitrate, codec, title, artist. CLI now runs scan + probe pipeline with progress. 14 probe tests (formatDuration, parseProbeOutput, probeFiles integration). 24 total tests, `bun run ci` green.

**Phase 4 complete.** Built OpenTUI interactive TUI with three views: scanning splash, progress view (showing in-flight files and completion %), and scrollable results table. Results table supports sorting (left/right arrows cycle columns, r reverses), vim-style scrolling (j/k, g/G, page up/down), and q/esc to exit. `--json` bypasses TUI entirely. Replaced placeholder CLI test with real --help/--version tests. 25 tests, `bun run ci` green.
