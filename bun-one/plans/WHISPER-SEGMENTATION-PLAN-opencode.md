# Whisper Segmentation Plan (OpenCode)

Implements the segmentation pipeline described in `bun-one/plans/WHISPER-SEGMENTATION-PLAN-spec.md` inside `bun-one/apps/whisper/`.

Hard requirements (spec + decisions):

- Must handle long inputs by splitting into segments, transcribing each, stitching VTT with offset adjustment.
- Must support overlap immediately.
- Must NOT use `whisper-cli --offset-t` or `--duration` to implement segmentation.
- Even simple concat stitching requires rewriting VTT cue timestamps by adding the segment’s absolute start time.
- VTT caching is mandatory and always used (like WAV caching).
- `--word-timestamps` must not affect stitching logic.

## Context (from spec)

- WAV RIFF ceiling: Classic WAV has 32-bit chunk size fields (~4GiB). For 16kHz mono 16-bit PCM: ~37h16m58s max.
- POC (`bun-one/apps/whisper/segment_poc.sh`) showed no speedup on Hobbit; speed/system-load improvements may still exist.
- Stitching was identified as a critical gap; neither legacy implementation had robust VTT stitching.

## CLI

Update `bun-one/apps/whisper/whisper.ts`:

- `--segment <duration>`: Go duration syntax (`1h`, `1m`, `30s`, `1h30m`)
- `--overlap <duration>`: Go duration syntax; default `0s`

Notes:

- Flags are separate (spec).
- “Assume no interaction with --start and --duration for now” (spec). We will not design for combined semantics in the first implementation; we can either reject or document as undefined until tested.

## Policy: Explicit vs Automatic Segmentation

We implement:

- Explicit segmentation when `--segment` is provided.
- Automatic segmentation when required by RIFF ceiling (even if `--segment` is absent).

Auto defaults (for now, for testing and to generate stitching data):

- `AUTO_SEGMENT = 1h`
- `AUTO_OVERLAP = 1m`

Spec note to preserve as future tuning:

- Spec suggests “default segment duration is 37 hours” behavior. We will keep this as a future alternative default once stitching/performance is understood.

## Duration Helpers (spec naming)

Add helpers (new module, used by CLI + naming):

- `durationToSecs(goDur: string): number`
- `secsToDuration(secs: number): string` (file name parts like `1h`, `1m`, `30s`)

Validation:

- `segmentSec > 0`
- `0 <= overlapSec < segmentSec`

## RunConfig Changes (spec: segmentSec is not optional)

Add to `RunConfig` in `bun-one/apps/whisper/lib/runners.ts`:

- `segmentSec: number` (default 0; present on RunConfig even if segmentation off)
- `overlapSec: number` (default 0)

Runner computes effective settings:

- `segmentationMode: "off" | "explicit" | "auto"`
- `effectiveSegmentSec`, `effectiveOverlapSec`

## Segmentation Model (overlap supported)

Let:

- `S = segmentSec`
- `O = overlapSec`
- `i = 0..N-1`
- `nominalStart(i) = i*S`

Prefix-overlap (segment i>0 includes `O` seconds of audio preceding nominalStart):

- `extractStart(i) = max(0, nominalStart(i) - (i>0 ? O : 0))`
- `extractDur(i) = min(S + (i>0 ? O : 0), remaining duration from extractStart(i))`

Important correction (core to offsetting):

- Segment VTT timestamps are relative to the audio fed into whisper-cli, i.e. relative to `extractStart(i)`.
- Therefore, timestamp rewriting MUST shift cues by `extractStart(i)` (not by `nominalStart(i)`).
- Stitching then chooses cut points near `nominalStart(i)`.

## Cache Layout (follow spec)

Introduce:

- `bun-one/apps/whisper/data/cache/wav/`
- `bun-one/apps/whisper/data/cache/vtt/`

This replaces the current flat `data/cache/*.wav` strategy for segmentation runs (and we can later migrate the existing non-segment cache to `wav/` too).

## WAV Segment Caching (Phase 1)

Cache key (spec-aligned base, with one recommended safety addition):

- baseline: `data/cache/wav/{inputBase}-seg{NNN}-d{dPart}-ov{ovPart}.wav`
- recommended: include extractStart (or nominalStart) to avoid ambiguity across overlap strategies:
  - `...-s{startPart}.wav` where `startPart = secsToDuration(extractStart(i))`

Tasks:

- Cache hit: `cp -n <cacheSeg.wav> <workSeg.wav>`
- Cache miss: `ffmpeg -ss/-t ... -> <workSeg.wav>`, then `cp -n <workSeg.wav> <cacheSeg.wav>`

## Mandatory VTT Caching (always on, spec hint)

Goal: make stitch experimentation fast (transcription expensive, audio conversion cheap).

Cache key must incorporate transcription params (spec hint):

- required params:
  - `config.modelShortName`
  - `config.wordTimestamps` (boolean)
