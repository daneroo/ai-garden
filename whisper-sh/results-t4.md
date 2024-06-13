# Whisper.sh Benchmark Results

Running whisper.sh with the following parameters:
WAV_FILE: J.R.R. Tolkien - The Hobbit - Andy Serkis.wav
OUTDIR: ./bench-results
MODELS: tiny.en base.en
DURATIONS: 3600000 7200000

| Arch          | Model | Threads |         | Duration (ms) | Execution Time (s) |
| ------------- | ----- | ------- | ------- | ------------- | ------------------ |
| Darwin x86_64 | 4     | tiny.en | 3600000 | 204           |
| Darwin x86_64 | 4     | tiny.en | 7200000 | 357           |
