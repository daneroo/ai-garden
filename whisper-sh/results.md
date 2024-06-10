# Whisper.sh Benchmark Results

Running whisper.sh with the following parameters:
WAV_FILE: J.R.R. Tolkien - The Hobbit - Andy Serkis.wav
OUTDIR: ./bench-results
MODELS: tiny.en base.en
DURATIONS: 3600000 7200000

| Arch         | Model   | Duration (ms) | Execution Time (s) |
| ------------ | ------- | ------------- | ------------------ |
| Darwin arm64 | tiny.en | 3600000       | 83                 |
| Darwin arm64 | tiny.en | 7200000       | 146                |
| Darwin arm64 | base.en | 3600000       | 115                |
| Darwin arm64 | base.en | 7200000       | 218                |

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
