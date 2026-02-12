#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/data/output"
AUDIOBOOKS="${AUDIOBOOKS:-/Volumes/Space/Reading/audiobooks}"

DRY_RUN=false
SEARCH=""

usage() {
  echo "Usage: $0 [-n|--dry-run] [-h|--help] -s \"search terms\""
  echo ""
  echo "Find and transcribe .m4b audiobooks from $AUDIOBOOKS."
  echo "Skips books whose .vtt already exists in data/output/."
  echo "Shows matches, lets you pick, then runs."
  echo ""
  echo "Options:"
  echo "  -s TERMS       Filter by search terms (each word must match, case-insensitive)"
  echo "  -n, --dry-run  Show commands without executing"
  echo "  -h, --help     Show this help"
  echo ""
  echo "Examples:"
  echo "  $0 -s \"culture banks\""
  echo "  $0 -s malazan"
  echo "  $0 -n -s \"hydrogen sonata\""
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--dry-run) DRY_RUN=true; shift ;;
    -s) SEARCH="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

if [[ -z "$SEARCH" ]]; then
  echo "ERROR: -s \"search terms\" is required"
  echo ""
  usage
fi

if [[ ! -d "$AUDIOBOOKS" ]]; then
  echo "ERROR: directory not found: $AUDIOBOOKS"
  exit 1
fi

# Phase 1: find matching .m4b files
all_m4b=$(find "$AUDIOBOOKS" -name "*.m4b" -type f)

# Chain grep -i for each search word
filtered="$all_m4b"
for word in $SEARCH; do
  filtered=$(echo "$filtered" | grep -i "$word" || true)
done
filtered=$(echo "$filtered" | sort)

if [[ -z "$filtered" ]]; then
  echo "No .m4b files matching \"$SEARCH\" in $(basename "$AUDIOBOOKS")"
  exit 0
fi

# Phase 2: split into skip/todo
skip_list=()
todo_list=()

while IFS= read -r m4b || [[ -n "$m4b" ]]; do
  base=$(basename "$m4b" .m4b)
  vtt="$OUTPUT_DIR/${base}.vtt"

  if [[ -f "$vtt" ]]; then
    skip_list+=("$base")
  else
    todo_list+=("$m4b")
  fi
done <<< "$filtered"

total=$(( ${#skip_list[@]} + ${#todo_list[@]} ))

# Phase 3: show plan
echo "Found ${total} matches for \"$SEARCH\""
echo ""

if [[ ${#skip_list[@]} -gt 0 ]]; then
  echo "SKIP (${#skip_list[@]} already have .vtt):"
  for name in "${skip_list[@]}"; do
    echo "  ${name}.vtt"
  done
  echo ""
fi

if [[ ${#todo_list[@]} -eq 0 ]]; then
  echo "Nothing to do — all matches already transcribed."
  exit 0
fi

# Phase 4: select which to transcribe
echo "Select books to transcribe (space=toggle, enter=confirm):"
choices=()
for m4b in "${todo_list[@]}"; do
  choices+=("$(basename "$m4b")")
done

selected=$(printf '%s\n' "${choices[@]}" | gum choose --no-limit --header "space=toggle, enter=confirm")

if [[ -z "$selected" ]]; then
  echo "Nothing selected."
  exit 0
fi

# Phase 5: execute selected books
echo ""
transcribed=0
while IFS= read -r name || [[ -n "$name" ]]; do
  for m4b in "${todo_list[@]}"; do
    if [[ "$(basename "$m4b")" == "$name" ]]; then
      if $DRY_RUN; then
        echo "WOULD RUN: bun run whisper.ts -i \"$m4b\""
      else
        echo "PROCESSING: ${name%.m4b}"
        (cd "$SCRIPT_DIR" && bun run whisper.ts -i "$m4b")
      fi
      transcribed=$((transcribed + 1))
      break
    fi
  done
done <<< "$selected"

echo ""
echo "Done. skipped=${#skip_list[@]} transcribed=${transcribed}"
