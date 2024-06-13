# Whisper.sh Benchmark Results

Running whisper.sh with the following parameters:
WAV_FILE: J.R.R. Tolkien - The Hobbit - Andy Serkis.wav
OUTDIR: ./bench-results
MODELS: tiny.en base.en
DURATIONS: 3600000 7200000

| Arch         | Threads | Model   | Duration (ms) | Execution Time (s) |
| ------------ | ------- | ------- | ------------- | ------------------ |
| Darwin arm64 | 4       | tiny.en | 3600000       | 86                 |
| Darwin arm64 | 4       | tiny.en | 7200000       | 144                |
| Darwin arm64 | 8       | tiny.en | 3600000       | 82                 |
| Darwin arm64 | 8       | tiny.en | 7200000       | 137                |
| Darwin arm64 | 4       | base.en | 3600000       | 114                |
| Darwin arm64 | 4       | base.en | 7200000       | 216                |

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
