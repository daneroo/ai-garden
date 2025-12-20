#!/bin/bash
# bench.sh - Run whisper benchmarks and generate BENCHMARK.md
#
# TODO: Create prepare-samples.sh to document how sample files were created:
#   - hobbit.mp3, hobbit.m4b (10h24m) - full audiobook
#   - hobbit-1h.mp3 (1h) - extracted first hour
#   - stalin2.mp3 (49h44m) - long audiobook for WAV limit testing

set -e

MODEL="tiny.en"
OUTPUT_MD="BENCHMARK.md"

# Helper function to run a benchmark and extract JSON
# Usage: run_bench <runner> <input> [extra_args]
# Tag is the runner name, so output is: input.runner.vtt
run_bench() {
  local runner=$1
  local input=$2
  local extra_args=${3:-}
  deno run -A main.ts --runner "$runner" --input "$input" --model "$MODEL" --tag "$runner" $extra_args
}

# Helper to format result row
format_row() {
  local label=$1
  local json=$2
  local elapsed=$(echo "$json" | jq -r '.elapsedSec')
  local speedup=$(echo "$json" | jq -r '.speedup')
  echo "| $label | $elapsed | ${speedup}x |"
}

echo "=== Whisper Benchmark Suite ===" >&2
echo "" >&2

# Start markdown output
cat > "$OUTPUT_MD" << 'HEADER'
# Benchmark Results

HEADER

echo "- **Date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$OUTPUT_MD"
echo "- **Model**: $MODEL" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

# ============================================================
# Section 1: Baseline - Full length hobbit.mp3
# ============================================================
echo "## 1. Baseline (hobbit.mp3 - 10h24m)" >&2
cat >> "$OUTPUT_MD" << 'EOF'
## 1. Baseline

Full-length transcription of hobbit.mp3 (10h24m).

| Runner | Elapsed (s) | Speedup |
|--------|------------:|--------:|
EOF

KIT_JSON=$(run_bench whisperkit data/samples/hobbit.mp3)
CPP_JSON=$(run_bench whispercpp data/samples/hobbit.mp3)
format_row "WhisperKit" "$KIT_JSON" >> "$OUTPUT_MD"
format_row "WhisperCPP" "$CPP_JSON" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

# ============================================================
# Section 2: Native M4B - whisperkit only
# ============================================================
echo "## 2. Native M4B (hobbit.m4b - 10h24m)" >&2
cat >> "$OUTPUT_MD" << 'EOF'
## 2. Native M4B

Native M4B format support (whisperkit only).

| Runner | Elapsed (s) | Speedup |
|--------|------------:|--------:|
EOF

KIT_JSON=$(run_bench whisperkit data/samples/hobbit.m4b)
format_row "WhisperKit" "$KIT_JSON" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

# ============================================================
# Section 3: Max WAV Length Exceeded - stalin2.mp3
# ============================================================
echo "## 3. Max WAV Length (stalin2.mp3 - 49h44m)" >&2
cat >> "$OUTPUT_MD" << 'EOF'
## 3. Max WAV Length Exceeded (49h44m)

Files exceeding 37h WAV limit. WhisperCPP fails on these.

| Runner | Elapsed (s) | Speedup |
|--------|------------:|--------:|
EOF

KIT_JSON=$(run_bench whisperkit data/samples/stalin2.mp3)
format_row "WhisperKit" "$KIT_JSON" >> "$OUTPUT_MD"
echo "| WhisperCPP | N/A | N/A (exceeds WAV limit) |" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

# ============================================================
# Section 4: Offset and Duration Cost
# ============================================================
echo "## 4. Offset/Duration Cost Tests" >&2
cat >> "$OUTPUT_MD" << 'EOF'
## 4. Offset and Duration Cost

Comparing --duration extraction vs native short file.

| Test | Runner | Elapsed (s) | Speedup |
|------|--------|------------:|--------:|
EOF

# hobbit.mp3 --duration 3600 (first hour)
KIT_JSON=$(run_bench whisperkit data/samples/hobbit.mp3 "--duration 3600")
CPP_JSON=$(run_bench whispercpp data/samples/hobbit.mp3 "--duration 3600")
echo "| hobbit.mp3 --duration 3600 | WhisperKit | $(echo "$KIT_JSON" | jq -r '.elapsedSec') | $(echo "$KIT_JSON" | jq -r '.speedup')x |" >> "$OUTPUT_MD"
echo "| hobbit.mp3 --duration 3600 | WhisperCPP | $(echo "$CPP_JSON" | jq -r '.elapsedSec') | $(echo "$CPP_JSON" | jq -r '.speedup')x |" >> "$OUTPUT_MD"

# hobbit.mp3 --start 32400 --duration 3600 (hour 9-10)
KIT_JSON=$(run_bench whisperkit data/samples/hobbit.mp3 "--start 32400 --duration 3600")
CPP_JSON=$(run_bench whispercpp data/samples/hobbit.mp3 "--start 32400 --duration 3600")
echo "| hobbit.mp3 offset 9h, 1h | WhisperKit | $(echo "$KIT_JSON" | jq -r '.elapsedSec') | $(echo "$KIT_JSON" | jq -r '.speedup')x |" >> "$OUTPUT_MD"
echo "| hobbit.mp3 offset 9h, 1h | WhisperCPP | $(echo "$CPP_JSON" | jq -r '.elapsedSec') | $(echo "$CPP_JSON" | jq -r '.speedup')x |" >> "$OUTPUT_MD"

# hobbit-1h.mp3 (native 1h file)
KIT_JSON=$(run_bench whisperkit data/samples/hobbit-1h.mp3)
CPP_JSON=$(run_bench whispercpp data/samples/hobbit-1h.mp3)
echo "| hobbit-1h.mp3 (native) | WhisperKit | $(echo "$KIT_JSON" | jq -r '.elapsedSec') | $(echo "$KIT_JSON" | jq -r '.speedup')x |" >> "$OUTPUT_MD"
echo "| hobbit-1h.mp3 (native) | WhisperCPP | $(echo "$CPP_JSON" | jq -r '.elapsedSec') | $(echo "$CPP_JSON" | jq -r '.speedup')x |" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

# ============================================================
# Done
# ============================================================
echo "" >&2
echo "=== Benchmark complete ===" >&2
echo "Results written to $OUTPUT_MD" >&2
