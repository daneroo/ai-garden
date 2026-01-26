# Whisper Segmentation Implementation Plan

Based on `WHISPER-SEGMENTATION-PLAN-spec.md` and clarifications.

## Overview

Implement audio segmentation to handle long files (especially those exceeding
the ~37h WAV limit) by splitting into segments, transcribing each, then
stitching VTTs with timestamp offset adjustment.

## Design Decisions

- **CLI flags**: `--segment <duration>` and `--overlap <duration>` (yargs
  requires value when flag is used)
- **segmentSec**: NOT optional, default = 0 (no `--segment` flag provided)
- **Behavior**:
  - segmentSec = 0 AND file <= 37h → no segmentation
  - segmentSec = 0 AND file > 37h → **ERROR**
  - segmentSec > 0 → segment the file
- **No `--offset-t` for whisper-cli**: Each segment transcribed from time 0;
  stitcher offsets VTT cues by segment start time
- **VTT caching**: Implement now (transcription ~30m vs audio conversion ~30s).
  Cache key includes `modelShortName` and `wordTimestamps`
- **Generalize audio conversion**: Treat non-segmented as single segment case
- **Smart stitching**: Deferred; concat stitcher first (still offsets
  timestamps)
- **No interaction with --start/--duration**: Not used with segmentation
- **--word-timestamps**: Does not affect stitching logic

## Implementation Phases

### Phase 1: Duration Parsing Utilities

**File:** `lib/duration.ts` (new)

- `parseDuration(s)` - "1h" → 3600, "30m" → 1800, "1h30m" → 5400
- `formatDuration(secs)` - 3600 → "1h"

**Tests:** `test/duration_test.ts`

### Phase 2: CLI Arguments

**File:** `whisper.ts`

- Add `--segment <duration>` (alias `-S`), default not provided = 0
- Add `--overlap <duration>`, default "0"

**File:** `lib/runners.ts`

- Add `segmentSec: number` to RunConfig (default 0)
- Add `overlapSec: number` to RunConfig (default 0)

### Phase 3: Segmentation Logic

**File:** `lib/runners.ts`

- Validate: error if segmentSec == 0 AND audioDuration > 37h
- Calculate segments with overlap
- Segment naming: `{basename}-seg{NN}-d{duration}-ov{overlap}.wav`
- Generalize `createAudioConversionTasks()` to handle segments

### Phase 4: VTT Caching

**File:** `lib/cache.ts`

- Add VTT cache directory: `data/cache/vtt/`
- Cache key includes: basename, segment info, modelShortName, wordTimestamps
- Move WAV cache to `data/cache/wav/`

### Phase 5: VTT Stitching

**File:** `lib/vtt-stitch.ts` (new)

- Concat stitcher: offset each cue by segment startSec, combine in order
- Smart stitcher: deferred (TODO for overlap > 0)

### Phase 6: Integration

**File:** `lib/runners.ts`

- Modify `runWhisper()` to validate, calculate segments, and stitch

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
- Integration test with short segments on small file
- Verify error when file > 37h without --segment

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
