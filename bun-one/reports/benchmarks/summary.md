# Whisper Benchmark Results

Generated: 2026-02-23T23:01:09.665Z

## Results

| Input       | Model    | Duration | Elapsed | Speedup | Timestamp                |
| ----------- | -------- | -------- | ------- | ------- | ------------------------ |
| hobbit.m4b  | small.en | full     | 1050s   | 35.7x   | 2026-02-23T23:01:02.510Z |
| hobbit.m4b  | small.en | 3600s    | 112s    | 32.1x   | 2026-02-23T23:00:59.180Z |
| hobbit.m4b  | small.en | 7200s    | 214s    | 33.6x   | 2026-02-23T23:01:00.284Z |
| hobbit.m4b  | small.en | 10800s   | 317s    | 34.1x   | 2026-02-23T23:01:01.392Z |
| hobbit.m4b  | tiny.en  | full     | 398s    | 94.2x   | 2026-02-23T23:00:59.114Z |
| hobbit.m4b  | tiny.en  | 3600s    | 53s     | 67.9x   | 2026-02-23T23:00:55.780Z |
| hobbit.m4b  | tiny.en  | 7200s    | 91s     | 79.1x   | 2026-02-23T23:00:56.885Z |
| hobbit.m4b  | tiny.en  | 10800s   | 132s    | 81.8x   | 2026-02-23T23:00:57.993Z |
| quixote.m4b | small.en | full     | 4180s   | 31.1x   | 2026-02-23T23:01:09.662Z |
| quixote.m4b | small.en | 3600s    | 155s    | 23.2x   | 2026-02-23T23:01:06.179Z |
| quixote.m4b | small.en | 7200s    | 270s    | 26.7x   | 2026-02-23T23:01:07.313Z |
| quixote.m4b | small.en | 10800s   | 372s    | 29.0x   | 2026-02-23T23:01:08.449Z |
| quixote.m4b | tiny.en  | full     | 1684s   | 77.2x   | 2026-02-23T23:01:06.080Z |
| quixote.m4b | tiny.en  | 3600s    | 89s     | 40.4x   | 2026-02-23T23:01:02.610Z |
| quixote.m4b | tiny.en  | 7200s    | 134s    | 53.7x   | 2026-02-23T23:01:03.735Z |
| quixote.m4b | tiny.en  | 10800s   | 172s    | 62.8x   | 2026-02-23T23:01:04.870Z |

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