- Use either explicit parts or a short hash of params; simplest is explicit.

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
- write segment outputs in work dir with segment-specific prefix:
  - `{workDir}/{inputBase}-seg{NNN}-d{dPart}-ov{ovPart}.*`

## VTT Timestamp Rewrite Utilities (required even for concat)

Add in `bun-one/apps/whisper/lib/vtt.ts` or new `bun-one/apps/whisper/lib/vtt-stitch.ts`:

- `secondsToVttTime(sec: number): string` -> `HH:MM:SS.mmm`
- `shiftVttCues(cues: VttCue[], offsetSec: number): VttCue[]`
- `writeVtt(path: string, cues: VttCue[]): Promise<void>`

Rewrite rule per segment:

- `absoluteCues = shiftVttCues(segmentCues, extractStart(i))`

## Stitching

### Concat Stitcher (overlap == 0)

- Read each segment VTT (from work dir, possibly copied from cache)
- Shift cues by `extractStart(i)` (equals `nominalStart(i)` when O=0)
- Concatenate in segment order
- Write `{outputDir}/{finalName}.vtt`
- Do not enforce monotonicity initially (we can report `summarizeVtt()` stats only)

### Smart Stitcher v1 (overlap > 0, automatic)

Enabled automatically when `overlapSec > 0`.

Spec intent:

- examine overlapping cues
- find a cut point where cues do not overlap, or find matching cues (even if timestamps differ)

Definitions for boundary between segment i-1 (A) and segment i (B):

- `A`: accumulated cues so far (absolute-time)
- `B`: segment i absolute-time cues (shifted by extractStart(i))
- nominal boundary time `tNominal = nominalStart(i)`
- overlap window `W = [tNominal - O, tNominal]`

Heuristic v1:

- Prefer a cut time `tCut` inside W such that there is no time-overlap across the cut, OR a matching cue anchor exists.
- Use text matching as an “anchor” signal (timestamps may differ slightly).

Parameters:

- `EPS = 0.02s` (time tolerance for “near equal” comparisons)

Algorithm:

1) Candidate anchors (matching cues) in W

- Normalize cue text (trim, collapse whitespace).
- If an A cue and a B cue have matching normalized text within W (allow small timestamp tolerance), choose the earliest stable match and set `tCut` at that cue boundary (exact rule to start: `tCut = min(startA, startB)` or `tCut = startB`; refine with tests).

2) If no anchor match, find earliest non-overlap cut in W

- Iterate B cues by increasing start time within W.
- Choose the first `b.start` where the last A cue end time `<= b.start`.

3) Fallback

- `tCut = tNominal`

Stitch rule at `tCut`:

- keep from A: cues with `end <= tCut`
- keep from B: cues with `start >= tCut`

Notes:

- This does not depend on `--word-timestamps`; it should behave the same regardless.
- This is deliberately heuristic; we will refine using cached VTT artifacts + tests.

## Runner Refactor (spec hint: generalize audio task creation)

Refactor `runWhisperTasks()` in `bun-one/apps/whisper/lib/runners.ts` into logical builders:

- audio tasks builder (single conversion or segmented wav generation)
- transcription tasks builder (per segment; cached VTT skip)
- postprocess (read/shift/stitch/write final VTT)

Spec hint to consider:

- Generalize the current `createAudioConversionTasks()` to handle segment creation too:
  - treat “non-segment” mode as a single segment case
  - keep consistent caching semantics

Preflight:

- `getRequiredCommands()` must include `ffprobe` (currently used by `getAudioFileDuration()`).

## Tests (to drive stitching refinement)

Integration tests (real whisper-cli runs, fixture audio):

1) segmentation + concat (overlap 0)

- `segment=10s`, `overlap=0s`
- asserts: final VTT exists; cueCount>0; duration in expected range

2) segmentation + smart stitch (overlap > 0)

- `segment=10s`, `overlap=2s`
- asserts: final VTT exists; duration in expected range; cue count not wildly inflated vs overlap=0
- monotonicity not enforced initially

Unit tests (synthetic cues):

- matching anchor cue in overlap -> cut chosen at/near match
- no-overlap cut exists -> earliest cut chosen
- no safe cut -> fallback to nominal boundary

## Phases (spec mapping)

Phase 1:

- CLI flags + Go duration helpers (durationToSecs/secsToDuration)
- ffmpeg segmentation tasks with overlap as tasks
- introduce `data/cache/wav` and `data/cache/vtt`
- mandatory VTT caching (always used)
- VTT timestamp rewriting (offset by extractStart)
- concat stitcher (overlap==0)

Phase 2:

- smart stitcher (overlap>0), auto-enabled
- expand tests and iterate heuristics using cached VTT data
- confirm `--word-timestamps` does not affect stitching logic

Phase 3:

- tune defaults (maybe 37h, maybe always segment) based on perf + robustness
- revisit `--start`/`--duration` interactions with segmentation once tested
