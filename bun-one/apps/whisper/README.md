# Whisper CLI

Audio transcription tool using whisper.cpp with automatic segmentation for long
files.

## Usage

```bash
# Navigate to (this) whisper directory
cd bun-one/apps/whisper

## Run from workspaces root (../.. == bun-one/)
# CI (format + lint + check + test)
(cd ../.. && bun run ci)
# to fix any formatting errors
(cd ../.. && bun run fmt)
# Run long e2e tests (skipped by default)
(cd ../.. && bun run test:e2e)
# or e2e specific to this app
RUN_E2E_TESTS=1 bun test

# Help and options
bun run whisper.ts -h

# Demo script (full + segmented runs)
./scripts/demo/demo.sh
## which some of these below
# Basic transcription (uses cache)
bun run whisper.ts -i data/samples/hobbit-30m.m4b -m tiny.en --tag demo-basic
# segmented transcription (uses cache)
bun run whisper.ts -i data/samples/hobbit-30m.m4b --segment 10m -m tiny.en --tag demo-seg-10m
# segmented transcription with duration=25m
bun run whisper.ts -i data/samples/hobbit-30m.m4b --segment 10m -m tiny.en --tag demo-seg-10m-dur-25m --duration 25m

./scripts/demo/demo.sh

# Batch transcribe audiobooks (search, pick, skips existing .vtt)
./scripts/many/do-series.sh -h
./scripts/many/do-series.sh -n -s "culture banks"

# Benchmarks
bun run scripts/benchmarks/run-bench.ts
# Output: ../../reports/benchmarks/summary.md, execution-time.png, speedup.png
```

---

## Overview

**Purpose:** Transcribe long-form audiobooks (`.m4b`) into WebVTT (`.vtt`)
subtitle files with timestamps.

**Key capability:** Handles arbitrarily long audio by splitting into segments
(max 37 hours each due to WAV format limits), transcribing each segment, then
stitching results together.

**Current state:** ~2520 total lines after V5 refactor

---

## Architecture

### Core Flow

