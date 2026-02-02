# Bookfinder (Gemini 3 Pro)

- **Date**: 2026-02-02
- **Harness**: Antigravity-Gemini3ProHigh
- **Seed**: [bookfinder](../seeds/bookfinder.md)

## Goal

Implement the `bookfinder` audiobook scanner CLI tool using the
Antigravity-Gemini3ProHigh harness. This tool recursively scans directories for
audio files (`.m4b`, `.mp3`) and extracts metadata using `ffprobe`.

## CLI Interface

```bash
bun run src/index.ts --rootpath /path/to/books
```
