# Whisper Segmentation Specification

## Context

Task derived from `CONSOLIDATING-whisper-v2.md`:

- [ ] Segmentation pipeline: Handle input audio by splitting into segments,
      transcribe each, then stitch VTTs with offset adjustment
  - we may look to `whisper-sh/whisper.mjs` for ideas, but this will be a new
    implementation (with overlap of segments)
  - VTT stitching: After segmented transcription, multiple VTT files must be
    combined with offset adjustment. Neither implementation has this; it was
    identified as a critical gap.

## Motivation

### Possible Speedup

Although the primary consideration is the limitation below (\*37h max), because
of the way whisper-cpp currently loads all audio into memory, there may be a
substantial speedup to be had by segmenting the audio and processing each
segment individually.

### Limitations of WAV format to ~37 hours

Because whisper-cpp relies on .wav format, and Classic WAV (RIFF) has 32-bit
size fields for chunks, a single WAV file is effectively limited to 2^32−1 bytes
≈ 4 GiB of audio data (header overhead is tiny).

For the format that whisper-cpp needs, (16 kHz, mono, 16-bit PCM)

- Bytes/sample = 16/8 = 2
- Bytes/second = 16000 samples/s × 1 channel × 2 = 32,000 B/s
- Max duration ≈ (2^32−1) / 32,000 ≈ 134,217.7 s ≈ 37.28 h ≈ 37 h 16 m 58 s

So the ~37 hour ceiling comes directly from ~4 GiB ÷ 32 kB/s.

## POC (speedup test)

```text
[input .m4b] → [Segment audio] → [transcibe segments] (→ [stitch VTTs] → [valiadate output VTT])
```

see [segment_poc.sh](../apps/whisper/segment_poc.sh)

Did not yield any real speedup, nor any real slowdown:

- no segmentation: hobbit.m4b - tiny.en - full - 407s - 92.0x
- segmentation: hobbit.m4b - tiny.en - full - 425s - 88.2x

## Implementation Plan

Phase 1:

- [ ] Add --segment <duration> and --overlap <duration>
  - both flags, if present MUST have a value
  - --segement <duration> maps to config.segmentSecs and must be <=37hours
  - if audio duration is > 37 hours, then segmentation is implied, or --segment
    37hour and / or segmentSecs=37hours will be derived
    - Scenario : Result
    - file <= 37h, no --segment : no segmentation
    - file <= 37h, --segment 1h : segment at 1h
    - file > 37h, no --segment : auto segment at 37h
    - file > 37h, --segment 1h : segment at 1h
  - let's use go duration syntax for values, and file name parts e.g. `1h`,
    `1m`, `30s`; parseDuration(), formatDuration()
- [ ] implement actual segmentation using ffmpeg including overlap as tasks
  - cache segmented `.wav` segments in our cache directory -
    `data/cache/{input}-seg{num}-d{duration}-ov{overlap}.wav` might not be a
    special case.
  - this naming should be unique and behave as our normal caching of `.wav`
    files
  - likely refactoring runner.ts:runWhisperTasks()
    - split task constructors for audio conversion and whisper tasks to support
      segmentation
    - needs refined login around getDuration, getProcessedAudioDuration?
  - first phase, could simple transcribe with no transcription.

Phase 2:

- Implement actual transcription of segments, output is in work directory
  - `{workDir}/{input}-seg{num}-d{duration}-ov{overlap}.vtt`
  - Could also cache the segment vtt's in the cache directory, much as we do for
    the .wav files.
    `data/cache/vtt/{input}-seg{num}-d{duration}-ov{overlap}.vtt` _In fact this
    could be a general behavior for caching, cache invalidation might be more
    involved, if it is to be safe._
  - if we introduce `data/cache/vtt`, we shoudl move `.wav` cache to
    `data/cache/wav`
- Stitcher: `{input}-seg{??}-d{duration}-ov{overlap}.vtt` -> `{input}.vtt`
  - if overlap==0, use concat stitcher, else use smart stitcher
  - **--word-timestamps** should not affect the stitching logic at all, in fact
    it will probably make it easier, and require smaller overlaps.
  - The smart stitcher should examine the overlapping cues, and find a time (cut
    point) where the cues do not overlap, or better yet, find a matching cue,
    even with different timestamps, to use as the cut point.

Extra Hints:

- We want vtt caching to make experimentation with the stitching easier
  - converting audio is comapratively cheap 30s to 10h audiobook, but
    transcription can easily be >30m
- If we need to make caching vtt files **safe** we can include the transcription
  params in the cached fileName, config.modelShortName:string and
  wordTimestamps:boolean should suffice. or a shortSha (a la git) of them.
- CLI flags: `--segment <duration>` and `--overlap <duration>` as separate flags
- Assume no interaction with --start and --duration flags for now
- Even Simple (concat) stitching will still require offsetting the timestamps by
  the segment start time
- Default segment duration is 37 hours (not 1h and not 35h) and must always be
  specified, otherwise, a value of 0 is the default otherwise, and should cause
  an error if the actual fileDuration is over 37 hours, and so for example
  RunConfig.segmentSec: number = 0 is not optional
- It should be possible to have a our current `createAudioConversionTasks()`
  accomodate segment creation as well, if it simpler, we can call the current
  non-segmenting version, a single segment case, and make it general
- We should not be invoking whisper-cli with offset-t, or --duration to handle
  segemntation, ever. That would never have worked for audio>37 hour in any case
  - this reinforces the case (above) that even a simple (concat) stitcher will
    have to translat/offset the vtt's cues by the segment start time
- **--word-timestamps** should not affect the stitching logic at all, in fact it
  will probably make it easier, and require smaller overlaps.
- The smart sticher should be part of the
