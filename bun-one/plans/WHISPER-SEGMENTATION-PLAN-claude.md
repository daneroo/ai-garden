# Whisper Segmentation Implementation Plan

Based on `WHISPER-SEGMENTATION-PLAN-spec.md` and clarifications.

## Overview

Implement audio segmentation to handle long files (especially those exceeding
the ~37h WAV limit) by splitting into segments, transcribing each, then
stitching VTTs with timestamp offset adjustment.

## Design Decisions

- **CLI flags**: `--segment <duration>` and `--overlap <duration>`
  - Both flags, if present, MUST have a value (yargs enforces)
  - `--segment` value must be <= 37 hours
- **Behavior**:
  - file <= 37h, no `--segment` → no segmentation
  - file <= 37h, `--segment Xh` → segment at Xh
  - file > 37h, no `--segment` → auto segment at 37h (implied)
  - file > 37h, `--segment Xh` → segment at Xh
- **No `--offset-t` for whisper-cli**: Each segment transcribed from time 0;
  stitcher offsets VTT cues by segment start time
- **VTT caching**: Mandatory (transcription expensive, audio conversion cheap)
- **Generalize audio conversion**: Treat non-segmented as single segment case
- **Smart stitching**: Deferred; concat stitcher first
- **No interaction with --start/--duration**: Not used with segmentation
- **--word-timestamps**: Does not affect stitching logic

## Overlap Model (suffix-overlap)

Let S = segmentSec, O = overlapSec, i = segment index (0..N-1):

- Segment `i` starts at: `start = i * S`
- Segment `i` duration: `dur = min(S + (i < N-1 ? O : 0), totalDuration - start)`
- Overlap extends the END of each segment (except last)
- Overlap region between segment i and i+1: `[(i+1)*S, (i+1)*S + O]`

VTT timestamp rewrite: shift all cues by `i * S` (the segment start).

## Implementation Phases

### Phase 1: Duration Utilities

**File:** `lib/duration.ts` (new)

- `parseDuration(s)` - "1h" → 3600, "30m" → 1800, "1h30m" → 5400
- `formatDuration(secs)` - 3600 → "1h"

**Tests:** `test/duration_test.ts`

### Phase 2: CLI Arguments

**File:** `whisper.ts`

- Add `--segment <duration>` (alias `-S`), requires value, must be <= 37h
- Add `--overlap <duration>`, requires value, default "0"

**File:** `lib/runners.ts`

- Add `segmentSec: number` to RunConfig (default 0)
- Add `overlapSec: number` to RunConfig (default 0)

### Phase 3: Segmentation Logic

**File:** `lib/runners.ts`

- If audioDuration > 37h and segmentSec == 0, derive segmentSec = 37h
- Calculate segments using suffix-overlap model
- Segment naming: `{basename}-seg{NN}-d{dur}-ov{ov}.wav`
- Generalize `createAudioConversionTasks()` to handle segments

### Phase 4: VTT Caching

**File:** `lib/cache.ts`

- Cache layout:
  - `data/cache/wav/{basename}-seg{NN}-d{dur}-ov{ov}.wav`
  - `data/cache/vtt/{basename}-seg{NN}-d{dur}-ov{ov}-m{model}-wt{0|1}.vtt`
- VTT caching is mandatory and always used

### Phase 5: VTT Stitching

**File:** `lib/vtt-stitch.ts` (new)

VTT utilities:
- `secondsToVttTime(sec)` → "HH:MM:SS.mmm"
- `shiftVttCues(cues, offsetSec)` → shifted cues
- `writeVtt(path, cues)`

Concat stitcher (overlap == 0):
- Read each segment VTT
- Shift cues by `i * S`
- Concatenate in order, write final VTT

Smart stitcher (overlap > 0) - deferred:
- Overlap window: `[(i+1)*S, (i+1)*S + O]`
- Find matching anchor cues via text, or earliest non-overlap cut
- Fallback to boundary

### Phase 6: Integration

**File:** `lib/runners.ts`

- Modify `runWhisper()` to check audioDuration, derive segmentSec if needed
- Calculate segments, run audio/transcription tasks, stitch VTTs

## File Changes Summary

| File                               | Change                                    |
| ---------------------------------- | ----------------------------------------- |
| `lib/duration.ts`                  | New - duration parsing                    |
| `lib/vtt-stitch.ts`                | New - VTT stitching with timestamp offset |
| `lib/cache.ts`                     | Add VTT caching, reorganize cache dirs    |
| `whisper.ts`                       | Add --segment, --overlap                  |
| `lib/runners.ts`                   | Segmentation logic, generalize tasks      |
| `test/duration_test.ts`            | New - unit tests                          |
| `test/vtt-stitch_test.ts`          | New - unit tests                          |
| `test/integration_segment_test.ts` | New - e2e test                            |

## Testing Strategy

- Unit tests for duration parsing, segment calculation, VTT stitching
- Integration test with short segments on small file (e.g., segment=10s)
- Verify auto-segmentation triggers for files > 37h (mock duration)

## Verification

```bash
# Run unit tests
bun test test/duration_test.ts
bun test test/vtt-stitch_test.ts

# Run integration test
bun test test/integration_segment_test.ts

# Manual test with segmentation
bun run whisper.ts -i data/samples/hobbit.m4b --segment 1h -m tiny.en

# Full CI
bun run ci
```

## Open Questions / Future Work

- Smart stitching for overlap > 0
- Parallel segment transcription
