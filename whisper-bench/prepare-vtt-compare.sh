#!/bin/bash
# prepare-vtt-compare.sh - Generate VTT files for comparison experiments
#
# Combinations:
#   - Runners: whisperkit, whispercpp
#   - Word timestamps: w1 (enabled), wN (disabled)
#   - Models: tiny.en, small.en
#
# Total: 2 × 2 × 2 = 8 combinations

set -e

INPUT="data/samples/hobbit.m4b"
OUTPUT_MD="PREPARE-VTT-COMPARE.md"

RUNNERS="whisperkit whispercpp"
WORD_TS_MODES="w1 wN"
MODELS="tiny.en small.en"

# Helper function to run transcription
# Tag format: runner-model-wordts (e.g., whisperkit-tiny.en-w1)
run_transcribe() {
  local runner=$1
  local model=$2
  local word_ts=$3
  local tag="${runner}-${model}-${word_ts}"
  
  local word_ts_flag=""
  if [ "$word_ts" = "w1" ]; then
    word_ts_flag="--word-timestamps"
  fi
  
  echo "Running: $tag" >&2
  deno run -A main.ts --runner "$runner" --input "$INPUT" --model "$model" --tag "$tag" --json $word_ts_flag
}

echo "=== Prepare VTT Comparison Files ===" >&2
echo "" >&2

# Start markdown output
cat > "$OUTPUT_MD" << 'HEADER'
# VTT Comparison Preparation

Generated VTT files for comparison experiments.

HEADER

echo "- **Date**: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$OUTPUT_MD"
echo "- **Input**: $INPUT" >> "$OUTPUT_MD"
echo "" >> "$OUTPUT_MD"

cat >> "$OUTPUT_MD" << 'EOF'
## Combinations

| Runner | Model | Word TS | Tag | Elapsed (s) | Speedup | Monotonicity |
|--------|-------|---------|-----|------------:|--------:|---|
EOF

# Nested loops: runner × model × word_ts
for runner in $RUNNERS; do
  for model in $MODELS; do
    for word_ts in $WORD_TS_MODES; do
      tag="${runner}-${model}-${word_ts}"
      echo "Processing: $tag" >&2
      
      JSON=$(run_transcribe "$runner" "$model" "$word_ts")
      elapsed=$(echo "$JSON" | jq -r '.elapsedSec')
      speedup=$(echo "$JSON" | jq -r '.speedup')
      
      # Extract monotonicity info
      # Use jq to format: "0" or "count (max Xs)"
      monotonicity=$(echo "$JSON" | jq -r '
        if .vttSummary.monotonicityViolations == 0 then
          "0"
        else
          "\(.vttSummary.monotonicityViolations) (max \(.vttSummary.monotonicityViolationMaxOverlap * 100 | round / 100)s)"
        end
      ')
      
      echo "| $runner | $model | $word_ts | $tag | $elapsed | ${speedup}x | $monotonicity |" >> "$OUTPUT_MD"
    done
  done
done

echo "" >> "$OUTPUT_MD"
echo "" >&2
echo "=== Complete ===" >&2
echo "Results written to $OUTPUT_MD" >&2
echo "VTT files in data/output/" >&2
