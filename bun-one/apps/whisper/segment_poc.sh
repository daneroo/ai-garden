#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
WHISPER_DIR="$SCRIPT_DIR"

INPUT_M4B="$WHISPER_DIR/data/samples/hobbit.m4b"
SEGMENT_SECS=3600

# Override with env vars if you want quick tweaks
MODEL="${MODEL:-tiny.en}"

SEG_DIR="$WHISPER_DIR/data/samples/segments"
OUT_DIR="$WHISPER_DIR/data/output"

SEG_BASENAME_PREFIX="hobbit"
SEG_NAME_SUFFIX="d1h-ov0m"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "missing required command: $1" >&2
    exit 1
  }
}

need_cmd ffmpeg
need_cmd ffprobe
need_cmd bun
need_cmd whisper-cli
need_cmd jq

if [[ ! -f "$INPUT_M4B" ]]; then
  echo "missing input: $INPUT_M4B" >&2
  exit 1
fi

mkdir -p "$SEG_DIR" "$OUT_DIR"

m4b_dur="$(
  ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 \
    "$INPUT_M4B"
)"

expected_segments="$(
  awk -v d="$m4b_dur" -v s="$SEGMENT_SECS" 'BEGIN {
    q = d / s;
    i = int(q);
    if (q > i) i++;
    if (i < 1) i = 1;
    printf "%d", i;
  }'
)"

echo "Input:    $INPUT_M4B"
echo "Duration: ${m4b_dur}s"
echo "Segments: ${expected_segments} x ${SEGMENT_SECS}s"
echo "Model:    $MODEL"
echo

# --- Segmentation ---
seg_pattern="$SEG_DIR/${SEG_BASENAME_PREFIX}-%02d-${SEG_NAME_SUFFIX}.wav"

segment_ok=true
for ((i = 0; i < expected_segments; i++)); do
  f="$SEG_DIR/${SEG_BASENAME_PREFIX}-$(printf "%02d" "$i")-${SEG_NAME_SUFFIX}.wav"
  if [[ ! -f "$f" ]]; then
    segment_ok=false
    break
  fi
done

seg_elapsed=0
if [[ "$segment_ok" == true ]]; then
  echo "Segmentation: found expected segment files; skipping ffmpeg."
else
  echo "Segmentation: generating wav segments -> $SEG_DIR/"
  seg_start="$(date +%s)"
  ffmpeg -y -hide_banner -loglevel error \
    -i "$INPUT_M4B" \
    -vn \
    -ar 16000 -ac 1 -c:a pcm_s16le \
    -af "asetpts=N/SR/TB" -reset_timestamps 1 \
    -f segment -segment_time "$SEGMENT_SECS" \
    "$seg_pattern"
  seg_end="$(date +%s)"
  seg_elapsed="$((seg_end - seg_start))"
  echo "Segmentation elapsed: ${seg_elapsed}s"
fi

# --- Transcription + timing ---
total_audio="0"
total_elapsed="0"

echo
echo "Transcribing segments..."

for ((i = 0; i < expected_segments; i++)); do
  seg="$SEG_DIR/${SEG_BASENAME_PREFIX}-$(printf "%02d" "$i")-${SEG_NAME_SUFFIX}.wav"
  if [[ ! -f "$seg" ]]; then
    echo "missing segment: $seg" >&2
    exit 1
  fi

  base="$(basename "$seg" .wav)"
  expected_vtt="$OUT_DIR/$base.vtt"

  echo
  echo "[$(printf "%02d" "$i")/${expected_segments}] $base"

  json="$(
    bun run --cwd "$WHISPER_DIR" whisper.ts \
      -i "$seg" \
      -m "$MODEL" \
      -o "$OUT_DIR" \
      --json
  )"

  audio="$(jq -r '.processedAudioDurationSec' <<<"$json")"
  elapsed="$(jq -r '.elapsedSec' <<<"$json")"
  speedup="$(jq -r '.speedup' <<<"$json")"
  outpath="$(jq -r '.outputPath' <<<"$json")"

  total_audio="$(awk -v a="$total_audio" -v b="$audio" 'BEGIN{ printf "%.3f", a+b }')"
  total_elapsed="$(awk -v a="$total_elapsed" -v b="$elapsed" 'BEGIN{ printf "%.3f", a+b }')"

  echo "  audio:   ${audio}s"
  echo "  elapsed: ${elapsed}s"
  echo "  speedup: ${speedup}x"
  echo "  vtt:     $expected_vtt"
  if [[ "$outpath" != "$expected_vtt" ]]; then
    echo "  note: runner outputPath reports $outpath"
  fi
done

overall_speedup="$(awk -v a="$total_audio" -v e="$total_elapsed" 'BEGIN{ if (e>0) printf "%.3f", a/e; else print "0" }')"
total_cost="$(awk -v a="$total_audio" -v e="$total_elapsed" 'BEGIN{ if (a>0) printf "%.2f", e/(a/3600); else print "inf" }')"

echo
echo "Done."
echo "Segmentation elapsed: ${seg_elapsed}s"
echo "Total audio:         ${total_audio}s"
echo "Total elapsed:       ${total_elapsed}s"
echo "Overall speedup:     ${overall_speedup}x"
echo "Total cost:          ${total_cost}s per hour of audio"
