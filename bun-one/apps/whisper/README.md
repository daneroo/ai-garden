# Whisper CLI

Audio transcription tool using whisper.cpp with automatic segmentation for long
files.

## Usage

```bash
# Navigate to (this) whisper directory
cd bun-one/apps/whisper

## Run from workspaces root (../.. == bun-one/)
# CI (format + lint + check + test)
bun run ci
# to fix any formatting errors
bun run fmt

# Help and options
bun run whisper.ts -h

# Demo script (full + segmented runs)
./scripts/demo/demo.sh
## which some of these below
# Basic transcription (uses cache)
bun run whisper.ts -i data/samples/hobbit-30m.m4b -m tiny.en --tag demo-basic
bun run whisper.ts -i data/samples/hobbit-30m.m4b --segment 10m -m tiny.en --tag demo-seg-10m

# Clean cache test
rm -rf data/work/ data/cache/
./scripts/demo/demo.sh

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

### Two Cases

Given `segmentSec` (default = 37h = MAX_WAV_DURATION_SEC):

1. **Single segment:** `audioDuration <= segmentSec`
   - 1 to-wav task
   - 1 transcribe task
   - No stitching needed

2. **Multi-segment:** `audioDuration > segmentSec`
   - N to-wav tasks (one per segment)
   - N transcribe tasks (filtered by --duration if specified)
   - 1 stitch task (concatenate VTT files)

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

1. **37-hour segment limit**
   - Constraint: WAV format (RIFF) has 32-bit size limit
   - Calculation: 4GB / (16000 Hz × 2 bytes × 1 channel) ≈ 37 hours
   - This is a hard format limit, not arbitrary

2. **Sequential execution**
   - WAV conversion and transcription run one segment at a time
   - Reason: Memory usage (whisper.cpp can use significant RAM)
   - Future: Could parallelize WAV conversion while keeping transcribe
     sequential

3. **Caching strategy**
   - WAV and VTT cached separately by different keys
   - WAV reusable across models, VTT is model-specific
   - Cache is permanent (never auto-expires - lifecycle should be addressed)

4. **VTT output format**
   - Always produces .vtt files (not .srt or other formats)
   - Contains our convention os metadata in `NOTE Provenance` blocks
   - Human-readable, standard format

### Flexible Areas (Open to Change)

1. **Task abstraction**
   - Current: Task interface with describe() + execute()
   - Question: Is this helping or adding indirection?

2. **Segment representation**
   - Current: `{startSec, endSec}` interface + helpers
   - Question: Minimal geometry vs enriched object?

3. **Duration filtering**
   - Current: endSegIndex, -1 sentinel, map+filter
   - Question: Is this clear enough?

4. **Interface/type count**
   - IMPORTANT! This is clearly a problem in the current implementation
   - Current: ~22 interfaces across 5 files
   - Question: Which types add clarity vs complexity?

---

## Analysis: What's Working vs Pain Points

**This section is for user feedback to guide next steps**

### What's Working Well

**USER FEEDBACK AREA:**

Example areas to consider:

- Caching system?
- Two-case model (single vs multi-segment)?
- VTT stitching logic?
- Progress reporting?
- Test coverage?

```
[Add your notes here]
```

---

### Pain Points

**USER FEEDBACK AREA:**

Example areas to consider:

- Too many abstractions?
- Unclear data flow?
- Segment computation complexity?
- Test maintenance burden?
- File organization?

```
[Add your notes here]
```

---

## Prototype: Simplified Direction

### Example: lib/simpler.ts (22 lines)

This prototype shows a simplified approach to segmentation:

```typescript
export function segment(audioDurationSec: number, segmentSec: number) {
  const segmentCount =
    segmentSec > 0 ? Math.ceil(audioDurationSec / segmentSec) : 1;

  const sequence: { i: number; start: number; end: number }[] = Array.from(
    { length: segmentCount },
    (_, i) => ({
      i,
      start: i * segmentSec,
      end: (i + 1) * segmentSec,
    }),
  );

  return sequence;
}
```

**Compare to current segmentation.ts (107 lines):**

- Current: Standalone module, helpers, complex naming
- Prototype: Inline-friendly, minimal, ~5x smaller

**USER FEEDBACK:**

```
[Is this the right direction? What to keep/change?]
```

---

## Code Areas for Detailed Analysis

### 1. Segmentation Module

**Current (lib/segmentation.ts - 107 lines):**

- Functions: `computeSegments()`, `getSegmentSuffix()`, etc.
- Interface: `Segment {startSec, endSec}`
- Tests: 64 lines

**Prototype (lib/simpler.ts - 22 lines):**

- Single function: `segment()`
- Returns: `{i, start, end}[]`
- Tests: 33 lines

**USER FEEDBACK:**

```
[Keep as module or inline? Which approach?]
```

---

### 2. Task Abstraction

**Current (lib/task.ts - 521 lines):**

- Interface: `Task {label, describe(), execute()}`
- Factories: `createToWavTask()`, `createTranscribeTask()`
- Two-phase: Build Task[], then execute
- 9 interfaces/types

**Alternative (from V5 plan):**

- Direct functions: `convertToWav()`, `transcribeSegment()`
- Returns: `{outputPath, elapsedMs, fromCache, description}`
- One-phase: Call directly in loop
- ~3-4 types

**USER FEEDBACK:**

```
[Does Task interface pay for itself?]
```

---

### 3. Duration Handling

**Current approach:**

```typescript
// Find segment containing duration end
let endSegIndex = segments.length - 1;
if (config.durationSec > 0) {
  const idx = segments.findIndex(/*...*/);
  if (idx !== -1) endSegIndex = idx;
}

