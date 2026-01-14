---
type: feature
priority: high
created: 2026-01-14T16:00:00Z
created_by: Antigravity
status: reviewed
tags: [cli, recursion, fs, m4b, json]
keywords: [yargs, glob, recursive scan, file metadata, m4b]
patterns: [recursive file search, metadata extraction, json output]
---

# FEATURE-002: Recursive M4B Audiobook Scanner

## Description

Replace the existing "Hello World" CLI functionality with a tool that
recursively scans a specified directory for audiobook files (`*.m4b`) and
outputs their metadata (basename, size, modification time) in JSON format.

## Context

The user wants to transition the CLI from a scaffold to a functional tool for
managing/indexing audiobooks. This is the core functionality: locating files and
reporting basic stats.

## Requirements

### Functional Requirements

- **Directory Scanning**:
- Recursively search for `*.m4b` files.
- Default root directory: `ENV: ROOTPATH` or
  `/Volumes/Space/Reading/audiobooks/`.
- Allow overriding root path via CLI argument `--rootpath` or `-r`.
- Include auto-generated help via `--help` or `-h`.
- **Output Format**:
  - **Default**: Human Readable text format (e.g.,
    `File: book.m4b | Size: 1.5 GB | Date: 2023-01-01`).
  - **JSON Mode**: Activated via `--json` flag. Output one JSON object per line
    (NDJSON style).
  - Fields: `basename` (filename), `size` (human readable, e.g., "1.5 GB"),
    `mtime` (ISO 8601).
- **Symlinks**:
  - Do NOT follow symlinks.
  - Log a warning when a symlink is encountered and skip it.
- **Error Handling**:
  - Log warnings for inaccessible files/directories (permission denied) but
    continue scanning.

### Non-Functional Requirements

- **Performance**: Should handle large directory trees efficiently.
- **Dependencies**: Use `glob` or `fs` (Bun native `Bun.file` / `readdir`)?
  - _Constraint_: Must work within the existing Bun + Yargs setup.

## Current State

- `src/index.ts`: "Hello World" CLI using Yargs.
- `tests/index.test.ts`: Tests for Hello World.

## Desired State

- `src/index.ts`: Implements the scanner logic.
- `tests/index.test.ts`: Tests recursive scanning and output format.

## Research Context

### Keywords to Search

- bun readdir recursive - Efficient way to scan in Bun.
- fs.stat - Getting mtime and size.
- human readable size - Library or utility function.
- yargs environment variable - How to bind `ROOTPATH` env var to the `-r`
  argument.

### Patterns to Investigate

- Recursive directory traversal (native vs glob).
- NDJSON output patterns.

### Key Decisions Made

- **Format**: JSON (NDJSON style per line).
- **Recursion**: Yes.
- **Symlinks**: Warn & Skip.
- **Date**: ISO 8601.
- **Size**: Human Readable.

## Success Criteria

### Automated Verification

- [ ] Test scanning a known directory structure with mocks.
- [ ] Verify JSON output structure
      `z.object({ basename: z.string(), size: z.string(), mtime: z.string() })`.
- [ ] Verify symlink skipping/warning.

### Manual Verification

- [ ] Run against a real directory (or sample created one).
- [ ] Verify "human readable" size looks correct (e.g. 100MB vs 104857600).
