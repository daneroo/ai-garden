# Whisper Consolidation - Status and Plan

This document supersedes `CONSOLIDATING-whisper.md` and `WHISPER-MIGRATION.md`.
It captures what has been accomplished and what remains.

We are wrapping the ivocation of the `whisper-cli` into a tool which controls
the execution of the transcription pipeline.

We are consolidating two such implementations into a new implementation at
`bun-one/apps/whisper/`.

## Context

Two implementations existed: `whisper-sh/` (bash + node) and `whisper-bench/`
(deno + typescript).

The goal is a single Bun/TypeScript implementation at `bun-one/apps/whisper/`.

We chose to use `whisper-bench/` as starting point because of its TaskMonitor
architecture, VTT validation, and structured output. The multi-engine
abstraction (whisperkit + whispercpp) was removed since whisperkit produces
non-monotonic VTT timestamps.

## Completed Work

The core transcription pipeline now runs under Bun with all tests passing.

- [x] Initial Port: Copied whisper-bench to bun-one/apps/whisper
- [x] API Migration: Ported Deno.* to bun compatible
- [x] Simplification: Removed whisperkit, refactored monitor architecture

## Remaining Work

- Validate the --start (-s) , --duration (-d), --word-timestamps options
- Cache the output of the .wav file if it has already been converted
- Benchmarking: bash or ts? output location?
  - compare: models, durations, word-level-timestamps,
  - sources: whisper-sh/bench.sh, whisper-bench/bench.sh,
    whisper-sh/whisperBench.mjs
- Project documentation: Write README.md mostly to capture content of originals
  - sources: whisper-sh/README.md, whisper-bench/README.md
- Monotonicity analysis: This informed the decision to drop whisperkit but the
  documentation itself was not migrated. should also be included in vtt output
  validation?
- Check if output VTT exists before transcribing, and define interactive
  behavior
- Data directory configuration:
  - Support WHISPER_DATA_DIR environment variable
  - might want to split sample,work,models, and cache(new) directories
- List audiobooks by duration
  - source: whisper-sh/AUDIOBOOK-DURATIONS.md
- Segmentation pipeline: Handle files over 37 hours by splitting into segments,
  transcribe each, then stitch VTTs with offset adjustment
  - source: `whisper-sh/whisper.mjs` and `whisper-sh/whisperBench.mjs`
  - we may look to `whisper-sh/whisper.mjs` for ideas, but this will be a new
    implementation (with overlap of segments)
- VTT stitching: After segmented transcription, multiple VTT files must be
  combined with offset adjustment. Neither implementation has this; it was
  identified as a critical gap.
- VTT comparison tooling: Decide where 34KB vtt-compare code should live and
  whether to maintain it
  - sources: whisper-bench/lib/vtt-compare.ts, VTT-COMPARE-PLAN.md
- Cleanup: Remove /external-repos/whisper.cpp after capturing model download
  script (which should live with models?)
- Cleanup: Remove `whisper-bench` and `whisper-sh` directories
