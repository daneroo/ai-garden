#!/usr/bin/env bash
# prepare-reference-voices.sh
#
# Extracts reference audio clips and transcribes them for use with clone.py.
# Output goes to data/reference/ which is gitignored (copyrighted source material).
#
# Requirements:
#   - ffmpeg (audio extraction)
#   - whisper-cli (transcription)
#   - Source audiobooks mounted at /Volumes/Space/Reading/audiobooks/
#
# -ar 24000: must match speaker_encoder_config.sample_rate in the model config.
#   The speaker encoder does NOT resample — wrong rate = bad embeddings.

set -euo pipefail

WHISPER_MODEL="../../bun-one/apps/whisper/data/models/ggml-tiny.en.bin"
REF_DIR="data/reference"
SAMPLE_RATE=24000

# Voice definitions: name|start_seconds|duration|source_file
VOICES=(
  "serkis|20|20|/Volumes/Space/Reading/audiobooks/J.R.R. Tolkien - The Lord of the Rings - Andy Serkis/J.R.R. Tolkien - The Hobbit - Andy Serkis/J.R.R. Tolkien - The Hobbit - Andy Serkis.m4b"
  "kenny|14|18|/Volumes/Space/Reading/audiobooks/Iain M. Banks - Culture Novels/Iain M. Banks - Culture 02 - The Player of Games/Iain M. Banks - Culture, Book 2 - The Player of Games.m4b"
)

extract_voice() {
  local name start duration source
  IFS='|' read -r name start duration source <<< "$1"

  local wav="$REF_DIR/reference_voice_${name}.wav"
  local txt="$REF_DIR/reference_voice_${name}.txt"

  echo "=== $name (${duration}s from ${start}s) ==="

  ffmpeg -ss "$start" -t "$duration" \
    -i "$source" \
    -ac 1 -ar "$SAMPLE_RATE" -y "$wav" \
    -hide_banner -loglevel error

  whisper-cli -m "$WHISPER_MODEL" --output-txt --output-file "$REF_DIR/reference_voice_${name}" "$wav" 2>/dev/null
  echo "Transcript:"
  cat "$txt"
  echo ""
}

mkdir -p "$REF_DIR"

for voice in "${VOICES[@]}"; do
  extract_voice "$voice"
done

echo "=== Done ==="
echo "Verify with:"
for voice in "${VOICES[@]}"; do
  name="${voice%%|*}"
  echo "  ffplay -autoexit -nodisp $REF_DIR/reference_voice_${name}.wav"
done
