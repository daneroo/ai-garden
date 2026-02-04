#!/usr/bin/env bash
set -euo pipefail

# Run from apps/whisper
if [[ ! -f "whisper.ts" ]]; then
  echo "Run this script from apps/whisper"
  exit 1
fi

INPUT="data/samples/hobbit-30m.m4b"
OUTPUT_DIR="data/output/demo"

echo "== Whisper demo: full run =="
bun run whisper.ts -i "$INPUT" -m tiny.en --output "$OUTPUT_DIR" --tag demo-full

echo "== Whisper demo: segmented concat run (overlap=0) =="
bun run whisper.ts -i "$INPUT" --segment 10m -m tiny.en --output "$OUTPUT_DIR" --tag demo-seg-10m

echo "== Whisper demo: overlap guard (expected failure) =="
set +e
bun run whisper.ts -i "$INPUT" --segment 10m --overlap 30s -m tiny.en --output "$OUTPUT_DIR" --tag demo-overlap
OVERLAP_EXIT_CODE=$?
set -e

echo "Overlap run exit code: $OVERLAP_EXIT_CODE"
if [[ $OVERLAP_EXIT_CODE -eq 0 ]]; then
  echo "ERROR: overlap run unexpectedly succeeded"
  exit 1
fi
echo "Expected failure confirmed: overlapping stitching : not yet implemented!"

echo "== Demo outputs =="
ls -ltr "$OUTPUT_DIR"
