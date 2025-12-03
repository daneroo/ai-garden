#!/bin/bash

# validate-chapters.sh
# Phase 1: Validate chapter bookmarks in audiobook

set -euo pipefail

# Environment variables
AUDIOBOOKS_ROOT="${AUDIOBOOKS_ROOT:-/Volumes/Space/Reading/audiobooks}"
BOOK_DIR="${BOOK_DIR:-${AUDIOBOOKS_ROOT}/Emad Mostaque - The Last Economy}"
BOOKMARK_DURATION_DEFAULT="${BOOKMARK_DURATION_DEFAULT:-4}"

METADATA_FILE="${BOOK_DIR}/metadata.json"
AUDIO_FILE=$(find "$BOOK_DIR" -name "*.m4b" -type f | head -n 1)

if [ ! -f "$METADATA_FILE" ]; then
  echo "Error: metadata.json not found at $METADATA_FILE"
  exit 1
fi

if [ -z "$AUDIO_FILE" ] || [ ! -f "$AUDIO_FILE" ]; then
  echo "Error: .m4b file not found in $BOOK_DIR"
  exit 1
fi

echo "# CHAPTER BOOKMARK VALIDATION"
echo ""
echo "- Processing: $BOOK_DIR"
echo "- Metadata: $METADATA_FILE"
echo "- Audio: $AUDIO_FILE"
echo ""

# Loop through chapters and display titles and times
# Assumptions about ffplay parameters:
# - -ss parameter: accepts seconds as a decimal number (e.g., 0, 592.770612)
#   Format: -ss <position_in_seconds>
# - -t parameter: specifies duration to play, but does NOT auto-exit
#   To stop after duration, must use: -autoexit
#   Full command format: ffplay -ss <start> -t <duration> -autoexit -i <file>
echo "## Chapters"
echo ""

chapter_count=$(jq '.chapters | length' "$METADATA_FILE")

for ((i=0; i<chapter_count; i++)); do
  id=$(jq -r ".chapters[$i].id" "$METADATA_FILE")
  start=$(jq -r ".chapters[$i].start" "$METADATA_FILE")
  end=$(jq -r ".chapters[$i].end" "$METADATA_FILE")
  title=$(jq -r ".chapters[$i].title" "$METADATA_FILE")
  
  echo "### Chapter $id: $title"
  echo ""
  echo "- Start: ${start}s"
  echo "- End: ${end}s"
  
  ffplay_cmd="ffplay -ss ${start} -t ${BOOKMARK_DURATION_DEFAULT} -autoexit -i \"${AUDIO_FILE}\""
  echo "- ffplay command: \`${ffplay_cmd}\`"
  echo ""
  
  # Run ffplay
  echo "Playing chapter $id..."
  ffplay -ss "${start}" -t "${BOOKMARK_DURATION_DEFAULT}" -autoexit -i "${AUDIO_FILE}" > /dev/null 2>&1
  echo ""
done

