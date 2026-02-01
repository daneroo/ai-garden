# 2026-02-01-booktui

**Seed**: [bookfinder](../seeds/bookfinder.md)
**Harness**: claude/opus-4.5

## Experiment Goal

Build an interactive audiobook scanner CLI tool that discovers and analyzes audiobook files, providing both human-friendly TUI views and machine-readable JSON output.

## Problem/Code Goal

Create a production-ready Bun/TypeScript CLI application using:

- Commander for argument parsing
- OpenTUI for interactive terminal interface
- ffprobe for audio metadata extraction
- Modern TypeScript patterns (ESM, strict typing)

Key features:

- Recursive directory scanning for audio files
- Progress indication during scan
- Interactive results table (filterable, sortable)
- JSON export capability
- Robust error handling

## Status

Initial setup - experiment artifacts created.
