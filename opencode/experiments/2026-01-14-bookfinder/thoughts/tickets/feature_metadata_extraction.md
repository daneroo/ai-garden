---
type: feature
priority: high
created: 2026-01-14T19:30:00Z
created_by: Antigravity
status: reviewed
tags: [cli, metadata, ffprobe, audiobooks, json]
keywords: [ffprobe, metadata extraction, m4b, duration, bitrate, bytes]
patterns: [child_process execution, concurrency management, data transformation]
---

# FEATURE-003: Enhanced Metadata Extraction with ffprobe

## Description

Extend the audiobook scanner to extract detailed metadata from `.m4b`, `.mp3`,
and `.m4a` using `ffprobe`. Update the output formats to include this metadata
and adjust the JSON size format to raw bytes.

## Context

The user needs more than just file-level stats. Information like duration,
bitrate, and tags (artist, title) are essential for an audiobook library. Using
`ffprobe` provides a standard way to extract this information. A new, more
complete fixture will be used for testing:
`Robert Frost - The Road Not Taken.m4b`.

## Requirements

### Functional Requirements

- **Supported Extensions**: Expand the scanner to include `.m4b`, `.mp3`, and
  `.m4a`. (Removing `.aac`).
- **Metadata Extraction**:
  - Use the command:
    `ffprobe -v error -show_format -show_streams -of json [file]`.
  - Extract: `duration` (seconds), `bitrate` (bps), `codec_name`, and common
    tags (`title`, `artist`/`author`, `album`).
  - Implement a standard timeout for `ffprobe` calls (e.g., 10 seconds).
  - **Fail Fast**: If `ffprobe` fails to parse a file, the application should
    exit with an error.
- **Concurrency**: Run metadata extraction in parallel (e.g., using a
  concurrency limit of 4-8) to improve performance on large libraries.
- **Output Sorting**: Sort the final output by `basename` (ascending).
- **Output Format Modification**:
  - **Default (Human)**:
    `basename | size (human) | duration (h:mm:ss) | artist | title`.
  - **JSON Mode**:
    - `size`: Output as raw **bytes** (integer).
    - Include all extracted metadata fields in a flat structure.
- **Stretch Goal (Caching)**:
  - Plan for potential caching of metadata.
  - Cache key would need to be compound (e.g., `mtime` + `expiry`).
  - Would require a cache cleanup operation.

### Non-Functional Requirements

- **Dependencies**: Ensure `ffprobe` is available in the system PATH.
- **Performance**: Parallel processing is required to handle potentially
  thousands of files.
- **Enforcement**: Run `bun run fmt:md` and `bun run lint:md` on every markdown
  file change.

## Current State

- `src/scanner.ts`: Recursively scans for `.m4b` files only, reports `path`,
  `basename`, `size`, and `mtime`.
- `src/index.ts`: Basic `yargs` CLI with human-readable and NDJSON output.
- `tests/fixtures/jfk.m4b`: Basic fixture.

## Desired State

- The CLI reports detailed audiobook metadata.
- JSON output is optimized for machine parsing (bytes for size).
- Faster scanning through parallel processing.
- `tests/fixtures/Robert Frost - The Road Not Taken.m4b`: Enhanced fixture for
  metadata testing.

## Research Context

### Keywords to Search

- ffprobe json output - Format details.
- Bun.spawn concurrency - Managing multiple sub-processes.
- javascript sort asynchronous - Sorting after parallel tasks.
- duration to h:mm:ss - Formatting utility.

### Patterns to Investigate

- P-limit or similar patterns for controlling concurrency in Bun/Node.
- Child process error handling (stderr capture).

### Key Decisions Made

- **Tool**: `ffprobe`.
- **JSON Size**: Strictly **bytes**.
- **Concurrency**: Parallel extraction (limit 4-8).
- **Sorting**: Sorted by basename.
- **Extensions**: `.m4b`, `.mp3`, `.m4a`. (Removing `.aac`).
- **Fixture**: Use `Robert Frost - The Road Not Taken.m4b` for testing.

## Success Criteria

### Automated Verification

- [ ] Integration test using `Robert Frost - The Road Not Taken.m4b`: Verify
      duration, bitrate, artist, and title match expected values.
- [ ] Verify JSON output contains `size` as a number (bytes).
- [ ] Verify output is sorted alphabetically by basename.
- [ ] CI script `bun run ci` passes.

### Manual Verification

- [ ] Run `bun start --help` to see updated documentation.
- [ ] Run `bun start -r tests/fixtures` and verify the multi-column human
      output.
- [ ] Run `bun start -r tests/fixtures --json` and verify the raw bytes.
