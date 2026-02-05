# Whisper Task Refactor Plan - V3

- We are in the `<repo>/bun-one/` directory (bun workspaces)
- We are concerned with the `<repo>/bun-one/apps/whisper/` cli app

Follows [WHISPER-TASK-REFACTOR-v2-PLAN.md](./WHISPER-TASK-REFACTOR-v2-PLAN.md)

## Goal

Replace the scattered per-segment index functions with a single upfront
`computeSegments()` that returns a flat array of `Segment` objects. The pipeline
becomes: compute segments, build tasks from segments, execute, stitch.

## Problem

`segmentation.ts` currently has 10 exported functions that are called piecemeal
from different places in `runners.ts`. The pipeline recomputes segment indices,
suffixes, offsets, and durations separately in `runWhisperPipeline`,
`buildWavTasks`, `buildTranscribeTasks`, and the stitch block. This makes the
flow hard to follow.

Current flow in `runWhisperPipeline`:

```txt
segmentSec = resolveSegmentSec(...)
segmentCount = computeSegmentCount(...)
segmentDurationLabel = getSegmentDurationLabel(...)
{firstTranscribeIdx, lastTranscribeIdx} = computeTranscribeRange(...)
segmentIndices = [0..segmentCount]
wavTasks = segmentIndices.flatMap(i => buildWavTasks({...9 fields...}))
transcribeTasks = segmentIndices.filter(...).flatMap(i => buildTranscribeTasks({...9 fields...}))
// ... later, recompute suffixes again for stitch
segmentVtts = segmentIndices.filter(...).map(i => { suffix = getSegmentSuffix(...) ... })
```

Proposed flow:

```txt
segments = computeSegments(audioDuration, segmentSec, overlapSec, maxSegmentSec)
wavTasks = segments.map(seg => createToWavTask from seg)
transcribeSegs = filter segments by --start/--duration
transcribeTasks = transcribeSegs.map(seg => createTranscribeTask from seg)
// stitch uses same segments array -- no recomputation
```

## Invariant (every phase)

After each phase, before moving on:

- `bun run ci` passes (lint, fmt, check, test)
- `bun run fmt` if needed
- `./scripts/demo/demo.sh` passes (from `apps/whisper`)
- Commit the phase

No tests removed without equivalent replacements.

---

## Design

Two concerns, kept separate:

### Concern 1: Geometry (segmentation.ts)

Given an audio file, how to slice it. Pure math, no naming, no whisper
knowledge.

```ts
interface Segment {
  startSec: number;
  endSec: number;
}

function computeSegments(
  audioDuration: number,
  segmentSec: number, // 0 = single segment
  overlapSec: number,
  maxSegmentSec: number,
): Segment[];
```

The module may also export filtering helpers (still range math):

```ts
// Does segment overlap with the [startSec, endSec) window?
function segmentOverlapsRange(
  seg: Segment,
  startSec: number,
  endSec: number,
): boolean;
```

### Concern 2: Consumer adaptation (runners.ts)

The runner uses the segments to build tasks. It handles:

- Which segments to transcribe (`--start`/`--duration` filtering)
- Naming (suffixes, labels -- derived from segment index and config)
- Whisper args (`--offset-t`, `--duration` for boundary segments)
- Task construction (ffmpeg args, cache paths, monitors)

All existing functions (`computeSegmentCount`, `getStartSegmentIndex`, etc.)
become internal implementation details of `computeSegments`.

---

## Phase 0: Branch

- [x] Continue on `refactor/whisper-simplify` (already here, CI green)

---

## Phase 1: Add `computeSegments` and tests

Add the new function alongside existing ones. No changes to runners.ts.

### In `lib/segmentation.ts`

- [x] Add `Segment` type (`{ startSec, endSec }`)
- [x] Implement
      `computeSegments(audioDuration, segmentSec, overlapSec, maxSegmentSec): Segment[]`
  - Internally uses existing functions (computeSegmentCount, etc.)
  - Each segment gets correct start/end (with overlap for non-last)
- [x] Add `segmentOverlapsRange(seg, startSec, endSec): boolean` helper

### In `lib/segmentation_test.ts`

- [x] Add tests for `computeSegments`:
  - Single segment (no segmentation requested)
  - Multiple segments with exact division
  - Multiple segments with remainder
  - Overlap extends non-last segments
  - Tiny tail absorption (MIN_SEGMENT_REMAINDER_SEC)
- [x] Add tests for `segmentOverlapsRange`

### Phase 1 checkpoint

