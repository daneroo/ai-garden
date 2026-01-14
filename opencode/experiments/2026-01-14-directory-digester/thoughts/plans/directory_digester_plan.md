# Directory Digester Implementation Plan

## Overview

Implement a Bun-based CLI that walks a directory tree, hashes files with `node:crypto`, emits deterministic JSONL manifests, and verifies against a prior manifest while reporting progress and summaries on stderr.

## Current State Analysis

The experiment directory contains requirements and research notes but no implementation. Constraints require Bun runtime, a simple unit test, and a manual E2E run log.

## Desired End State

A CLI tool exists in the experiment directory that:

- Accepts `--source`, `--algo`, `--json`, `--output`, and `--verify` flags.
- Emits JSONL lines with `path`, `digest`, `size`, and `mtime` in deterministic order.
- Supports verify mode with non-zero exit codes on mismatches, missing files, extra files, or symlinks.
- Reports progress and a timestamped summary to stderr.
- Includes a simple unit test and a manual E2E run log.

### Key Discoveries

- Requirements and flags are specified in `experiments/2026-01-14-directory-digester/thoughts/tickets/feature_directory_digester.md:13`.
- Bun argument parsing can use `util.parseArgs` with `Bun.argv` per `experiments/2026-01-14-directory-digester/thoughts/research.md:5`.
- Hashing can use `node:crypto` `createHash`, also noted in `experiments/2026-01-14-directory-digester/thoughts/research.md:11`.

## What We're NOT Doing

- No `blake3` support in the initial implementation.
- No concurrency or parallel hashing.
- No filtering by file extension or max depth.
- No ignore pattern support.

## Implementation Approach

Build a small Bun CLI entrypoint that parses flags, validates inputs, and dispatches to a traversal/hash pipeline. Use `fs/promises` and `node:crypto` to stream file contents into a hasher. Emit JSONL to stdout or a file, maintain deterministic ordering, and implement verify mode by comparing current results to a manifest file. Progress and summary reporting go to stderr.

## Phase 1: CLI Entry + Config

### Overview

Set up the CLI entrypoint, argument parsing, and configuration validation.

### Changes Required

#### 1. CLI entrypoint
**File**: `experiments/2026-01-14-directory-digester/src/cli.ts`
**Changes**: Add Bun entrypoint, parse flags with `util.parseArgs`, validate `--source`, `--algo`, and mode flags, and prepare a config object for downstream logic.

```ts
import { parseArgs } from "util";
const { values } = parseArgs({ args: Bun.argv, options: { source: { type: "string" } } });
```

### Success Criteria

#### Automated Verification
- [ ] `bun test`

#### Manual Verification
- [ ] `bun run src/cli.ts --source ./samples --algo sha256 --json` parses flags and exits without error.

---

## Phase 2: Traversal + Hashing

### Overview

Implement directory walking, symlink detection, and hashing via `node:crypto`.

### Changes Required

#### 1. Traversal utilities
**File**: `experiments/2026-01-14-directory-digester/src/traverse.ts`
**Changes**: Recursively read directory contents, sort paths alphabetically, and yield file paths. Detect symlinks via `lstat` and throw a fatal error.

#### 2. Hashing utilities
**File**: `experiments/2026-01-14-directory-digester/src/hash.ts`
**Changes**: Stream file contents into `createHash` and return hex digests for `sha1` and `sha256`.

```ts
import { createHash } from "node:crypto";
```

### Success Criteria

#### Automated Verification
- [ ] `bun test`

#### Manual Verification
- [ ] Hash output matches `shasum -a 256` for a sample file.

---

## Phase 3: Manifest Output + Verify Mode

### Overview

Implement JSONL output, optional file output, and verify mode comparisons.

### Changes Required

#### 1. Manifest writer
**File**: `experiments/2026-01-14-directory-digester/src/manifest.ts`
**Changes**: Emit JSONL lines with `path`, `digest`, `size`, `mtime` to stdout or `--output` file.

#### 2. Verify mode
**File**: `experiments/2026-01-14-directory-digester/src/verify.ts`
**Changes**: Read manifest JSONL line by line, compare to current digest stream, warn on missing/extra files, enforce algorithm match, and compute exit code.

### Success Criteria

#### Automated Verification
- [ ] `bun test`

#### Manual Verification
- [ ] `--verify` reports mismatches and returns non-zero exit code.

---

## Phase 4: Progress + Summary Reporting

### Overview

Provide stderr progress updates and timestamped summary.

### Changes Required

#### 1. Progress reporter
**File**: `experiments/2026-01-14-directory-digester/src/progress.ts`
**Changes**: Write a single-line stderr progress indicator using cursor controls and finalize with a timestamped summary.

### Success Criteria

#### Automated Verification
- [ ] `bun test`

#### Manual Verification
- [ ] Progress updates in-place on stderr and summary includes timestamps.

---

## Phase 5: Tests + Manual E2E Log

### Overview

Add a small unit test and capture a manual E2E log in `thoughts/`.

### Changes Required

#### 1. Unit tests
**File**: `experiments/2026-01-14-directory-digester/tests/hash.test.ts`
**Changes**: Verify hashing output for known input and error on invalid algorithm.

#### 2. Manual E2E log
**File**: `experiments/2026-01-14-directory-digester/thoughts/e2e.md`
**Changes**: Record manual run commands and observed output.

### Success Criteria

#### Automated Verification
- [ ] `bun test`

#### Manual Verification
- [ ] Manual E2E log exists and reflects a real run.

---

## Testing Strategy

### Unit Tests

- Hash a fixed fixture file with `sha1` and `sha256`.
- Validate error handling for unsupported algorithms.

### Integration Tests

- Not required for this experiment.

### Manual Testing Steps

- Run `bun run src/cli.ts --source ./samples --algo sha256 --json` and inspect JSONL output.
- Run `bun run src/cli.ts --source ./samples --algo sha256 --verify ./manifest.jsonl` and confirm warnings and exit code.
- Confirm stderr progress output is single-line with timestamps.

## Performance Considerations

- Use streaming reads to avoid buffering entire files.
- Avoid loading full manifests into memory; process line-by-line.

## Migration Notes

- Not applicable.

## References

- Original ticket: `experiments/2026-01-14-directory-digester/thoughts/tickets/feature_directory_digester.md`
- Research notes: `experiments/2026-01-14-directory-digester/thoughts/research.md`
