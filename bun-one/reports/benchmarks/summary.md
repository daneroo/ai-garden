# Whisper Benchmark Results

Generated: 2026-02-07T11:15:05.767Z

## Results

| Input       | Model    | Duration | Elapsed | Speedup | Timestamp                |
| ----------- | -------- | -------- | ------- | ------- | ------------------------ |
| hobbit.m4b  | small.en | full     | 1048s   | 35.8x   | 2026-02-07T09:16:50.808Z |
| hobbit.m4b  | small.en | 3600s    | 116s    | 31.0x   | 2026-02-07T08:50:34.471Z |
| hobbit.m4b  | small.en | 7200s    | 212s    | 34.0x   | 2026-02-07T08:54:06.555Z |
| hobbit.m4b  | small.en | 10800s   | 317s    | 34.1x   | 2026-02-07T08:59:23.175Z |
| hobbit.m4b  | tiny.en  | full     | 402s    | 93.2x   | 2026-02-07T08:48:38.638Z |
| hobbit.m4b  | tiny.en  | 3600s    | 82s     | 43.9x   | 2026-02-07T08:38:12.129Z |
| hobbit.m4b  | tiny.en  | 7200s    | 92s     | 78.3x   | 2026-02-07T08:39:44.037Z |
| hobbit.m4b  | tiny.en  | 10800s   | 132s    | 81.8x   | 2026-02-07T08:41:56.218Z |
| quixote.m4b | small.en | full     | 4141s   | 31.4x   | 2026-02-07T11:15:05.740Z |
| quixote.m4b | small.en | 3600s    | 157s    | 22.9x   | 2026-02-07T09:55:28.590Z |
| quixote.m4b | small.en | 7200s    | 261s    | 27.6x   | 2026-02-07T09:59:49.402Z |
| quixote.m4b | small.en | 10800s   | 375s    | 28.8x   | 2026-02-07T10:06:04.648Z |
| quixote.m4b | tiny.en  | full     | 1692s   | 76.8x   | 2026-02-07T09:52:51.716Z |
| quixote.m4b | tiny.en  | 3600s    | 169s    | 21.3x   | 2026-02-07T09:19:39.791Z |
| quixote.m4b | tiny.en  | 7200s    | 128s    | 56.3x   | 2026-02-07T09:21:47.690Z |
| quixote.m4b | tiny.en  | 10800s   | 172s    | 62.8x   | 2026-02-07T09:24:39.310Z |

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
