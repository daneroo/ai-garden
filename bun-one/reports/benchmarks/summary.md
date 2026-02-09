# Whisper Benchmark Results

Generated: 2026-02-09T18:56:10.017Z

## Results

| Input       | Model    | Duration | Elapsed | Speedup | Timestamp                |
| ----------- | -------- | -------- | ------- | ------- | ------------------------ |
| hobbit.m4b  | small.en | full     | 1042s   | 36.0x   | 2026-02-09T10:27:40.563Z |
| hobbit.m4b  | small.en | 3600s    | 114s    | 31.6x   | 2026-02-09T10:01:17.723Z |
| hobbit.m4b  | small.en | 7200s    | 220s    | 32.7x   | 2026-02-09T10:04:58.002Z |
| hobbit.m4b  | small.en | 10800s   | 321s    | 33.6x   | 2026-02-09T10:10:19.031Z |
| hobbit.m4b  | tiny.en  | full     | 401s    | 93.5x   | 2026-02-09T09:59:23.321Z |
| hobbit.m4b  | tiny.en  | 3600s    | 81s     | 44.4x   | 2026-02-09T18:56:10.014Z |
| hobbit.m4b  | tiny.en  | 7200s    | 96s     | 75.0x   | 2026-02-09T09:50:30.797Z |
| hobbit.m4b  | tiny.en  | 10800s   | 132s    | 81.8x   | 2026-02-09T09:52:42.631Z |
| quixote.m4b | small.en | full     | 4157s   | 31.3x   | 2026-02-09T12:26:11.472Z |
| quixote.m4b | small.en | 3600s    | 150s    | 24.0x   | 2026-02-09T11:06:24.939Z |
| quixote.m4b | small.en | 7200s    | 260s    | 27.7x   | 2026-02-09T11:10:44.955Z |
| quixote.m4b | small.en | 10800s   | 370s    | 29.2x   | 2026-02-09T11:16:54.758Z |
| quixote.m4b | tiny.en  | full     | 1698s   | 76.5x   | 2026-02-09T11:03:54.615Z |
| quixote.m4b | tiny.en  | 3600s    | 167s    | 21.6x   | 2026-02-09T10:30:27.917Z |
| quixote.m4b | tiny.en  | 7200s    | 131s    | 55.0x   | 2026-02-09T10:32:38.868Z |
| quixote.m4b | tiny.en  | 10800s   | 178s    | 60.7x   | 2026-02-09T10:35:36.942Z |

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
