# Enhanced Metadata Extraction Implementation Plan

## Overview

Extend the audiobook scanner to extract detailed metadata using `ffprobe`.
Supported formats: `.m4b`, `.mp3`, `.m4a`. Features include duration, bitrate,
codec, and tag extraction. Parallel execution and sorted output are required.

## Current State Analysis

- **Scanner**: Only finds `.m4b` files.
- **Utils**: Basic byte and date formatting.
- **Index**: Simple loop over scanner results.
- **Fixtures**: Basic `jfk.m4b`.

## Desired End State

- **Scanner**: Finds `.m4b`, `.mp3`, `.m4a`.
- **Prober**: New module for `ffprobe` execution.
- **Index**: Parallel probing, sorted output, enhanced human/JSON reporting.
- **Fixtures**: Includes `Robert Frost - The Road Not Taken.m4b`.

### Key Discoveries

- `ffprobe` JSON output contains all required fields.
- `Bun.spawn` is suitable for running `ffprobe`.
- Concurrency limit is necessary for performance and stability.

## What We're NOT Doing

- Caching (stretch goal, postponed).
- Supporting `.aac` files.
- Metadata filtering.

## Implementation Approach

1. **Scanner Update**: Allow multiple extensions.
2. **Prober Module**: Create `src/prober.ts` for `ffprobe` integration.
3. **Utils Update**: Add `formatDuration` and ensure `formatSize` is used
   correctly for human output.
4. **CLI Integration**:
   - Collect all files first.
   - Probe them in parallel with a limit (8).
   - Sort results.
   - Print output.
5. **Test Update**: Verify metadata extraction for the new fixture.

---

## Phase 1 Overview

Implement the prober and update the scanner.

### Phase 1 Changes Required

#### 1. Prober Module

**File**: `src/prober.ts` (New File)

- Export `probeFile(path: string): Promise<Metadata>`
- Use `Bun.spawn` for `ffprobe`.
- Parse JSON output.
- Fail fast on non-zero exit code.

#### 2. Scanner Update

**File**: `src/scanner.ts`

- Change `file.endsWith(".m4b")` to support a list of extensions:
  `[".m4b", ".mp3", ".m4a"]`.

#### 3. Utils Update

**File**: `src/utils.ts`

- Add `formatDuration(seconds: number): string`.

### Phase 1 Success Criteria

#### Phase 1 Automated Verification

- [ ] `probeFile` returns correct data for `jfk.m4b`.
- [ ] `scanDirectory` finds multiple file types.

#### Phase 1 Manual Verification

- [ ] None.

---

## Phase 2 Overview

Update the main entry point to handle parallel metadata extraction and sorting.

### Phase 2 Changes Required

#### 1. Update CLI

**File**: `src/index.ts`

- Collect files into an array.
- Use a concurrency-limited parallel map to probe files.
- Sort the resulting array by `basename`.
- Print formatted output (Human or JSON).
- JSON mode: Ensure `size` is an integer (bytes).

### Phase 2 Success Criteria

#### Phase 2 Automated Verification

- [ ] `bun run src/index.ts --json` outputs valid JSON with byte sizes.
- [ ] Output is sorted alphabetically.

#### Phase 2 Manual Verification

- [ ] `bun start -r tests/fixtures` shows the new metadata columns.

---

## Phase 3 Overview

Update tests to use the new fixture and verify metadata.

### Phase 3 Changes Required

#### 1. Test Update

**File**: `tests/scanner.test.ts`

- Add test for `Robert Frost - The Road Not Taken.m4b`.
- Verify duration (76.19s), author ("Robert Frost"), and title ("The Road not
  Taken").

### Phase 3 Success Criteria

#### Phase 3 Automated Verification

- [ ] `bun test` passes.
- [ ] `bun run ci` passes.

#### Phase 3 Manual Verification

- [ ] None.

---

## Testing Strategy

### Unit Tests

- Test `prober.ts` independently.
- Test `utils.ts` formatting logic.

### Integration Tests

- Verify end-to-end scan + probe + sort + print.

## Performance Considerations

- Parallel metadata extraction (limit 8) to avoid overloading the system.
- Collecting all files first before probing (suitable for ~800 files, memory
  usage should be fine).

## References

- Ticket: `thoughts/tickets/feature_metadata_extraction.md`
- Research: `thoughts/research/2026-01-14_metadata_extraction.md`
