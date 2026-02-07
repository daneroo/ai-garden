#!/usr/bin/env bash
set -euo pipefail

# Run from apps/whisper
if [[ ! -f "whisper.ts" ]]; then
  echo "Run this script from apps/whisper"
  exit 1
fi

INPUT="data/samples/hobbit-30m.m4b"
OUTPUT_DIR="data/output/demo"

echo "== Whisper demo: full run (no cache) =="
bun run whisper.ts -i "$INPUT" -m tiny.en --output "$OUTPUT_DIR" --tag demo-full --no-cache

echo "" # extra blank line to separate the output
echo "== Whisper demo: segmented concat run (no cache) =="
bun run whisper.ts -i "$INPUT" --segment 10m -m tiny.en --output "$OUTPUT_DIR" --tag demo-seg-10m --no-cache

echo "== Demo outputs =="
ls -ltr "$OUTPUT_DIR"
