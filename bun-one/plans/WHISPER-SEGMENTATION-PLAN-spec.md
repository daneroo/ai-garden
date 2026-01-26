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

## POC for speedup

```text
[input .m4b] → [Segment audio] → [transcibe segments] → [stitch VTTs] → [valiadate output VTT]
```
