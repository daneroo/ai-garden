# Whisper Segmentation Plan (OpenCode)

Implements the segmentation pipeline described in `bun-one/plans/WHISPER-SEGMENTATION-PLAN-spec.md` inside `bun-one/apps/whisper/`.

Hard requirements (spec + decisions):

- Must handle long inputs by splitting into segments, transcribing each, stitching VTT with offset adjustment.
- Must support overlap immediately (controlled by `--overlap`; default overlap is 0).
- Must NOT use `whisper-cli --offset-t` or `--duration` to implement segmentation.
- Even simple concat stitching requires rewriting VTT cue timestamps by adding the segment’s absolute start time.
- VTT caching is mandatory and always used (like WAV caching).
- `--word-timestamps` must not affect stitching logic.

## Constants / Defaults

- `MAX_RIFF_WAV_SEC = 37h` (safety margin; used to decide if segmentation is required)
- `AUTO_OVERLAP_SEC = 0` (for now)

## Context (from spec)

- WAV RIFF ceiling: Classic WAV has 32-bit chunk size fields (~4GiB). For 16kHz mono 16-bit PCM: ~37h16m58s max; we use a 37h safety margin.
- POC (`bun-one/apps/whisper/segment_poc.sh`) showed no speedup on Hobbit; speed/system-load improvements may still exist.
- Stitching was identified as a critical gap; neither legacy implementation had robust VTT stitching.

## CLI

Update `bun-one/apps/whisper/whisper.ts`:

- `--segment <duration>`: Go duration syntax (`1h`, `1m`, `30s`, `1h30m`)
- `--overlap <duration>`: Go duration syntax; default `0s`

Rules:

- Both flags, if present, MUST have a value (yargs).
- Assume no interaction with `--start` and `--duration` for now (spec). We should reject segmentation combined with `--start/--duration` initially (recommended), or document it as undefined until tested.

Behavior table:

- file `<= MAX_RIFF_WAV_SEC`, no `--segment` → no segmentation
- file `<= MAX_RIFF_WAV_SEC`, `--segment 1h` → segment at 1h
- file `> MAX_RIFF_WAV_SEC`, no `--segment` → auto segment at `MAX_RIFF_WAV_SEC`
- file `> MAX_RIFF_WAV_SEC`, `--segment 1h` → segment at 1h

Overlap:

- Default overlap is 0 unless `--overlap` is provided.
- If `--overlap` is provided without segmentation (no `--segment` AND file <= limit), treat as an error (recommended) to avoid silent confusion.

## Duration Helpers (better names)

Create `bun-one/apps/whisper/lib/duration.ts`:

- `parseDuration(s: string): number` -> seconds
- `formatDuration(secs: number): string` -> compact Go-style string (used in filenames)

Tests:

- `bun-one/apps/whisper/test/duration_test.ts`

## Policy: Explicit vs Automatic Segmentation

We implement:

- Explicit segmentation when `--segment` is provided.
- Automatic segmentation when required by RIFF ceiling (even if `--segment` is absent).

Auto behavior:

- When auto segmentation is implied (file > `MAX_RIFF_WAV_SEC`):
  - `S = MAX_RIFF_WAV_SEC` (37h)
  - `O = AUTO_OVERLAP_SEC` (0), unless `--overlap` is provided

Tuning note:

- For testing stitching with more segments, pass `--segment 1h` (and optionally `--overlap`).

## RunConfig Changes

Add to `RunConfig` in `bun-one/apps/whisper/lib/runners.ts`:

- `segmentSec: number` (default 0; present even when segmentation is off)
- `overlapSec: number` (default 0)

Validation:

- If `segmentSec > 0`, require `segmentSec <= MAX_RIFF_WAV_SEC`.
- If segmentation is enabled (explicit or auto-implied), require `0 <= O < S`.

Runner computes:

- `segmentationMode: "off" | "explicit" | "auto"`
- `S` (segment length), `O` (overlap)

## Segmentation Model (overlap supported)

Definitions:

- `S`: segment length (seconds)
- `O`: overlap length (seconds)
- `i`: segment index `0..N-1`

Segment boundaries (overlap extends the end, not the start):

- segment `i` starts at `start = i * S`
- segment `i` duration is `dur = min(S + (i < N-1 ? O : 0), remaining audio from start)`

What we do:

- create the segment WAV with `ffmpeg -ss start -t dur ...`
- transcribe the segment WAV with `whisper-cli` (timestamps start near 0 for each segment)
- convert segment-local timestamps to original-audio timestamps by adding `start` to every cue start/end

Where overlap lives (and where stitching matters):

- overlap between segment `i` and `i+1` is `[ (i+1)*S, (i+1)*S + O ]` and appears in both transcripts; the stitcher picks a cut inside this window

## Cache Layout (follow spec)

Introduce:

- `bun-one/apps/whisper/data/cache/wav/`
- `bun-one/apps/whisper/data/cache/vtt/`

## WAV Segment Caching

Cache key (spec-aligned base + recommended safety):

- baseline: `data/cache/wav/{inputBase}-seg{NNN}-d{dPart}-ov{ovPart}.wav`

Note:

- With suffix-overlap, segment start is always `i*S`, so `{segNNN,d,ov}` is sufficient as a cache key.

Tasks:

