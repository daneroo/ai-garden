# Benchmark Results

- **Date**: 2025-12-21T19:16:48Z
- **Model**: tiny.en

## 1. Baseline

Full-length transcription of hobbit.mp3 (10h24m).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         299 |  125.4x |
| WhisperCPP |         439 |   85.4x |

## 2. Native M4B

M4B format support. WhisperKit handles natively, WhisperCPP auto-converts to
WAV.

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         269 |  139.3x |
| WhisperCPP |         404 |   92.8x |

## 3. Max WAV Length Exceeded (49h44m)

Files exceeding 37h WAV limit. WhisperCPP fails on these.

| Runner     | Elapsed (s) |                 Speedup |
| ---------- | ----------: | ----------------------: |
| WhisperKit |        1168 |                  153.3x |
| WhisperCPP |         N/A | N/A (exceeds WAV limit) |

## 4. Offset and Duration Cost

Comparing --duration extraction vs native short file.

| Test                       | Runner     | Elapsed (s) | Speedup |
| -------------------------- | ---------- | ----------: | ------: |
| hobbit.mp3 --duration 3600 | WhisperKit |          70 |   51.4x |
| hobbit.mp3 --duration 3600 | WhisperCPP |          80 |   45.0x |
| hobbit.mp3 offset 9h, 1h   | WhisperKit |          69 |   52.2x |
| hobbit.mp3 offset 9h, 1h   | WhisperCPP |          77 |   46.8x |
| hobbit-1h.mp3 (native)     | WhisperKit |          26 |  138.5x |
| hobbit-1h.mp3 (native)     | WhisperCPP |          42 |   85.7x |
