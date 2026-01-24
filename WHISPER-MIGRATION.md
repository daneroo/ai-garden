# Whisper Migration - Feature Inventory

**Note:** This document is superseded by `CONSOLIDATING-whisper-v2.md`. Consider
it;s work either done or account for in the new plan.

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
  - This should fail to run with bun - prove with failing ci!
- We should relocate our `data/*` working directories!
- Port Deno APIs to Bun (`Deno.Command` → `Bun.spawn`)
- Refactor runners.ts: remove whisperkit, eliminate multi-engine abstraction
- Simplify task.ts: remove engine-specific monitors, keep core TaskMonitor
  pattern
- Add segmentation logic from whisper-sh (ffmpeg segment muxer)
- Implement VTT stitching with offset adjustment (new)
- Update work directory naming to support segmented runs
- Decide what to do with current bash scripts? convert to `.ts`?
- Decide what to do with vtt-compare? move to new app?

### Target Features

Port of current whisper-bench features, and inital features:

- [x] Single engine (whisper-cpp via whisper-cli)
  - [x] make sure we simplyfy the unneded complexity and establish proper names
        for our types. Runnoer
- [x] Progress reporting (TaskMonitor pattern)
- [x] Per-run work directory
- [x] Preflight checks
- [x] Dry-run mode
- [ ] Skip existing outputs
- [x] JSON output mode
- [x] Duration/offset limits
- [x] VTT validation (monotonicity)
- [x] Log persistence
- [x] Word timestamps
- [x] Verbosity levels

Current bash scripts: consider integrating into the bun/typescript version. This
might involve leveraging the monorepo/worspaces nature of bun-one.

- [x] Multiple model comparison
- [x] Benchmark script
- [x] VTT compare script - might be a separate app, if core whisper also becomes
      a package instead of an app?

Second phase:

- m4b to vtt pipeline with auto-segmentation
  - This is going to be more sophisticated than `ffmpeg segment muxer` because
    we will want overlap for stitching
- VTT stitching with offset adjustment
