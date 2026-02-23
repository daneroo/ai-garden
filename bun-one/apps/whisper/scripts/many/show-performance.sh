#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
DEFAULT_DIR="$SCRIPT_DIR/data/output"

VTT_DIR="$DEFAULT_DIR"
SEARCH=""
OUTPUT=""

usage() {
  echo "Usage: $0 [-d dir] [-s search] [-o output.png] [-h]"
  echo ""
  echo "Scatter plot of transcription performance from .vtt provenance headers."
  echo "X axis: Audio Duration (hours)  Y axis: Execution Time (hours)"
  echo ""
  echo "Options:"
  echo "  -d DIR     Directory to search for .vtt files (default: data/output)"
  echo "  -s TERMS   Filter filenames by search terms (case-insensitive, each word must match)"
  echo "  -o FILE    Save plot to FILE instead of displaying with plt.show()"
  echo "  -h         Show this help"
  echo ""
  echo "Examples:"
  echo "  $0"
  echo "  $0 -s culture"
  echo "  $0 -d data/output/benchmarks -o /tmp/perf.png"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -d) VTT_DIR="$2"; shift 2 ;;
    -s) SEARCH="$2"; shift 2 ;;
    -o) OUTPUT="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

if [[ ! -d "$VTT_DIR" ]]; then
  echo "ERROR: directory not found: $VTT_DIR"
  exit 1
fi

# Find all .vtt files, optionally filtering by search terms
vtt_files=$(find "$VTT_DIR" -maxdepth 1 -name "*.vtt" -type f | sort)

if [[ -n "$SEARCH" ]]; then
  filtered="$vtt_files"
  for word in $SEARCH; do
    filtered=$(echo "$filtered" | grep -i "$word" || true)
  done
  vtt_files="$filtered"
fi

if [[ -z "$vtt_files" ]]; then
  echo "No .vtt files found in $VTT_DIR${SEARCH:+ matching \"$SEARCH\"}"
  exit 0
fi

count=$(echo "$vtt_files" | wc -l | tr -d ' ')
echo "Found $count .vtt file(s)${SEARCH:+ matching \"$SEARCH\"}"

# Extract only the FIRST provenance JSON from each file:
#   grep -m1 searches each file independently (one match per file)
#   -A1 gives us the NOTE line + the JSON line; we keep only the JSON lines
json_data=$(
  while IFS= read -r f; do
    grep -A1 "NOTE Provenance" "$f" | grep -m1 "elapsedMs" || true
  done <<< "$vtt_files"
)

if [[ -z "$json_data" ]]; then
  echo "No provenance records found."
  exit 1
fi

# Hand off to Python for plotting
uvx --with matplotlib --with numpy python - <<PYTHON
import sys, json
import numpy as np
import matplotlib.pyplot as plt

raw = """$json_data"""
output = """$OUTPUT"""

points = []
for line in raw.strip().splitlines():
    line = line.strip()
    if not line:
        continue
    try:
        d = json.loads(line)
        elapsed_ms = d.get("elapsedMs")
        duration_sec = d.get("durationSec")
        inp = d.get("input", "")
        model = d.get("model", "")
        if elapsed_ms and duration_sec:
            points.append({
                "label": inp.replace(".m4b", ""),
                "model": model,
                "duration_h": duration_sec / 3600,
                "elapsed_h": elapsed_ms / 3600000,
            })
    except json.JSONDecodeError:
        pass

if not points:
    print("No valid data points parsed.")
    sys.exit(1)

print(f"Plotting {len(points)} data point(s)")

# Group by model for colour
by_model = {}
for p in points:
    by_model.setdefault(p["model"], []).append(p)

plt.figure(figsize=(10, 6))
for model, pts in sorted(by_model.items()):
    xs = [p["duration_h"] for p in pts]
    ys = [p["elapsed_h"] for p in pts]
    sc = plt.scatter(xs, ys, label=model, s=80, zorder=3)
    # Annotate each point with a short label
    for p in pts:
        short = p["label"].split(" - ")[-1]  # last segment of the title
        plt.annotate(short, (p["duration_h"], p["elapsed_h"]),
                     fontsize=6, textcoords="offset points", xytext=(5, 3))

# Least-squares linear fit (with intercept — captures fixed overhead)
all_x = np.array([p["duration_h"] for p in points])
all_y = np.array([p["elapsed_h"] for p in points])
slope, intercept = np.polyfit(all_x, all_y, 1)
speedup = 1.0 / slope  # implied speedup from the slope alone
fit_x = np.array([0, all_x.max() * 1.05])
fit_y = slope * fit_x + intercept
plt.plot(fit_x, fit_y, "--", color="tomato", linewidth=1.5,
         label=f"fit: {speedup:.1f}x realtime")

plt.xlabel("Audio Duration (hours)")
plt.ylabel("Execution Time (hours)")
plt.ylim(bottom=0)
plt.xlim(left=0)
plt.title("Whisper Transcription Performance")
plt.legend()
plt.grid(True, alpha=0.3)
plt.tight_layout()

if output:
    plt.savefig(output, dpi=150)
    print(f"Saved: {output}")
else:
    plt.show()
PYTHON
