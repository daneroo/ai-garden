# Whisper Benchmark Results

Generated: 2026-02-04T09:10:52.508Z

## Results

| Input       | Model    | Duration | Elapsed | Speedup | Timestamp                |
| ----------- | -------- | -------- | ------- | ------- | ------------------------ |
| hobbit.m4b  | small.en | full     | 1068s   | 35.1x   | 2026-02-04T07:09:46.926Z |
| hobbit.m4b  | small.en | 3600s    | 119s    | 30.2x   | 2026-02-04T06:42:49.503Z |
| hobbit.m4b  | small.en | 7200s    | 226s    | 31.9x   | 2026-02-04T06:46:35.515Z |
| hobbit.m4b  | small.en | 10800s   | 324s    | 33.4x   | 2026-02-04T06:51:59.255Z |
| hobbit.m4b  | tiny.en  | full     | 419s    | 89.4x   | 2026-02-04T06:40:50.413Z |
| hobbit.m4b  | tiny.en  | 3600s    | 53s     | 68.3x   | 2026-02-04T06:30:03.550Z |
| hobbit.m4b  | tiny.en  | 7200s    | 93s     | 77.8x   | 2026-02-04T06:31:36.092Z |
| hobbit.m4b  | tiny.en  | 10800s   | 135s    | 79.9x   | 2026-02-04T06:33:51.318Z |
| quixote.m4b | small.en | full     | 4140s   | 31.4x   | 2026-02-04T09:10:52.495Z |
| quixote.m4b | small.en | 3600s    | 156s    | 23.1x   | 2026-02-04T07:51:14.864Z |
| quixote.m4b | small.en | 7200s    | 263s    | 27.4x   | 2026-02-04T07:55:37.952Z |
| quixote.m4b | small.en | 10800s   | 375s    | 28.8x   | 2026-02-04T08:01:52.659Z |
| quixote.m4b | tiny.en  | full     | 1722s   | 75.5x   | 2026-02-04T07:48:39.095Z |
| quixote.m4b | tiny.en  | 3600s    | 174s    | 20.7x   | 2026-02-04T07:14:28.943Z |
| quixote.m4b | tiny.en  | 7200s    | 139s    | 51.6x   | 2026-02-04T07:16:48.401Z |
| quixote.m4b | tiny.en  | 10800s   | 189s    | 57.2x   | 2026-02-04T07:19:57.062Z |

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
