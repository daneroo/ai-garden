# Plan: bookfinder-opencode-gpt-5-2

Harness: opencode-gpt-5.2

Goal: Build a Bun + TypeScript CLI that scans for `.m4b`/`.mp3` files and uses
`ffprobe` to extract metadata, per `experiments/seeds/bookfinder.md`.

## Milestones

- [x] M1 Scaffold project (package.json/scripts, tsconfig, eslint, prettier, vitest)
- [x] M2 Implement recursive scanner (skip hidden, extensions filter, rel paths)
- [x] M3 Implement ffprobe runner (JSON output, 30s timeout, parse required fields)
- [x] M4 Add concurrency limit (8) for ffprobe calls
- [x] M5 Output formatting
- [x] M5a Table: aligned columns, truncation, duration HH:MM:SS, summary totals
- [x] M5b JSON: single pretty-printed array (2-space indent)
- [x] M6 Tests (helpers + scanner + ffprobe parsing)
- [x] M7 Verify: `bun install && bun run fmt && bun run lint && bun run check && bun run test`

## Decisions / Notes

- ffprobe invocation: `ffprobe -v error -print_format json -show_format -show_streams <file>`
- Duration: use `format.duration` (seconds). Table format rounds to nearest second.
- Bitrate: prefer `format.bit_rate` (bps), fallback to first audio stream `bit_rate`.
- Codec: from first audio stream `codec_name`.
- Title/Artist: from `format.tags` (fallback to stream tags).

## Command Log

- 2026-02-01: `mkdir -p experiments/bookfinder-opencode-gpt-5-2/{src,tests}`
- 2026-02-01: `bun install`
- 2026-02-01: `bun run fmt`
- 2026-02-01: `bun run lint`
- 2026-02-01: `bun run check`
- 2026-02-01: `bun run test`
- 2026-02-01: Added `ci` script: `bun run ci`
- 2026-02-01: Accept `--rootPath` as alias for `--rootpath`
- 2026-02-01: Add `-r` alias for `--rootpath`
- 2026-02-01: Add `--concurrency/-c` to control parallel ffprobe
- 2026-02-01: Track and print max observed ffprobe concurrency
- 2026-02-01: Add elapsed time + seconds/file to probe completion line
- 2026-02-01: Add elapsed + remaining estimate to probe progress line
- 2026-02-01: Remove scan timing from final line (keep elapsed)
- 2026-02-01: Switch to OpenTUI renderer for progress (stdout-owned UI)
- 2026-02-01: Require `bun add` for dependency changes
- 2026-02-01: Add OpenTUI results view with sorting + scrolling