- [x] `bun run ci` passes (113 pass, 260 expect)
- [x] Commit: `feat(whisper): add computeSegments`

---

## Phase 2: Migrate runners.ts to use `computeSegments`

Replace scattered segment computation with `computeSegments()` call. Naming,
whisper args, and filtering move to runner-local helpers.

### In `lib/runners.ts`

- [x] Replace the segment computation block in `runWhisperPipeline` with
      `computeSegments()`
- [x] Build wav tasks by iterating `segments` directly
- [x] Filter segments for transcription using `segmentOverlapsRange` with the
      `--start`/`--duration` window
- [x] Compute whisper `--offset-t`/`--duration` in the runner (boundary math on
      filtered segments)
- [x] Compute naming (suffix, labels) in the runner from segment index and
      config
- [x] Rewrite stitch block to use same `segments` array
- [x] Remove `SegmentContext`, `computeTranscribeRange`, `buildWavTasks`,
      `buildTranscribeTasks`

### In `lib/runners_test.ts`

- [x] No test changes needed -- all existing assertions pass as-is

### Phase 2 checkpoint

- [x] `bun run ci` passes (113 pass, 260 expect)
- [x] `./scripts/demo/demo.sh` passes (full 66.8x, segmented 64.4x, overlap guard)
- [x] Test count preserved (113 pass, 260 expect)
- [x] runners.ts: 564 -> 439 lines
- [x] Commit: `refactor(whisper): use computeSegments in runners`

---

## Phase 3: Clean up segmentation.ts exports

Functions now only used internally by `computeSegments` can be unexported.

### In `lib/segmentation.ts`

- [ ] Unexport functions that are only used by `computeSegments`:
  - `computeSegmentCount`
  - `getStartSegmentIndex`
  - `getEndSegmentIndex`
  - `getOffsetMsForSegment`
  - `getDurationMsForSegment`
  - `resolveSegmentSec`
  - `getSegmentDurationLabel`
  - `getSegmentSuffix`
- [ ] Keep exporting: `computeSegments`, `Segment`, `segmentOverlapsRange`,
      `MIN_SEGMENT_REMAINDER_SEC`

### In `lib/segmentation_test.ts`

- [ ] Remove or convert old per-function tests (they tested internal
      implementation details). The `computeSegments` tests cover the same
      behavior end-to-end.
- [ ] Keep `MIN_SEGMENT_REMAINDER_SEC` test if present

### Phase 3 checkpoint

- [ ] `bun run ci` passes
- [ ] `./scripts/demo/demo.sh` passes
- [ ] Commit: `refactor(whisper): unexport segmentation internals`

---

## Expected result

| Metric                    | Before                | After                             |
| ------------------------- | --------------------- | --------------------------------- |
| segmentation.ts exports   | 10 functions          | 2 functions + 1 type + 1 constant |
| runners.ts SegmentContext | 9-field interface     | removed                           |
| runners.ts pipeline       | scattered computation | `computeSegments` + iterate       |
| Stitch block              | recomputes suffixes   | reads from segments array         |

The pipeline reads as: compute segments, build tasks, execute, stitch.

---

## Deferred (not in this plan)

- Make stitch a proper Task: add `"stitch"` back to `TaskKind`, create
  `createStitchTask` factory, move `stitchSegments` logic into `execute()`
- Extract `runTask`/monitors to `lib/spawn.ts` (further separation)
- Artifact directory reorganization
- Overlap stitching implementation

## Radical Simplification - New Realization - after all this work

I think it was a fools errand to try to accomodate all this parameter space. I
was overconfident that it could be generalized easiliy!

The problem is too unconstrained, I really should focus on the two known use
cases!

- whole books: <37 or >37h - segemts of 37 ( no book of mine has >(2*37) - so
  max 2 segments
  - overlap stitching seem irrelevant (although interesting) for a single cut
    point

- second use case is very short word/phrase transcription - optimized separately

- Conclusion:
  - Radical simplification
    - I can keep -S/--segment: for testing stitching
    - Remove --overlap altogether
    - keep --duration if complexity is contained (perhaps limit <37h)
    - not sure about --start : opens up question of destination vtt's cue
      offset, and likely not necessay
  - Second use case: short word/phrase transcription
    - separate lib/function/entrypoint/cli command ?
    - return text instad of cues?
    - used for boundary search - like chapter marks?
    - Could keep --start,--duration
      - or --start --duration
      - or --short 00h00m00s+25s : actual interval?
      - --duration<37h, single to-wav -> transcribe - no caching
