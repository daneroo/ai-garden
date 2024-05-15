# Whisper.sh Benchmark Results

Running whisper.sh with the following parameters:
BASEDIR: John Gwynne - Faithful and the Fallen 04 - Wrath
OUTDIR: ./bench-results
MODELS: tiny.en base.en small.en medium.en
DURATIONS: 60000 300000 3600000 18000000

| Model | Duration (ms) | Execution Time (s) |
|-------|----------|------|
| tiny.en | 60000 | 48 |
| tiny.en | 300000 | 51 |
| tiny.en | 3600000 | 114 |
| tiny.en | 18000000 | 397 |
| base.en | 60000 | 47 |
| base.en | 300000 | 53 |
| base.en | 3600000 | 140 |
| base.en | 18000000 | 539 |
| small.en | 60000 | 49 |
| small.en | 300000 | 62 |
| small.en | 3600000 | 237 |
| small.en | 18000000 | 4828 |
| medium.en | 60000 | 1003 |
| medium.en | 300000 | 80 |
| medium.en | 3600000 | 1417 |
| medium.en | 18000000 | 11020 |

Results also saved to results.md"

Prompt to convert:
Convert the detailed table listing execution times for each model at different durations into a summarized format. 
The original table has multiple rows per model, each specifying the duration in milliseconds and
the corresponding execution time in seconds. 
The summarized table should have one row per model, 
with separate columns for the execution times corresponding to each duration. 
The column headers should reflect the execution times for the different durations. 
In the final table, express the duration (column headers) in minutes or hours.
The summarized table should be in markdown format.
