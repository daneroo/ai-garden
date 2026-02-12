# bookfinder-opencode-gemini-3-pro

Audiobook scanner CLI tool. Recursively scans directories for audio files and extracts metadata using ffprobe.

## Usage

```bash
bun run src/index.ts --rootpath /path/to/books
```

## Options

- `-r, --rootpath <path>`: Root directory to scan (required)
- `-c, --concurrency <n>`: Max parallel ffprobe processes (default: 8)
- `--json`: Output JSON instead of TUI

## Development

Run CI checks:

```bash
bun run ci
```
