# Benchmark Results

- **Date**: 2025-12-21T23:40:10Z
- **Model**: tiny.en

## 1. Baseline

Full-length transcription of hobbit.mp3 (10h24m).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         300 |  125.0x |
| WhisperCPP |         439 |   85.3x |

## 2. Native M4B

M4B format support. WhisperKit handles natively, WhisperCPP auto-converts to
WAV.

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         285 |  131.5x |
| WhisperCPP |         436 |   86.0x |

## 3. Max WAV Length Exceeded (49h44m)

Files exceeding 37h WAV limit. WhisperCPP fails on these.

| Runner     | Elapsed (s) |                 Speedup |
| ---------- | ----------: | ----------------------: |
| WhisperKit |        1230 |                  145.6x |
| WhisperCPP |         N/A | N/A (exceeds WAV limit) |

## 4. Offset and Duration Cost

Comparing --duration extraction vs native short file.

| Test                       | Runner     | Elapsed (s) | Speedup |
| -------------------------- | ---------- | ----------: | ------: |
| hobbit.mp3 --duration 3600 | WhisperKit |          71 |   50.5x |
| hobbit.mp3 --duration 3600 | WhisperCPP |          80 |   44.9x |
| hobbit.mp3 offset 9h, 1h   | WhisperKit |          68 |   52.7x |
| hobbit.mp3 offset 9h, 1h   | WhisperCPP |          78 |   46.4x |
| hobbit-1h.mp3 (native)     | WhisperKit |          26 |  136.7x |
| hobbit-1h.mp3 (native)     | WhisperCPP |          42 |   85.1x |
