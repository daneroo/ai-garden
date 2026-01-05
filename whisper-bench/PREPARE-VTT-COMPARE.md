# VTT Comparison Preparation

Generated VTT files for comparison experiments.

- **Date**: 2026-01-04T21:54:42Z
- **Input**: data/samples/hobbit.m4b

## Combinations

| Runner     | Model    | Word TS | Tag                    | Elapsed (s) | Speedup | Monotonicity     |
| ---------- | -------- | ------- | ---------------------- | ----------: | ------: | ---------------- |
| whisperkit | tiny.en  | w1      | whisperkit-tiny.en-w1  |         302 |  124.2x | 189 (max 24.92s) |
| whisperkit | tiny.en  | wN      | whisperkit-tiny.en-wN  |         288 |  130.3x | 154 (max 9.58s)  |
| whisperkit | small.en | w1      | whisperkit-small.en-w1 |        1368 |   27.4x | 117 (max 18.08s) |
| whisperkit | small.en | wN      | whisperkit-small.en-wN |        1379 |   27.2x | 155 (max 6.78s)  |
| whispercpp | tiny.en  | w1      | whispercpp-tiny.en-w1  |         489 |   76.7x | 0                |
| whispercpp | tiny.en  | wN      | whispercpp-tiny.en-wN  |         460 |   81.5x | 0                |
| whispercpp | small.en | w1      | whispercpp-small.en-w1 |        1118 |   33.5x | 0                |
| whispercpp | small.en | wN      | whispercpp-small.en-wN |        1082 |   34.6x | 0                |
