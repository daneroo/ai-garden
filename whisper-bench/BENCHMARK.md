# Benchmark Results

- **Date**: 2025-12-19T22:36:51Z
- **Model**: tiny.en

## 1. Baseline

Full-length transcription of hobbit.mp3 (10h24m).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         295 |  127.1x |
| WhisperCPP |         438 |   85.6x |

## 2. Native M4B

Native M4B format support (whisperkit only).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         278 |  134.8x |

## 3. Max WAV Length Exceeded (49h44m)

Files exceeding 37h WAV limit. WhisperCPP fails on these.

| Runner     | Elapsed (s) |                 Speedup |
| ---------- | ----------: | ----------------------: |
| WhisperKit |        1176 |                  152.3x |
| WhisperCPP |         N/A | N/A (exceeds WAV limit) |

## 4. Offset and Duration Cost

Comparing --duration extraction vs native short file.

| Test                       | Runner     | Elapsed (s) | Speedup |
| -------------------------- | ---------- | ----------: | ------: |
| hobbit.mp3 --duration 3600 | WhisperKit |          70 |   51.4x |
| hobbit.mp3 --duration 3600 | WhisperCPP |          80 |   45.0x |
| hobbit.mp3 offset 9h, 1h   | WhisperKit |          68 |   52.9x |
| hobbit.mp3 offset 9h, 1h   | WhisperCPP |          78 |   46.2x |
| hobbit-1h.mp3 (native)     | WhisperKit |          26 |  138.5x |
| hobbit-1h.mp3 (native)     | WhisperCPP |          42 |   85.7x |
