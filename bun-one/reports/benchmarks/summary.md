# Whisper Benchmark Results

Generated: 2026-02-23T18:59:34.626Z

## Results

| Input       | Model    | Duration | Elapsed | Speedup | Timestamp                |
| ----------- | -------- | -------- | ------- | ------- | ------------------------ |
| hobbit.m4b  | small.en | full     | 1050s   | 35.7x   | 2026-02-23T07:59:16.492Z |
| hobbit.m4b  | small.en | 3600s    | 112s    | 32.1x   | 2026-02-23T07:32:55.553Z |
| hobbit.m4b  | small.en | 7200s    | 214s    | 33.6x   | 2026-02-23T07:36:29.655Z |
| hobbit.m4b  | small.en | 10800s   | 317s    | 34.1x   | 2026-02-23T07:41:46.618Z |
| hobbit.m4b  | tiny.en  | full     | 398s    | 94.2x   | 2026-02-23T07:31:03.896Z |
| hobbit.m4b  | tiny.en  | 3600s    | 53s     | 67.9x   | 2026-02-23T07:20:42.682Z |
| hobbit.m4b  | tiny.en  | 7200s    | 91s     | 79.1x   | 2026-02-23T07:22:14.067Z |
| hobbit.m4b  | tiny.en  | 10800s   | 132s    | 81.8x   | 2026-02-23T07:24:26.233Z |
| quixote.m4b | small.en | full     | 4180s   | 31.1x   | 2026-02-23T09:56:53.254Z |
| quixote.m4b | small.en | 3600s    | 155s    | 23.2x   | 2026-02-23T08:36:31.183Z |
| quixote.m4b | small.en | 7200s    | 270s    | 26.7x   | 2026-02-23T08:41:01.117Z |
| quixote.m4b | small.en | 10800s   | 372s    | 29.0x   | 2026-02-23T08:47:12.860Z |
| quixote.m4b | tiny.en  | full     | 1684s   | 77.2x   | 2026-02-23T08:33:56.228Z |
| quixote.m4b | tiny.en  | 3600s    | 89s     | 40.4x   | 2026-02-23T08:00:45.687Z |
| quixote.m4b | tiny.en  | 7200s    | 134s    | 53.7x   | 2026-02-23T08:02:59.924Z |
| quixote.m4b | tiny.en  | 10800s   | 172s    | 62.8x   | 2026-02-23T08:05:52.368Z |

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
