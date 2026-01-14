---
type: feature
priority: medium
created: 2026-01-14T00:00:00Z
status: reviewed
tags: [cli, hashing, integrity, bun]
keywords: [directory traversal, digest, sha256, sha1, blake3, jsonl, verify]
patterns: [cli flag parsing, hashing utilities, manifest verification, stderr progress]
---

# FEATURE-001: Directory digester CLI

## Description

Create a CLI tool that recursively scans a directory tree and computes file digests for integrity verification. The tool should emit deterministic JSONL output, support verify mode, and provide progress plus summary reporting on stderr.

## Context

Primary use case is personal integrity verification across deeply nested directory trees with thousands of files. The tool should be simple, predictable, and easy to run from the command line.

## Requirements

### Functional Requirements

- Accept a source directory flag (e.g., `--source`).
- Accept a digest algorithm flag (e.g., `--algo`) supporting `sha256` and `sha1` with `blake3` as a stretch goal.
- When `--json` is provided, output JSONL records to stdout by default.
- Allow writing output to a file via an `--output` flag.
- Emit JSONL records with `path`, `digest` (formatted as `algo:value`), `size`, and `mtime`.
- Ensure deterministic ordering (alphabetical by path) for output.
- Provide a verify mode via `--verify <manifest-path>`.
- Require `--algo` to match the algorithm used by the manifest in verify mode.
- Warn on missing files or extra files during verify mode and continue scanning.
- Treat symlinks as fatal errors and stop the run.
- Return a non-zero exit code for any mismatch, missing file, extra file, or symlink.
- Provide single-line progress output to stderr with cursor updates.
- Emit a stderr summary with timestamps at the end of the run.

### Non-Functional Requirements

- Handle thousands of files and deep directory trees without concurrency.
- Use Bun as the runtime.
- Output should be stream-friendly (no buffering entire manifest in memory).

## Current State

No existing CLI tool for directory digesting in this experiment.

## Desired State

A Bun-based CLI that can generate deterministic JSONL digests and verify against a prior manifest with clear stderr progress and summary reporting.

## Research Context

### Keywords to Search

- directory traversal - locate existing walk utilities or helpers
- digest - locate hashing utilities or patterns
- sha256 - check hashing implementation examples
- jsonl - identify line-delimited JSON output patterns
- verify - find comparison/verification patterns
- bun - align with Bun-specific CLI patterns

### Patterns to Investigate

- cli flag parsing - existing argument parsing conventions
- hashing utilities - reusable digest helpers
- manifest verification - patterns for comparing file sets
- stderr progress - single-line progress output patterns

### Key Decisions Made

- Use Bun as the runtime - aligns with experiment constraints.
- Output JSONL with `digest` as `algo:value` - simplifies verification.
- Deterministic alphabetical ordering - predictable output for diffs.
- Symlinks are fatal - avoids ambiguity in traversal.
- Verify mode warns for missing/extra files - non-fatal but sets failure exit.

## Success Criteria

### Automated Verification

- [ ] `bun test`

### Manual Verification

- [ ] Run CLI against a sample directory and verify JSONL output.
- [ ] Run verify mode against a manifest and confirm warnings and exit code.
- [ ] Confirm stderr progress is single-line and summary includes timestamps.

## Related Information

- Experiment directory: `experiments/2026-01-14-directory-digester/`

## Notes

- Stretch goal: add `blake3` support if available in Bun.
