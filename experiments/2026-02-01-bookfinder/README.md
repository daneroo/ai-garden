# 2026-02-01-bookfinder

Audiobook scanner CLI tool. Recursively scans directories for audio files and
extracts metadata using `ffprobe`.

Harness: opencode-gpt-5.2

## Goals

- Bun runtime (not Node.js)
- Commander-based CLI: `--rootpath <path>` (required), `--json`
- Scan `.m4b` and `.mp3` recursively, skip hidden files/directories
- Probe in parallel with concurrency limit 8, with 30s timeout per file
- Output:
- Default table: File, Duration, Bitrate, Codec, Title + summary totals
- `--json`: single pretty-printed JSON array (2-space indent)

## Requirements

- Bun installed
- `ffprobe` installed and available on PATH

## Usage

Install deps:

```bash
bun install
```

Run (table):

```bash
bun run src/index.ts --rootpath "/path/to/audiobooks"
```

By default, the TUI renderer owns stdout during scanning/probing. Use `--json`
to bypass the TUI and emit machine-readable output.

When probing completes, the TUI switches to an interactive results table.
Keys:

- `j/k` or arrows: scroll
- `pgup/pgdn`, `g/G`: page/top/bottom
- Left/right arrows: cycle sort column, `r`: reverse sort
- `q` or `esc`: quit

Short flag:

```bash
bun run src/index.ts -r "/path/to/audiobooks"
```

Also accepted (alias):

```bash
bun run src/index.ts --rootPath "/path/to/audiobooks"
```

Run (JSON):

```bash
bun run src/index.ts --rootpath "/path/to/audiobooks" --json
```

Control ffprobe parallelism (default 8):

```bash
bun run src/index.ts --rootpath "/path/to/audiobooks" --concurrency 16
```

Progress is displayed on stderr (single-line, overwriting) while scanning and probing.

## Dev

```bash
bun run fmt
bun run lint
bun run check
bun run test
```