```txt
INPUT FILE (any format: mp3, m4b, flac, etc.)
    │
    ├──► ffprobe → getAudioDuration()
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  SINGLE SEGMENT (audioDuration <= 37h)                  │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │  to-wav     │───►│ transcribe  │───► OUTPUT.vtt     │
│  │  (ffmpeg)   │    │ (whisper)   │                    │
│  │  [cached]   │    │  [cached]   │                    │
│  └─────────────┘    └─────────────┘                    │
└─────────────────────────────────────────────────────────┘
    │
    ├──► audioDuration > 37h ? SPLIT INTO SEGMENTS
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  MULTI-SEGMENT (N segments, N ≥ 2)                      │
│                                                         │
│  ┌─────────┐   ┌─────────┐                             │
│  │seg0.wav │──►│seg0.vtt │                             │
│  │(ffmpeg) │   │(whisper)│                             │
│  │[cached] │   │[cached] │                             │
│  └─────────┘   └────┬────┘                             │
│  ┌─────────┐   ┌─────────┐                             │
│  │seg1.wav │──►│seg1.vtt │                             │
│  │(ffmpeg) │   │(whisper)│                             │
│  │[cached] │   │[cached] │                             │
│  └─────────┘   └────┬────┘                             │
│       ...           ...                                 │
│  ┌─────────┐   ┌─────────┐        ┌─────────┐          │
│  │segN.wav │──►│segN.vtt │───────►│  stitch │───► OUT │
│  │(ffmpeg) │   │(whisper)│        │         │          │
│  │[cached] │   │[cached] │        └─────────┘          │
│  └─────────┘   └─────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### Stitching

`stitchSegments(...)` handles transcriptions uniformly. (single and multi
segment transcriptions)

We intentionally keep the top-level stitched `NOTE Provenance` header pointing
to the original input (`.m4b`), even when there is only one generated segment
`.wav`.

`stitchSegments(...)` behavior:

- Reads each existing segment `.vtt` file
- Extracts per-segment header provenance
- Calls `stitchVttConcat(...)` to shift cues by each segment `startSec` and
  concatenate
- Builds `segmentBoundaries` to map each source segment to its first cue index
  in the final file
- Merges provenance into per-segment records (`input`, `segment`, `startSec`,
  plus transcribe metadata)
- Computes `elapsedMs` total only when all segments provide finite `elapsedMs`
- Writes the final `.vtt` with one stitched header provenance block plus all
  segment provenance blocks
- `stitchSegments(...)` is NOT currently not modeled as a `Task`

### Caching

Two-level cache speeds up re-runs:

**WAV Cache** (`data/cache/wav/`):

```txt
hobbit-seg00-d10m.wav
│      │    │    │
│      │    │    └── Extension
│      │    └── Duration label (d10m = 10 minutes)
│      └── Segment number (2 digits, zero-padded)
└── Input base name (no extension)
```

- Reusable across all models and runs
- Lifetime: Permanent

**VTT Cache** (`data/cache/vtt/`):

```txt
hobbit-seg00-d10m-mtiny-en-wt0.vtt
│      │    │    │       │   │
│      │    │    │       │   └── Word timestamps (wt0=off, wt1=on)
│      │    │    │       └── Model (dots → dashes)
│      │    │    └── Duration label prefix
│      │    └── Duration label
│      └── Segment number
└── Input base name
```

- Model-specific and word-timestamp-specific
- Lifetime: Permanent

---

## File Structure

### Current State (Post-V5)

- **Core implementation:** ~1950 lines (lib/\*.ts)
- **Tests:** ~371 lines
- **CLI entry:** 196 lines (whisper.ts)
- **Total:** ~2520 lines

```txt
apps/whisper/
├── whisper.ts           # CLI entry point (196 lines)
├── lib/
│   ├── runners.ts       # Pipeline orchestration (399 lines)
│   ├── task.ts          # Task abstraction + factories (521 lines)
│   ├── vtt.ts           # VTT parsing/writing (374 lines)
│   ├── vtt-stitch.ts    # Multi-segment concatenation (227 lines)
│   ├── segmentation.ts  # Segment geometry (107 lines)
│   ├── cache.ts         # WAV/VTT caching (37 lines)
│   ├── audio.ts         # ffprobe duration check (48 lines)
│   ├── duration.ts      # Time parsing/formatting (85 lines)
│   ├── progress.ts      # Progress reporting (84 lines)
│   ├── preflight.ts     # Dependency checks (49 lines)
│   └── simpler.ts       # Prototype: simplified segmentation (22 lines)
└── scripts/
    ├── demo/demo.sh     # End-to-end demo
    └── benchmarks/      # Performance testing
```

---

## Design Decisions & Constraints

### Locked Decisions (Hard Constraints)

- **37-hour segment limit**
  - Constraint: WAV format (RIFF) has a 32-bit size limit
  - Calculation: 4GB / (16000 Hz × 2 bytes × 1 channel) ≈ 37 hours
  - This is a hard format limit, not arbitrary

- **Sequential execution**
  - WAV conversion and transcription run one segment at a time
  - Reason: memory usage (whisper.cpp can use significant RAM)

- **Caching strategy**
  - WAV and VTT caches use different keys
  - WAV cache entries are reusable across models; VTT cache entries are
    model-specific
  - Cache is permanent (lifecycle should be addressed) with cleanup criteria

- **VTT output format**
  - Output is always `.vtt` (not `.srt` or other subtitle formats)
  - Metadata is recorded in `NOTE Provenance` `.vtt`blocks with embeded `.json`

- **Final stitching pass**
  - `stitchSegments(...)` is always called after transcription tasks complete

### Flexible Areas (Open to Change)

- **Task abstraction boundaries**
  - Current: `task.ts` mixes task models, process execution, and monitor
    behavior
  - Goal: separate core task data from process/monitor plumbing where possible

- **Interface/type surface area**
  - Current: 24 interface/type declarations across 5 core files (23 exported)
  - This is a code smell for potential over-abstraction
  - Open question: which types are true boundaries vs internal complexity
