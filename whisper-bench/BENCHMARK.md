# Benchmark Results

- **Date**: 2026-01-05T00:11:02Z
- **Model**: tiny.en

## 1. Baseline

Full-length transcription of hobbit.mp3 (10h24m).

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         341 |  110.0x |
| WhisperCPP |         475 |   78.9x |

## 2. Native M4B

M4B format support. WhisperKit handles natively, WhisperCPP auto-converts to
WAV.

| Runner     | Elapsed (s) | Speedup |
| ---------- | ----------: | ------: |
| WhisperKit |         288 |  130.0x |
| WhisperCPP |         463 |   81.0x |

## 3. Max WAV Length Exceeded (49h44m)

Files exceeding 37h WAV limit. WhisperCPP fails on these.

| Runner     | Elapsed (s) |                 Speedup |
| ---------- | ----------: | ----------------------: |
| WhisperKit |        1405 |                  127.5x |
| WhisperCPP |         N/A | N/A (exceeds WAV limit) |

## 4. Offset and Duration Cost

Comparing --duration extraction vs native short file.

| Test                       | Runner     | Elapsed (s) | Speedup |
| -------------------------- | ---------- | ----------: | ------: |
| hobbit.mp3 --duration 3600 | WhisperKit |          90 |   40.1x |
| hobbit.mp3 --duration 3600 | WhisperCPP |          88 |   40.8x |
| hobbit.mp3 offset 9h, 1h   | WhisperKit |          86 |   41.7x |
| hobbit.mp3 offset 9h, 1h   | WhisperCPP |          89 |   40.2x |
| hobbit-1h.mp3 (native)     | WhisperKit |          32 |  114.1x |
| hobbit-1h.mp3 (native)     | WhisperCPP |          45 |   80.7x |
