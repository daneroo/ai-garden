# Recursive M4B Scanner Implementation Plan

## Overview

Replace the current "Hello World" CLI with a functional tool that recursively
scans a directory for `.m4b` audiobook files. The tool will output file metadata
(basename, size, mtime) in either a human-readable format (default) or NDJSON
(via `--json` flag).

## Current State Analysis

- **Existing**: `src/index.ts` contains a basic "Hello World" example using
  `yargs`.
- **Missing**: Scanning logic, metadata extraction, formatters, and recursive
  handling.
- **Goal**: Transform `src/index.ts` into the main scanner entry point.

## Desired End State

- **CLI**: Accepts `-r/--rootpath` (defaults to env `ROOTPATH` or fallback) and
  `--json`.
- **Behavior**: Scans recursively, skips symlinks (with warning), handles
  permission errors gracefully.
- **Output**: Prints lines immediately as files are found.

### Key Discoveries

- **Scanning**: Manual recursion with `node:fs/promises` (`readdir`, `lstat`) is
  safer than `Bun.Glob` for explicit symlink/error handling.
- **Streaming**: Using an `AsyncGenerator` allows for streaming output,
  fulfilling the "print a line for each" requirement efficiently.

## Implementation Approach

1. **Scanner Module**: Create a dedicated scanner generator that yields file
   stats.
2. **Formatter**: Helper functions to format bytes and dates.
3. **CLI Integration**: Update `src/index.ts` to wire up `yargs` with the
   scanner.
4. **Testing**: Unit tests for the scanner logic using a temporary directory
   structure.

---

## Phase 1 Overview

Implement the core business logic: recursive scanning and metadata formatting.

### Phase 1 Changes Required

#### 1. Scanner Module

**File**: `src/scanner.ts` (New File) **Content**:

- Export `scanDirectory(root: string): AsyncGenerator<AudiobookFile>`
- Define interface `AudiobookFile { path: string; size: number; mtime: Date }`
- Implement manual recursion using `readdir`.
- Handle `isSymbolicLink()` -> warn & skip.
- Handle `catch` errors -> warn & continue.

#### 2. Formatters

**File**: `src/utils.ts` (New File) **Content**:

- `formatSize(bytes: number): string` (e.g. "1.50 GB")
- `formatDate(date: Date): string` (ISO string)

### Phase 1 Success Criteria

- [x] `scanDirectory` yields correct files from a test structure.
- [x] Symlinks are logged as warnings and skipped.
- [x] Formatters produce expected strings.

---

## Phase 2 CLI Integration

### Phase 2 Overview

Update the entry point to use the scanner and handle arguments.

### Phase 2 Changes Required

#### 1. Update CLI

**File**: `src/index.ts` **Changes**:

- Remove "Hello World" logic.
- Configure `yargs`:
  - `-r, --rootpath`: string, default `process.env.ROOTPATH` or
    `/Volumes/Space/Reading/audiobooks/`.
  - `--json`: boolean, default `false`.
  - `-h, --help`: auto-generated.
- Iterate over `scanDirectory` generator.
- Print formatted output based on flags.

### Phase 2 Success Criteria

- [x] `bun run src/index.ts` scans the default path.
- [x] `bun run src/index.ts --json` outputs NDJSON.
- [x] `bun run src/index.ts -r ./tests` scans the test directory.

---

## Phase 3 Testing

### Phase 3 Overview

Verify functionality with integration tests.

### Phase 3 Changes Required

#### 1. Integration Tests

**File**: `tests/scanner.test.ts` (Rename `index.test.ts` or create new)
**Changes**:

- Setup: Copy
  `/Users/daniel/Code/iMetrical/ai-garden/whisper-bench/test/fixtures/jfk.m4b`
  to `tests/fixtures/jfk.m4b`.
- Test: Run the scanner against `tests/fixtures`.
- Assert: Verify that `jfk.m4b` is found and its metadata (size/mtime) is
  correct.

### Phase 3 Success Criteria

- [x] Fixture `jfk.m4b` exists in `tests/fixtures`.
- [x] Tests pass via `bun test` using the real file.

---

## Testing Strategy

### Unit Tests

- Mock `fs.readdir` / `fs.stat` if necessary, but integration tests with real
  temp files are more reliable for file system operations in Bun.

### Manual Verification

- Run: `bun run src/index.ts --rootpath .` (should find nothing or specific test
  files).
- Run: `bun run src/index.ts --help` (should show help).
