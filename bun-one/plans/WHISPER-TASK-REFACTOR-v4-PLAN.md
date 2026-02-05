# Whisper Task Refactor Plan - V4: Radical Simplification

- We are in the `<repo>/bun-one/` directory (bun workspaces)
- We are concerned with the `<repo>/bun-one/apps/whisper/` cli app

Follows [WHISPER-TASK-REFACTOR-v3-PLAN.md](./WHISPER-TASK-REFACTOR-v3-PLAN.md)

## Goal

Strip the whisper CLI to its actual use cases. Remove `--start` and
`--overlap`. Keep `--duration` (simple: just a whisper-cli arg). The
segmentation math is so simple it may not need its own module.

## The two cases

Given `segmentSec` (default = 37h = MAX_WAV_DURATION_SEC):

- `audioDuration <= segmentSec`: 1 to-wav, 1 transcribe. No stitch.
- `audioDuration > segmentSec`: N to-wav, N transcribe, 1 stitch.

That's it. The single-segment case is just N=1 (stitch skipped).

`--duration` (optional): passed directly to whisper-cli as `--duration`.
Does not interact with segmentation. If `durationSec > 0`, the pipeline
still WAVs all segments but whisper only transcribes up to that duration
within each segment's local time. In practice, `--duration` implies a
short run on segment 0 only (user won't ask for 40h duration on a 50h
book).

## What dies

- `--start` (and `startSec` from RunConfig)
- `--overlap` (and `overlapSec` from RunConfig)
- All segment filtering logic (`segmentOverlapsRange`, `transcribeSegs`)
- All offset computation (`getOffsetMsForSegment`, `getStartSegmentIndex`)
- Duration-per-segment computation (`getDurationMsForSegment`,
  `getEndSegmentIndex`)
- The `-ov{X}` portion of segment suffix
- The overlap guard in `runWhisper`
- `getProcessedAudioDuration` (just use `audioDuration`)

## What remains in segmentation

```ts
interface Segment {
  startSec: number;
  endSec: number;
}

function computeSegments(
  audioDuration: number,
  segmentSec: number, // 0 = use maxSegmentSec
  maxSegmentSec: number,
): Segment[];
```

Plus `resolveSegmentSec`, `computeSegmentCount`, tiny-tail absorption,
suffix/label helpers. Maybe ~50 lines. Could inline into runners.ts or
keep as a small module.

## Invariant (every phase)

After each phase, before moving on:

- `bun run ci` passes (lint, fmt, check, test)
- `bun run fmt` if needed
- `./scripts/demo/demo.sh` passes (from `apps/whisper`)
- Commit the phase

---

## Phase 0: Branch

- [ ] Continue on `refactor/whisper-simplify`

---

## Phase 1: Remove --overlap and --start

Remove both in one pass. They are the source of all filtering/offset
complexity.

### Changes

- `whisper.ts`: remove `--overlap` and `--start` options
- `RunConfig`: remove `overlapSec`, `startSec`
- `computeSegments`: remove `overlapSec` param
- `getSegmentSuffix`: remove `overlapSec` param, drop `-ov{X}` from format
- `segmentation.ts`: delete `segmentOverlapsRange`,
  `getOffsetMsForSegment`, `getDurationMsForSegment`,
  `getStartSegmentIndex`, `getEndSegmentIndex`. Simplify
  `getSegmentEndSec` (no overlap).
- `runners.ts`:
  - Remove overlap guard
  - Remove transcribe filtering (transcribe all segments)
  - Remove offset/duration-ms computation (always 0)
  - Remove `getProcessedAudioDuration` (just use `audioDuration`)
  - Simplify stitch provenance (no startSec/durationSec)
- `task.ts`: remove `offsetMs`/`durationMs` from `TranscribeTaskOptions`,
  remove conditional arg construction
- `cache.ts`: remove `offsetMs`/`durationMs` params from
  `getVttCachePath`
- `runners_test.ts`: remove all --start/--duration/--overlap filter
  tests, remove overlap guard tests, update mockConfig
- `segmentation_test.ts`: remove overlap and offset/duration tests
- `demo.sh`: remove overlap guard scenario

### Phase 1 checkpoint

- [x] `bun run ci` passes (70 tests, 181 expect)
- [x] `./scripts/demo/demo.sh` passes
- [ ] Commit

### Phase 1 actual line counts

| File | Before (v3) | After | Plan est |
| -------------------- | ----------- | ----- | -------- |
| segmentation.ts | 229 | 107 | ~50 |
| runners.ts | 439 | 373 | ~300 |
| task.ts | 525 | 521 | ~510 |
| cache.ts | 39 | 37 | ~30 |
| whisper.ts | 212 | 196 | ~180 |
| runners_test.ts | 360 | 85 | ~120 |
| segmentation_test.ts | 162 | 64 | ~40 |

Also deleted: `integration_offsets_test.ts` (184 lines), removed overlap guard from `demo.sh`, updated `cache_test.ts`, `integration_smoke_test.ts`, `run-bench.ts`.

---

## Phase 2: Simplify --duration and collapse

`--duration` becomes a simple whisper-cli passthrough. Collapse
segmentation into runners or keep as tiny module.

### Changes

- `RunConfig`: keep `durationSec` but only used as whisper-cli
  `--duration` arg (in ms)
- `task.ts`: add back a simple `durationMs` to TranscribeTaskOptions
  (just the raw whisper arg, no per-segment math)
- `runners.ts`: pass `config.durationSec * 1000` as durationMs to
  first transcribe task only (or all, whisper ignores it past EOF)
- `cache.ts`: include durationMs in VTT cache key (affects output)
- Evaluate: inline segmentation.ts into runners.ts? Or keep as ~50
  line module?
- Clean up dead code, unused imports

### Phase 2 checkpoint

- [ ] `bun run ci` passes
- [ ] `./scripts/demo/demo.sh` passes
- [ ] Commit

---

## Expected result

| File                 | Before (v3) | After (v4 est) |
| -------------------- | ----------- | -------------- |
| segmentation.ts      | 229         | ~50 (or 0)     |
| runners.ts           | 439         | ~300           |
| task.ts              | 525         | ~510           |
| cache.ts             | 39          | ~30            |
| whisper.ts           | 212         | ~180           |
| runners_test.ts      | 360         | ~120           |
| segmentation_test.ts | 162         | ~40 (or 0)     |

---

## Deferred (not in this plan)

- Consider re-adding `--start` (doubtful)
- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to `lib/spawn.ts`
- Artifact directory reorganization
- Second use case: short word/phrase transcription (separate entrypoint)
