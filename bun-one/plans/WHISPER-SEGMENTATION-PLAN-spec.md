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

Although the primary consideration is the limitation below (*37h max), because
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

- [ ] Add --segment duration/overlap e.g. --switch 1h/1m
  - let's use go duration syntax for values, and file name parts e.g. `1h`,
    `1m`, `30s`; durationToSecs(), secsToDuration()
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