- Cache hit: `cp -n <cacheSeg.wav> <workSeg.wav>`
- Cache miss: `ffmpeg -ss/-t ... -> <workSeg.wav>`, then `cp -n <workSeg.wav> <cacheSeg.wav>`

## Mandatory VTT Caching (always on)

Rationale (spec): audio conversion cheap; transcription expensive; caching VTT accelerates stitch iteration.

Cache key must include transcription params:

- `modelShortName`
- `wordTimestamps`

Filename:

- `data/cache/vtt/{inputBase}-seg{NNN}-d{dPart}-ov{ovPart}-m{model}-wt{0|1}.vtt`

Behavior per segment:

- If cached VTT exists:
  - task: `cp -n <cacheSeg.vtt> <workSeg.vtt>`
  - skip whisper-cli for that segment
- Else:
  - run whisper-cli to generate `<workSeg.vtt>`
  - task: `cp -n <workSeg.vtt> <cacheSeg.vtt>`

## Transcription Tasks (per segment)

For each segment WAV without cached VTT:

- run `whisper-cli` normally
- DO NOT use `--offset-t` / `--duration` for segmentation
- write outputs in work dir with segment-specific prefix:
  - `{workDir}/{inputBase}-seg{NNN}-d{dPart}-ov{ovPart}.*`

## VTT Rewrite + Stitch Utilities

Add `bun-one/apps/whisper/lib/vtt-stitch.ts` (new) or extend `bun-one/apps/whisper/lib/vtt.ts`:

- `secondsToVttTime(sec: number): string`
- `shiftVttCues(cues: VttCue[], offsetSec: number): VttCue[]`
- `writeVtt(path: string, cues: VttCue[]): Promise<void>`

Rewrite per segment:

- `absoluteCues = shiftVttCues(segmentCues, start)` where `start = i*S`

## Stitching

### Concat (overlap == 0)

- Shift each segment by `start = i*S`
- Concatenate cues in segment order
- Write `{outputDir}/{finalName}.vtt`
- Do not enforce monotonicity initially (log summary only)

### Smart Stitch v1 (overlap > 0, automatic)

Enabled automatically when `O > 0`.

Definitions for boundary between segment i-1 (A) and i (B):

- `A`: accumulated absolute cues
- `B`: segment i absolute cues
- `tBoundary = i * S`
- overlap window `W = [tBoundary, tBoundary + O]`
- `EPS = 0.02s`

Algorithm:

1. Try anchor match in W

- normalize cue text (trim, collapse whitespace)
- if an A cue and B cue match on normalized text (timestamps may differ; allow EPS), select earliest stable match and set `tCut` at that boundary (initially: `tCut = min(startA, startB)` or `tCut = startB`; refine via tests)

2. Else find earliest no-overlap cut in W

- iterate B cues by increasing `start` within W
- pick first `b.start` where last A cue end `<= b.start`

3. Fallback

- `tCut = tBoundary`

Stitch rule:

- keep from A: cues with `end <= tCut`
- keep from B: cues with `start >= tCut`

## Runner Refactor

Refactor `runWhisperTasks()` in `bun-one/apps/whisper/lib/runners.ts` into builders:

- audio plan builder (single conversion vs segmented wav generation)
- transcription builder (per segment; cached VTT skip)
- postprocess (read/shift/stitch/write final VTT)

Preflight:

- update `getRequiredCommands()` to include `ffprobe` (used by `getAudioFileDuration()`).

## Tests

Add/extend in `bun-one/apps/whisper/test/`:

- `duration_test.ts` (unit)
- `vtt_stitch_test.ts` (unit; synthetic cues for anchor/no-overlap/fallback)
- `integration_segmentation_concat_test.ts` (segment=10s overlap=0)
- `integration_segmentation_smart_stitch_test.ts` (segment=10s overlap=2s)

Assertions (initially loose):

- final VTT exists
- cueCount > 0
- duration within slack of baseline
- smart stitch does not wildly inflate cue count vs concat
- do NOT fail on monotonicity yet

## File Changes Summary

- `bun-one/apps/whisper/whisper.ts` (CLI flags)
- `bun-one/apps/whisper/lib/runners.ts` (segmentation, caching, stitching wiring)
- `bun-one/apps/whisper/lib/cache.ts` (cache dirs: wav + vtt, cache key helpers)
- `bun-one/apps/whisper/lib/duration.ts` (new)
- `bun-one/apps/whisper/lib/vtt-stitch.ts` (new, or extend `bun-one/apps/whisper/lib/vtt.ts`)
- `bun-one/apps/whisper/test/duration_test.ts` (new)
- `bun-one/apps/whisper/test/vtt_stitch_test.ts` (new)
- `bun-one/apps/whisper/test/integration_segmentation_concat_test.ts` (new)
- `bun-one/apps/whisper/test/integration_segmentation_smart_stitch_test.ts` (new)

## Verification Commands

- `bun test bun-one/apps/whisper/test/duration_test.ts`
- `bun test bun-one/apps/whisper/test/vtt_stitch_test.ts`
- `bun test bun-one/apps/whisper/test/integration_segmentation_concat_test.ts`
- `bun test bun-one/apps/whisper/test/integration_segmentation_smart_stitch_test.ts`
- `bun test bun-one/apps/whisper/test`
