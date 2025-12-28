# VTT Comparison Preparation

Generated VTT files for comparison experiments.

- **Date**: 2025-12-28T21:01:20Z
- **Input**: data/samples/hobbit.m4b

## Combinations

| Runner     | Model    | Word TS | Tag                    | Elapsed (s) | Speedup |
| ---------- | -------- | ------- | ---------------------- | ----------: | ------: |
| whisperkit | tiny.en  | w1      | whisperkit-tiny.en-w1  |         275 |  136.3x |
| whisperkit | tiny.en  | wN      | whisperkit-tiny.en-wN  |         270 |  139.1x |
| whisperkit | small.en | w1      | whisperkit-small.en-w1 |        1355 |   27.7x |
| whisperkit | small.en | wN      | whisperkit-small.en-wN |        1348 |   27.8x |
| whispercpp | tiny.en  | w1      | whispercpp-tiny.en-w1  |         451 |   83.1x |
| whispercpp | tiny.en  | wN      | whispercpp-tiny.en-wN  |         421 |   89.0x |
| whispercpp | small.en | w1      | whispercpp-small.en-w1 |        1106 |   33.9x |
| whispercpp | small.en | wN      | whispercpp-small.en-wN |        1073 |   34.9x |
