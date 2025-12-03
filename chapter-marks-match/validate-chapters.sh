#!/bin/bash

# validate-chapters.sh
# Phase 1: Validate chapter bookmarks in audiobook

set -euo pipefail

# Environment variables
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WHISPER_HOME="$( cd "${SCRIPT_DIR}/../external-repos/whisper.cpp" && pwd )"
WHISPER_EXEC="whisper-cli"
WHISPER_MODELS="${WHISPER_HOME}/models"

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
  
  # Show ffplay command
  ffplay_cmd="ffplay -ss ${start} -t ${BOOKMARK_DURATION_DEFAULT} -autoexit -i \"${AUDIO_FILE}\""
  echo "- ffplay command: \`${ffplay_cmd}\`"
  # Execute ffplay command if RUN_FFPLAY is true
  RUN_FFPLAY=${RUN_FFPLAY:-false}
  if [ "$RUN_FFPLAY" = "true" ]; then
    echo "Playing chapter $id..."
    eval "$ffplay_cmd" > /dev/null 2>&1
    echo ""
  fi

  # Show whisper command
  whisper_cmd="ffmpeg -v error -ss ${start} -t 10 -i \"${AUDIO_FILE}\" -ar 16000 -ac 1 -c:a pcm_s16le -f wav - | ${WHISPER_EXEC} -m \"${WHISPER_MODELS}/ggml-base.en.bin\" -f - --max-len 1 --split-on-word --output-txt"\

  echo "- whisper command: \`${whisper_cmd}\`"
  # Execute whisper command  if RUN_WHISPER is true
  RUN_WHISPER=${RUN_WHISPER:-false}
  if [ "$RUN_WHISPER" = "true" ]; then
    echo "### Transcribing chapter $id"
    echo ""
    echo "\`\`\`txt"
    eval "$whisper_cmd" 2>/dev/null | tr -d '\n' | sed 's/^ *//'
    echo ""
    echo "\`\`\`"
  fi
  
done
