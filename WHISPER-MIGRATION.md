# Whisper Migration - Feature Inventory

This document inventories the features of `whisper-sh/` and `whisper-bench/`
implementations to plan consolidation into a single Bun/TypeScript
implementation.

## Implementation Approach

Copy whisper-bench into `bun-one/apps/whisper/`, then adapt for the consolidated
workflow.

Why this approach:

- TaskMonitor/ProgressReporter architecture is well-designed and worth
  preserving
- VTT handling (parsing, validation, monotonicity) is non-trivial and already
  tested
- Porting Deno → Bun is mostly mechanical (`Deno.Command` → `Bun.spawn`)
- Segmentation logic from whisper-sh is well-isolated and easy to integrate

Implementation steps:

- Copy whisper-bench to `bun-one/apps/whisper/`
- Port Deno APIs to Bun (`Deno.Command` → `Bun.spawn`)
- Refactor runners.ts: remove whisperkit, eliminate multi-engine abstraction
- Simplify task.ts: remove engine-specific monitors, keep core TaskMonitor
  pattern
- Add segmentation logic from whisper-sh (ffmpeg segment muxer)
- Implement VTT stitching with offset adjustment (new)
- Update work directory naming to support segmented runs

### Target Features

Port of current whisper-bench features, and inital features:

- Single engine (whisper-cpp via whisper-cli)
  - make sure we simplyfy the unneded complexity and establish proper names for
    our types. Runnoer
- Progress reporting (TaskMonitor pattern)
- Per-run work directory
- Preflight checks
- Dry-run mode
- Skip existing outputs
- JSON output mode
- Duration/offset limits
- VTT validation (monotonicity)
- Log persistence
- Word timestamps
- Verbosity levels

Current bash scripts: consider integrating into the bun/typescript version

- Multiple model comparison
- Benchmark script

Second phase:

- m4b to vtt pipeline with auto-segmentation
  - This is going to be more sophisticated than `ffmpeg segment muxer` because
    we will want overlap for stitching
- VTT stitching with offset adjustment
