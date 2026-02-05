# Whisper Task Refactor Plan - V2

- We are in the `<repo>/bun-one/` directory (bun workspaces)
- We are concerned with the `<repo>/bun-one/apps/whisper/` cli app

This refers to the follow up to
[WHISPER-TASK-REFACTOR-PLAN.md](./WHISPER-TASK-REFACTOR-PLAN.md)
[WHISPER-VTT-HEADERS-PLAN.md](./WHISPER-VTT-HEADERS-PLAN.md)

## Goal

Make `runners.ts` and `task.ts` readable and well-separated. Every phase is
subtractive -- removes code and complexity, never adds it. If we stop after
any phase, the repo is better than it started.

## Invariant (every phase)

After each phase, before moving on:

- `bun run ci` passes (lint, fmt, check, test)
- `bun run fmt` if needed
- `./scripts/demo/demo.sh` passes (from `apps/whisper`)
- Commit the phase

No tests are removed without equivalent replacements. Test count must be
preserved or improved at every checkpoint.

---

## Phase 0: Create feature branch

- [ ] `git checkout -b refactor/whisper-simplify`
- [ ] Starting point: clean main, CI green

---

## Phase 1: Extract `lib/segmentation.ts` from `runners.ts`

Biggest win. Pulls ~200 lines of pure math out of `runners.ts`, making the
pipeline logic readable again. All moved functions are pure (no side effects,
no I/O).

### Create `lib/segmentation.ts`

Move these functions from `runners.ts`:

- [ ] `MIN_SEGMENT_REMAINDER_SEC` constant
- [ ] `computeSegmentCount(audioDuration, segmentSec)`
- [ ] `getStartSegmentIndex(startSec, segmentSec, segmentCount)`
- [ ] `getSegmentEndSec(...)` (currently private -- export it)
- [ ] `getEndSegmentIndex(endSec, audioDuration, segmentSec, overlapSec, segmentCount)`
- [ ] `resolveSegmentSec(audioDurationSec, requestedSegmentSec)`
- [ ] `getSegmentDurationLabel({...})`
- [ ] `getSegmentSuffix(index, segmentSec, overlapSec, opts?)`

Refactor these to take primitives instead of `RunConfig` (avoids circular
dependency, improves testability):

- [ ] `getOffsetMsForSegment(segIndex, startSec, segmentSec, segmentCount)`
  - was: `(segIndex, config: RunConfig, segmentSec, segmentCount)`
- [ ] `getDurationMsForSegment(segIndex, startSec, durationSec, audioDuration, segmentSec, overlapSec, segmentCount)`
  - was: `(segIndex, config: RunConfig, audioDuration, segmentSec, segmentCount)`

### Create `lib/segmentation_test.ts`

Move corresponding tests from `runners_test.ts`:

- [ ] `getSegmentSuffix` tests
- [ ] `computeSegmentCount` tests
- [ ] `getStartSegmentIndex` tests
- [ ] `getEndSegmentIndex` tests
- [ ] `getOffsetMsForSegment` tests (update to pass primitives instead of
      mockConfig)
- [ ] `getDurationMsForSegment` tests (update to pass primitives instead of
      mockConfig)

### Update `lib/runners.ts`

- [ ] Remove moved functions
- [ ] Add imports from `./segmentation.ts`
- [ ] Update call sites in `buildWavTasks`, `buildTranscribeTasks`,
      `computeTranscribeRange`, `runWhisperPipeline` to pass primitives where
      signatures changed

`MAX_WAV_DURATION_SEC` stays in `runners.ts` (only used at the call site of
`resolveSegmentSec`).

### Phase 1 checkpoint

- [ ] `bun run ci` passes
- [ ] `./scripts/demo/demo.sh` passes
- [ ] Test count unchanged
- [ ] Commit: `refactor(whisper): extract segmentation module`

Expected result: `runners.ts` drops from ~726 to ~500 lines.

---

## Phase 2: Clean up `task.ts` interface

Remove dead weight from the Task interface.

### Remove `TaskContext`

- [ ] Remove `TaskContext` interface (unused by all factory implementations)
- [ ] Change `Task.execute(ctx: TaskContext)` to `Task.execute()`
- [ ] Remove `_ctx` params and eslint-disable comments from both factory
      functions
- [ ] Remove ctx construction in `runners.ts` execution loop
- [ ] `task.execute()` instead of `task.execute(ctx)`

### Remove premature `"stitch"` from `TaskKind`

- [ ] Change `TaskKind = "to-wav" | "transcribe" | "stitch"` to
      `TaskKind = "to-wav" | "transcribe"`
- [ ] No factory exists for stitch; add it back when implemented

### Phase 2 checkpoint

- [ ] `bun run ci` passes
- [ ] `./scripts/demo/demo.sh` passes
- [ ] Commit: `refactor(whisper): remove unused TaskContext and stitch kind`

---

## Phase 3: Relocate experimental tools and cleanup

### Move standalone tools out of `lib/`

- [ ] `lib/vtt-compare.ts` (998 lines) -> `scripts/tools/vtt-compare.ts`
- [ ] `lib/vtt-monotonicity.ts` (192 lines) -> `scripts/tools/vtt-monotonicity.ts`
- [ ] Update their import paths (`./vtt.ts` -> `../../lib/vtt.ts` etc.)

These are standalone CLI tools with `import.meta.main` entry points, not
pipeline code.

### Remove legacy script

- [ ] Delete `segment_poc.sh` (145 lines, superseded by TypeScript
      segmentation)

### Phase 3 checkpoint

- [ ] `bun run ci` passes
- [ ] `./scripts/demo/demo.sh` passes
- [ ] Commit: `refactor(whisper): relocate experimental tools to scripts/`

---

## Expected final state

| File              | Before | After (approx) |
| ----------------- | ------ | -------------- |
| `runners.ts`      | 726    | ~500           |
| `task.ts`         | 540    | ~500           |
| `segmentation.ts` | (new)  | ~200           |
| `lib/` total      | ~4248  | ~2800          |

- `runners.ts` reads as a pipeline: build tasks, execute, stitch
- `segmentation.ts` is pure math, tested in isolation
- `task.ts` has two clear layers with no dead-weight interfaces
- Experimental tools live in `scripts/`, not `lib/`

---

## Deferred (not in this plan)

- Redesign segmentation as a plan: single `computeSegmentPlan()` returning
  `{startSec, endSec}[]` instead of many per-segment index functions
- `createStitchTask` factory (add when stitch becomes a Task)
- Extract `runTask`/monitors to `lib/spawn.ts` (further separation)
- Artifact directory reorganization
- Overlap stitching implementation