// Helper with -1 sentinel for "skip"
const getDurationMsForSegment = (segIndex) => {
  if (segIndex > endSegIndex) return -1; // SKIP
  // ...
};

// Map + filter pattern
const tasks = segments.map(/*...*/).filter((t) => t !== null);
```

**USER FEEDBACK:**

```
[Is -1 sentinel clear? Better approach?]
```

---

### 4. Interface Count

**Current: ~22 interfaces across 5 files**

- runners.ts (4): `RunConfig`, `RunDeps`, `RunResult`, `Segment`
- task.ts (9): `Task`, `TaskKind`, `TaskConfig`, `TaskEvent`, `TaskMonitor`,
  `TaskResult`, `RunTaskResult`, `ToWavTaskOptions`, `TranscribeTaskOptions`
- progress.ts (2): `ProgressReporter`, `ProgressConfig`
- vtt.ts (6): `VttCue`, `VttFile`, `VttSummary`, `VttHeaderProvenance`,
  `VttSegmentProvenance`, `VttProvenance`
- vtt-stitch.ts (2): `SegmentCueBoundary`, `SegmentVttInfo`

**USER FEEDBACK:**

```
[Which are essential? Which add noise?]
```

---

## Next Steps

Based on user feedback above:

1. User annotates pain points and working areas
2. Choose transformation strategy (see master plan:
   `plans/WHISPER-SIMPLIFY-OR-REWRITE.md`)
3. Create detailed sub-plan for chosen approach
4. Execute in incremental phases with checkpoints

---

## Dependencies

**Required commands:**

- `ffmpeg` - Audio format conversion
- `ffprobe` - Audio duration detection
- `whisper-cli` - Whisper.cpp CLI

**Whisper models:**

- Location: `$WHISPER_CPP_MODELS/ggml-{model}.bin`
- Supported: tiny.en, base.en, small.en

---

## Deferred Items (From Previous Plans)

Not addressing in immediate next phase:

- Integrate `bunx markdownlint-cli plans/*` into `bun run ci`
- Re-adding `--start` flag (removed in V5, doubtful)
- Making stitch a proper Task
- Extracting `runTask`/monitors to `lib/spawn.ts`
- Artifact directory reorganization
- Short phrase transcription use case
- Segments writing own provenance metadata
