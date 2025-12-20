# Benchmark Results

- **Date**: 2025-12-20T21:38:34Z
- **Model**: tiny.en

## 1. Baseline

Full-length transcription of hobbit.mp3 (10h24m).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         294 |  127.5x |
| WhisperCPP |         435 |   86.2x |

## 2. Native M4B

Native M4B format support (whisperkit only).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         274 |  136.8x |

## 3. Max WAV Length Exceeded (49h44m)

Files exceeding 37h WAV limit. WhisperCPP fails on these.

| Runner     | Elapsed (s) |                 Speedup |
| ---------- | ----------: | ----------------------: |
| WhisperKit |        1170 |                  153.0x |
| WhisperCPP |         N/A | N/A (exceeds WAV limit) |

## 4. Offset and Duration Cost

Comparing --duration extraction vs native short file.

| Test                       | Runner     | Elapsed (s) | Speedup |
| -------------------------- | ---------- | ----------: | ------: |
| hobbit.mp3 --duration 3600 | WhisperKit |          69 |   52.2x |
| hobbit.mp3 --duration 3600 | WhisperCPP |          79 |   45.6x |
| hobbit.mp3 offset 9h, 1h   | WhisperKit |          69 |   52.2x |
| hobbit.mp3 offset 9h, 1h   | WhisperCPP |          77 |   46.8x |
| hobbit-1h.mp3 (native)     | WhisperKit |          26 |  138.5x |
| hobbit-1h.mp3 (native)     | WhisperCPP |          42 |   85.7x |
