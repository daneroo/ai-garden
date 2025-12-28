# Benchmark Results

- **Date**: 2025-12-28T18:54:57Z
- **Model**: tiny.en

## 1. Baseline

Full-length transcription of hobbit.mp3 (10h24m).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         299 |  125.4x |
| WhisperCPP |         435 |   86.2x |

## 2. Native M4B

M4B format support. WhisperKit handles natively, WhisperCPP auto-converts to
WAV.

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         276 |  135.8x |
| WhisperCPP |         425 |   88.3x |

## 3. Max WAV Length Exceeded (49h44m)

Files exceeding 37h WAV limit. WhisperCPP fails on these.

| Runner     | Elapsed (s) |                 Speedup |
| ---------- | ----------: | ----------------------: |
| WhisperKit |        1182 |                  151.5x |
| WhisperCPP |         N/A | N/A (exceeds WAV limit) |

## 4. Offset and Duration Cost

Comparing --duration extraction vs native short file.

| Test                       | Runner     | Elapsed (s) | Speedup |
| -------------------------- | ---------- | ----------: | ------: |
| hobbit.mp3 --duration 3600 | WhisperKit |          71 |   50.6x |
| hobbit.mp3 --duration 3600 | WhisperCPP |          80 |   45.0x |
| hobbit.mp3 offset 9h, 1h   | WhisperKit |          70 |   51.5x |
| hobbit.mp3 offset 9h, 1h   | WhisperCPP |          78 |   46.3x |
| hobbit-1h.mp3 (native)     | WhisperKit |          31 |  116.5x |
| hobbit-1h.mp3 (native)     | WhisperCPP |          43 |   84.4x |
