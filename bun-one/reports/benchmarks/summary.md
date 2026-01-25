# Whisper Benchmark Results

Generated: 2026-01-25T21:58:47.077Z

## Results

| Input       | Model    | Duration | Elapsed | Speedup | Timestamp                |
| ----------- | -------- | -------- | ------- | ------- | ------------------------ |
| hobbit.m4b  | small.en | full     | 1016s   | 36.9x   | 2026-01-25T12:53:55.390Z |
| hobbit.m4b  | small.en | 3600s    | 115s    | 31.3x   | 2026-01-25T12:15:54.985Z |
| hobbit.m4b  | small.en | 7200s    | 222s    | 32.4x   | 2026-01-25T12:19:37.460Z |
| hobbit.m4b  | small.en | 10800s   | 322s    | 33.5x   | 2026-01-25T12:24:59.386Z |
| hobbit.m4b  | tiny.en  | full     | 407s    | 92.0x   | 2026-01-25T12:36:59.873Z |
| hobbit.m4b  | tiny.en  | 3600s    | 51s     | 70.6x   | 2026-01-25T21:25:00.706Z |
| hobbit.m4b  | tiny.en  | 7200s    | 92s     | 78.5x   | 2026-01-25T21:26:32.484Z |
| hobbit.m4b  | tiny.en  | 10800s   | 138s    | 78.4x   | 2026-01-25T12:13:59.854Z |
| quixote.m4b | small.en | 3600s    | 151s    | 23.8x   | 2026-01-25T21:54:21.121Z |
| quixote.m4b | small.en | 7200s    | 266s    | 27.1x   | 2026-01-25T21:58:47.070Z |
| quixote.m4b | tiny.en  | 3600s    | 171s    | 21.1x   | 2026-01-25T21:49:38.729Z |
| quixote.m4b | tiny.en  | 7200s    | 131s    | 54.8x   | 2026-01-25T21:51:50.086Z |

## Plots (side-by-side)

<!-- markdownlint-disable MD033 -->
<table><tr>
<td><img alt="Execution Time" src="execution-time.png" width="400"></td>
<td><img alt="Speedup" src="speedup.png" width="400"></td>
</tr></table>

## Execution Time

![Execution Time](execution-time.png)

## Speedup

![Speedup](speedup.png)
