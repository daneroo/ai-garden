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

- [x] `git checkout -b refactor/whisper-simplify`
- [x] Starting point: clean main, CI green

---

## Phase 1: Extract `lib/segmentation.ts` from `runners.ts`

Biggest win. Pulls ~200 lines of pure math out of `runners.ts`, making the
pipeline logic readable again. All moved functions are pure (no side effects,
no I/O).

### Create `lib/segmentation.ts`

Move these functions from `runners.ts`:

- [x] `MIN_SEGMENT_REMAINDER_SEC` constant
- [x] `computeSegmentCount(audioDuration, segmentSec)`
- [x] `getStartSegmentIndex(startSec, segmentSec, segmentCount)`
- [x] `getSegmentEndSec(...)` (currently private -- export it)
- [x] `getEndSegmentIndex(endSec, audioDuration, segmentSec, overlapSec, segmentCount)`
- [x] `resolveSegmentSec(audioDurationSec, requestedSegmentSec)`
- [x] `getSegmentDurationLabel({...})`
- [x] `getSegmentSuffix(index, segmentSec, overlapSec, opts?)`

Refactor these to take primitives instead of `RunConfig` (avoids circular
dependency, improves testability):

- [x] `getOffsetMsForSegment(segIndex, startSec, segmentSec, segmentCount)`
  - was: `(segIndex, config: RunConfig, segmentSec, segmentCount)`
- [x] `getDurationMsForSegment(segIndex, startSec, durationSec, audioDuration, segmentSec, overlapSec, segmentCount)`
  - was: `(segIndex, config: RunConfig, audioDuration, segmentSec, segmentCount)`

### Create `lib/segmentation_test.ts`

Move corresponding tests from `runners_test.ts`:

- [x] `getSegmentSuffix` tests
- [x] `computeSegmentCount` tests
- [x] `getStartSegmentIndex` tests
- [x] `getEndSegmentIndex` tests
- [x] `getOffsetMsForSegment` tests (update to pass primitives instead of
      mockConfig)
- [x] `getDurationMsForSegment` tests (update to pass primitives instead of
      mockConfig)

### Update `lib/runners.ts`

- [x] Remove moved functions
- [x] Add imports from `./segmentation.ts`
- [x] Update call sites in `buildWavTasks`, `buildTranscribeTasks`,
      `computeTranscribeRange`, `runWhisperPipeline` to pass primitives where
      signatures changed

`MAX_WAV_DURATION_SEC` stays in `runners.ts` (only used at the call site of
`resolveSegmentSec`).

### Phase 1 checkpoint

- [x] `bun run ci` passes
- [x] `./scripts/demo/demo.sh` passes
- [x] Test count unchanged
- [x] Commit: `refactor(whisper): extract segmentation module`

Expected result: `runners.ts` drops from ~726 to ~500 lines.

---

## Phase 2: Clean up `task.ts` interface

Remove dead weight from the Task interface.

### Remove `TaskContext`

- [x] Remove `TaskContext` interface (unused by all factory implementations)
- [x] Change `Task.execute(ctx: TaskContext)` to `Task.execute()`
- [x] Remove `_ctx` params and eslint-disable comments from both factory
      functions
- [x] Remove ctx construction in `runners.ts` execution loop
- [x] `task.execute()` instead of `task.execute(ctx)`

### Remove premature `"stitch"` from `TaskKind`

- [x] Change `TaskKind = "to-wav" | "transcribe" | "stitch"` to
      `TaskKind = "to-wav" | "transcribe"`
- [x] No factory exists for stitch; add it back when implemented

### Phase 2 checkpoint

- [x] `bun run ci` passes
- [x] `./scripts/demo/demo.sh` passes
- [x] Commit: `refactor(whisper): remove unused TaskContext and stitch kind`

---

## Phase 3: Relocate experimental tools and cleanup

### Move standalone tools out of `lib/`

- [x] `lib/vtt-compare.ts` (998 lines) -> `scripts/tools/vtt-compare.ts`
- [x] `lib/vtt-monotonicity.ts` (192 lines) -> `scripts/tools/vtt-monotonicity.ts`
- [x] Update their import paths (`./vtt.ts` -> `../../lib/vtt.ts` etc.)

These are standalone CLI tools with `import.meta.main` entry points, not
pipeline code.

### Remove legacy script

- [x] Delete `segment_poc.sh` (145 lines, superseded by TypeScript
      segmentation)

### Phase 3 checkpoint

- [x] `bun run ci` passes
- [x] `./scripts/demo/demo.sh` passes
- [x] Commit: `refactor(whisper): relocate experimental tools to scripts/`

---

## Expected final state

| File              | Before | After |
| ----------------- | ------ | ----- |
| `runners.ts`      | 726    | 564   |
| `task.ts`         | 540    | 525   |
| `segmentation.ts` | (new)  | 179   |
| `lib/` total      | ~4248  | 2825  |

- `runners.ts` reads as a pipeline: build tasks, execute, stitch
- `segmentation.ts` is pure math, tested in isolation
- `task.ts` has two clear layers with no dead-weight interfaces
- Experimental tools live in `scripts/`, not `lib/`

---

## Deferred (not in this plan)

- Redesign segmentation as a plan: single `computeSegmentPlan()` returning
  `{startSec, endSec}[]` instead of many per-segment index functions
- Make stitch a proper Task: add `"stitch"` back to `TaskKind`, create
  `createStitchTask` factory, move `stitchSegments` logic into `execute()`
- Extract `runTask`/monitors to `lib/spawn.ts` (further separation)
- Artifact directory reorganization
- Overlap stitching implementation
