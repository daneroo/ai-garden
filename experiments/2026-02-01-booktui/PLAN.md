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

- [ ] Implement OpenTUI table view
- [ ] Display scanned audiobooks with metadata
- [ ] Add filtering by artist/album/title
- [ ] Add sorting by different columns
- [ ] Handle keyboard navigation

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

## Session Audit Trail

### Session 1 — 2026-02-01 (claude/opus-4.5)

**Phase 1 complete.** Initialized Bun project, configured TypeScript strict mode, installed all dependencies (commander, @opentui/core, @opentui/react, react, vitest, eslint, prettier, typescript-eslint), created CLI entry point with Commander skeleton, set up eslint/prettier configs. `bun run ci` passes all checks (fmt, lint, typecheck, test).

**Phase 2 complete.** Implemented recursive directory scanner (`src/scanner.ts`) with hidden file/dir skipping, .m4b/.mp3 filtering, sorted output by relative path. Wired into CLI with rootpath validation and progress output to stderr. 9 scanner tests + 1 placeholder = 10 tests passing. `bun run ci` green.

**Phase 3 complete.** Implemented ffprobe metadata extraction (`src/probe.ts`) with concurrency-limited worker pool, 30s timeout, JSON parsing of ffprobe output. Extracts duration, bitrate, codec, title, artist. CLI now runs scan + probe pipeline with progress. 14 probe tests (formatDuration, parseProbeOutput, probeFiles integration). 24 total tests, `bun run ci` green.
