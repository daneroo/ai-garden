# Whisper Task Refactor Plan - V5: Consolidate and Clarify

Follows [WHISPER-TASK-REFACTOR-v4-PLAN.md](./WHISPER-TASK-REFACTOR-v4-PLAN.md)

## Goal

The structure has been simplified (no more `--start`/`--overlap`), but the
**implementation still carries complexity debt**. We need to:

- Inline `segmentation.ts` into `runners.ts` (it's now ~100 lines of trivial
  math)
- Clarify the relationship between `Task`, task factories, and `runTask`
- Remove indirection in segment naming and duration calculation
- Simplify component signatures and data flow
- Reduce the excessive number of interfaces and types

## Core Flow

```
INPUT FILE
    │
    ├──► getAudioDuration()
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  SINGLE SEGMENT (audioDuration <= segmentSec)           │
│  ┌─────────────┐    ┌─────────────┐                    │
│  │  to-wav     │───►│ transcribe  │───► OUTPUT.vtt     │
│  │  (cached)   │    │  (cached)   │                    │
│  └─────────────┘    └─────────────┘                    │
└─────────────────────────────────────────────────────────┘
    │
    ├──► audioDuration > segmentSec ? SPLIT
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  MULTI-SEGMENT (N segments)                             │
│                                                         │
│  ┌─────────┐   ┌─────────┐                             │
│  │seg0-wav │──►│seg0-vtt │                             │
│  │(cached) │   │(cached) │                             │
│  └─────────┘   └────┬────┘                             │
│  ┌─────────┐   ┌─────────┐                             │
│  │seg1-wav │──►│seg1-vtt │                             │
│  │(cached) │   │(cached) │                             │
│  └─────────┘   └────┬────┘                             │
│       ...               ...                             │
│  ┌─────────┐   ┌─────────┐        ┌─────────┐          │
│  │segN-wav │──►│segN-vtt │───────►│  stitch │───► OUT │
│  │(cached) │   │(cached) │        │         │          │
│  └─────────┘   └─────────┘        └─────────┘          │
└─────────────────────────────────────────────────────────┘
```

## Cache Key Formats

**WAV Cache:**

```
hobbit-seg00-d10m.wav
│      │    │    │
│      │    │    └── Extension
│      │    │
│      │    └── Duration label (formatDuration)
│      │        d10m = 10 minutes, d37h = 37 hours
│      │
│      └── Segment number (2 digits, zero-padded)
│          seg00, seg01, ... seg99
│
└── Input base name (basename without extension)
```

- Key: `{basename}.wav`
- Example: `hobbit-seg00-d10m.wav`
- Lifetime: Permanent (reusable across runs/models)
- Hit: copy from cache, skip ffmpeg

**VTT Cache:**

```
hobbit-seg00-d10m-mtiny-en-wt0.vtt
│      │    │    │       │   │
│      │    │    │       │   └── Word timestamps flag
│      │    │    │       │       wt0 = disabled, wt1 = enabled
│      │    │    │       │
│      │    │    │       └── Model shortname (dots → dashes)
│      │    │    │           mtiny-en = "tiny.en"
│      │    │    │           mbase-en = "base.en"
│      │    │    │
│      │    │    └── Duration label prefix (literal "m")
│      │    │
│      │    └── Duration label (formatDuration)
│      │        d10m = 10 minutes
│      │
│      └── Segment number (2 digits, zero-padded)
│
└── Input base name
```

- Key: `{basename}-m{model}-wt{wordTimestamps}.vtt`
- Example: `hobbit-seg00-d10m-mtiny-en-wt0.vtt`
  - `seg00`: segment number (2 digits)
  - `d10m`: duration in human format (10m = 10 minutes)
  - `mtiny-en`: model shortname with dots replaced by dashes
  - `wt0`: wordTimestamps flag (0=false, 1=true)
- Hit: copy from cache, skip whisper-cli

## Clarifications

### Naming Convention: buildXX vs createYY

From `task.ts` comments:
- `build*` (high-level): orchestration - loops, branches, returns Task[]
- `create*` (low-level): pure factory - creates one Task from options

Current code only uses `createToWavTask` and `createTranscribeTask` - the `build`
pattern exists as documentation but has no actual `build*` functions yet.

### describe() Usage

`describe()` is **not** just for dry-run. It is used in the final output:

```ts
// In RunResult, stored for each task
result.tasks = tasks.map((t) => ({
  task: { label: t.label, describe: t.describe() },
  result: { elapsedMs: taskResult.elapsedMs }
}));
```

The describe string appears in the final JSON/pretty output showing what was
executed.

### runTask

`runTask()` is used by all task types to spawn processes and handle
logging/monitoring. Keep it for now - it is the shared spawn infrastructure.

### Duration Calculation Complexity

Current implementation in `runners.ts` (lines 208-230):

```ts
let endSegIndex = segments.length - 1;
if (config.durationSec > 0) {
  const idx = segments.findIndex(
    (seg) => seg.startSec < config.durationSec && config.durationSec <= seg.endSec,
  );
  if (idx !== -1) {
    endSegIndex = idx;
  }
}

const getDurationMsForSegment = (segIndex: number): number => {
  if (config.durationSec <= 0) return 0;      // 0 = full WAV
  if (segIndex < endSegIndex) return 0;       // Before end segment: full
  if (segIndex > endSegIndex) return -1;      // After end segment: SKIP (sentinel!)
  // End segment: partial duration
  const seg = segments[segIndex]!;
  const localDurationSec = config.durationSec - seg.startSec;
  return localDurationSec * 1000;
};

// Used with map + filter pattern
const transcribeTasks = segments
  .map((_, i) => {
    const durationMs = getDurationMsForSegment(i);
    if (durationMs === -1) return null;       // Skip this segment
    // ... create task
  })
  .filter((t): t is NonNullable<typeof t> => t !== null);
```

Problems:
- `-1` sentinel value for "skip" is unclear
- Closure over `endSegIndex` and `config` adds indirection
- Two-phase process (map then filter) instead of upfront filtering

## Problems to Solve

### 1. Segmentation module is overkill

`segmentation.ts` is now ~100 lines of simple math that could be ~30 lines
inline.

### 2. Too many interfaces and types

Current exported interfaces/types by file:

**runners.ts (4):** `RunConfig`, `RunDeps`, `RunResult`, `Segment`
**task.ts (9):** `Task`, `TaskKind`, `TaskConfig`, `TaskEvent`, `TaskMonitor`,
`TaskResult`, `RunTaskResult`, `ToWavTaskOptions`, `TranscribeTaskOptions`
**progress.ts (2):** `ProgressReporter`, `ProgressConfig` - **KEEP**
**vtt.ts (6):** `VttCue`, `VttFile`, `VttSummary`, `VttHeaderProvenance`,
`VttSegmentProvenance`, `VttProvenance`
**vtt-stitch.ts (2):** `SegmentCueBoundary`, `SegmentVttInfo`

Total: 23 interfaces/types across 5 files.

**Target:** Reduce to ~10 essential types.

### 3. Task abstraction boundaries are blurry

- `createToWavTask()` returns a `Task` with `describe()` and `execute()`
- `Task.execute()` calls `runTask()` which does the actual spawn
- Cache logic duplicated in both task factories

### 4. Duration calculation uses sentinel values

See "Duration Calculation Complexity" section above.

### 5. Pre-built task arrays add indirection

Building `wavTasks` and `transcribeTasks` arrays, then executing, adds
complexity for sequential work.

## Phase 1: Inline Segmentation

**Current:** Segmentation is split across `segmentation.ts` with helpers.

**Proposed:** Inline into `runners.ts` with minimal `Segment` interface.

Two options for `Segment` interface:

**Option A - Geometry Only (Minimal):**
```ts
interface Segment {
  startSec: number;
  endSec: number;
}
// Paths computed inline: `${inputName}-seg${i}-${formatDuration(segSec)}`
```

**Option B - Enriched (Convenient):**
```ts
interface Segment {
  index: number;
  startSec: number;
  endSec: number;
  basename: string;        // e.g., "hobbit-seg00-d10m"
  // Optionally pre-computed paths:
  // wavPath: string;
  // vttPath: string;
}
```

**Implementation:**
```ts
// Inline in runners.ts - ~25 lines
function computeSegments(
  audioDuration: number,
  segmentSec: number,
  maxSegmentSec: number,
  inputName: string,
): Segment[] {
  const effectiveSegSec = segmentSec > 0
    ? segmentSec
    : (audioDuration > maxSegmentSec ? maxSegmentSec : audioDuration);

  const count = Math.max(1, Math.ceil(audioDuration / effectiveSegSec));

  return Array.from({ length: count }, (_, i) => {
    const startSec = i * effectiveSegSec;
    const endSec = i === count - 1
      ? audioDuration
      : Math.min((i + 1) * effectiveSegSec, audioDuration);
    const suffix = `-seg${String(i).padStart(2, "0")}-d${formatDuration(effectiveSegSec)}`;
    return { index: i, startSec, endSec, basename: `${inputName}${suffix}` };
  });
}
```

**Changes:**
- Move `computeSegments()` to `runners.ts`
- Inline `resolveSegmentSec()` logic
- Inline `getSegmentSuffix()` and `getSegmentDurationLabel()` logic
- Move `formatDuration()` to `duration.ts` or inline simple version
- Delete `segmentation.ts` and `segmentation_test.ts`
- Move relevant tests to `runners_test.ts`
- Reduce `Segment` interface to essential fields only

**Checkpoint:**
- `bun run ci` passes
- `./scripts/demo/demo.sh` passes
- Commit

## Phase 2: Simplify Task Structure

**Current problem:** Task interface with `describe()` and `execute()` adds layer
of indirection.

**Constraint:** `describe()` must remain - it is used in final RunResult output.

**Proposed:** Direct async functions that return both result and description:

```ts
// In task.ts - simplified API
export interface ConvertResult {
  outputPath: string;
  elapsedMs: number;
  fromCache: boolean;
  description: string;  // For RunResult.tasks[i].task.describe
}

export async function convertToWav(
  inputPath: string,
  segment: Segment,
  outputPath: string,
  reporter: ProgressReporter,
): Promise<ConvertResult>

export async function transcribeSegment(
  wavPath: string,
  segment: Segment,
  config: TranscribeConfig,
  outputPath: string,
  reporter: ProgressReporter,
): Promise<ConvertResult>
```

Each function:
1. Computes description string
2. Checks cache
3. If hit: copies to outputPath
4. If miss: runs process with progress updates via reporter
5. Saves to cache
6. Returns result with description

**Changes to `task.ts`:**
- Remove `Task` interface (replaced by direct functions)
- Remove `TaskKind` type
- Remove `TaskConfig` interface (inline into runTask)
- Remove `TaskResult` interface (use `ConvertResult`)
- Keep `TaskEvent` and `TaskMonitor` (monitor/reporter design stays)
- Keep `RunTaskResult` (internal to runTask)
- Remove `ToWavTaskOptions` and `TranscribeTaskOptions` (use direct params)
- Replace `createToWavTask()` with `convertToWav()`
- Replace `createTranscribeTask()` with `transcribeSegment()`

**Changes to `runners.ts`:**
- Build segments array
- For dry-run: print what would happen
- For execute: await each conversion/transcription directly
- Build `RunResult.tasks` array from function results

Before:
```ts
const wavTasks = segments.map(seg => createToWavTask({...}));
const transcribeTasks = segments.map(seg => createTranscribeTask({...}));
const tasks = [...wavTasks, ...transcribeTasks];
// Dry-run
for (const task of tasks) console.log(task.describe());
// Execute
for (const task of tasks) {
  const result = await task.execute();
  resultTasks.push({ task: { label: task.label, describe: task.describe() }, result });
}
```

After:
```ts
// Dry-run: just print
for (const seg of segments) {
  console.log(`Would convert: ${config.input} [${seg.startSec}-${seg.endSec}] → ${seg.basename}.wav`);
  console.log(`Would transcribe: ${seg.basename}.wav → ${seg.basename}.vtt`);
}

// Execute: direct calls
const resultTasks = [];
for (const seg of segments) {
  const wavResult = await convertToWav(config.input, seg, wavOutputPath, reporter);
  resultTasks.push({
    task: { label: `to-wav[${seg.index}]`, describe: wavResult.description },
    result: { elapsedMs: wavResult.elapsedMs }
  });

  const vttResult = await transcribeSegment(wavResult.outputPath, seg, transConfig, vttOutputPath, reporter);
  resultTasks.push({
    task: { label: `transcribe[${seg.index}]`, describe: vttResult.description },
    result: { elapsedMs: vttResult.elapsedMs }
  });
}
```

**Checkpoint:**
- `bun run ci` passes
- `./scripts/demo/demo.sh` passes
- Commit

## Phase 3: Clarify Duration Handling

**Current:** `getDurationMsForSegment()` with -1 sentinel value.

**Proposed:** Filter segments before processing:

```ts
// In runners.ts - clear filtering
const segments = computeSegments(
  audioDuration,
  config.segmentSec,
  MAX_WAV_DURATION_SEC,
  inputName,
);

// Apply --duration limit: only process segments within duration window
const activeSegments = config.durationSec > 0
  ? segments.filter((s) => s.startSec < config.durationSec)
  : segments;

// Each segment knows its own transcribe duration
for (const seg of activeSegments) {
  const transcribeDurationMs = config.durationSec > 0
    ? Math.max(0, Math.min(seg.endSec, config.durationSec) - seg.startSec) * 1000
    : 0; // 0 = full segment

  await transcribeSegment(
    wavPath,
    seg,
    { ...config, durationMs: transcribeDurationMs },
    vttPath,
    reporter,
  );
}
```

**Changes:**
- Remove `getDurationMsForSegment()` closure with sentinel
- Filter `activeSegments` array upfront
- Calculate `durationMs` inline when calling transcribe
- No more -1 sentinel, no more two-phase map+filter

**Checkpoint:**
- `bun run ci` passes
- `./scripts/demo/demo.sh` passes
- Commit

## Phase 4: Unify Cache Logic

**Current:** Cache check/copy/save duplicated in both task factories.

**Proposed:** Shared cache wrapper:

```ts
// In cache.ts
export async function withCache<T>(
  cachePath: string,
  outputPath: string,
  compute: () => Promise<T>,
): Promise<{ result: T; fromCache: boolean }>

// Usage in task.ts
export async function convertToWav(...) {
  const cachePath = getWavCachePath(segment.basename);

  const { fromCache } = await withCache(cachePath, outputPath, async () => {
    // Run ffmpeg
    await runFfmpeg(inputPath, segment, outputPath, reporter);
  });

  return {
    outputPath,
    fromCache,
    elapsedMs: Date.now() - start,
    description: `ffmpeg: ${inputPath} → ${outputPath}`
  };
}
```

**Changes:**
- Add `withCache()` utility to `cache.ts`
- Use in both `convertToWav()` and `transcribeSegment()`
- Remove duplicate cache logic from task functions

**Checkpoint:**
- `bun run ci` passes
- `./scripts/demo/demo.sh` passes
- Commit

## Phase 5: Simplify VTT Types (Optional)

**Current:** `VttHeaderProvenance` / `VttSegmentProvenance` discriminated union
with type guards.

**Proposed:** Single `Provenance` type with optional fields:

```ts
// Replace 3 types with 1
type Provenance = {
  input: string;
  model?: string;
  generated?: string;
  segment?: number;
  startSec?: number;
  [key: string]: unknown;
};
```

Or keep as-is if type safety is valuable for external consumers.

**Checkpoint:**
- `bun run ci` passes
- `./scripts/demo/demo.sh` passes
- Commit

## Expected Results

### Interface Reduction

| File | Before (v4) | After (v5) |
|------|-------------|------------|
| segmentation.ts | 3 interfaces | **deleted** |
| task.ts | 9 interfaces/types | 3-4 types |
| runners.ts | 4 interfaces | 2-3 interfaces |
| vtt.ts | 6 interfaces/types | 1-6 (optional) |
| **Total** | **~22** | **~10** |

### Simplified Signatures

| Component | Before (v4) | After (v5) |
|-----------|-------------|------------|
| Segment creation | `computeSegments()` + helpers | Single inline function |
| Segment type | `{startSec, endSec}` + helpers | Rich `Segment` with basename |
| Conversion | `createToWavTask(opts).execute()` | `convertToWav(input, seg, out, reporter)` |
| Transcription | `createTranscribeTask(opts).execute()` | `transcribeSegment(wav, seg, cfg, out, reporter)` |
| Duration handling | Closure with -1 sentinel | Filter + inline calculation |
| Cache logic | Duplicated in 2 places | Shared `withCache()` wrapper |

### Data Flow Clarity

**Current (v4):** Two-phase execution

```
runWhisper(config)
  ├──► getAudioDuration() ──► duration
  ├──► computeSegments() ──► Segment[]
  ├──► BUILD Phase: construct Task[] DAG
  │      ├──► wavTasks = segments.map(createToWavTask)
  │      ├──► transcribeTasks = segments.map(createTranscribeTask)
  │      └──► tasks = [...wavTasks, ...transcribeTasks]
  │
  ├──► (dry-run) tasks.map(t => t.describe())
  │
  └──► EXECUTE Phase:
         └──► for each task in tasks:
                ├──► task.execute()
                │      └──► (cache check → spawn → cache save)
                └──► collect result
         └──► if multi-segment: stitch()
```

**Target (v5):** Simplified direct execution

```
runWhisper(config)
  ├──► getAudioDuration() ──► duration
  ├──► computeSegments() ──► Segment[]
  ├──► (dry-run) print planned operations
  └──► (execute)
         ├──► for each active segment:
         │      ├──► convertToWav() ──► ConvertResult
         │      │      └──► (cache check → ffmpeg → cache save)
         │      └──► transcribeSegment() ──► ConvertResult
         │             └──► (cache check → whisper → cache save)
         └──► if multi-segment: stitch()
```

**Note:** v4 builds a Task[] data structure (linear DAG) then executes it.
v5 removes the intermediate Task construction and executes directly.

## Invariant (every phase)

After each phase, before moving on:
- `bun run ci` passes (lint, fmt, check, test)
- `bun run fmt` if needed
- Clean cache/work test passes:
  - `rm -rf data/work/ data/cache/ ; ./scripts/demo/demo.sh`
- Commit the phase

---

## Deferred (not in this plan)

- Consider re-adding `--start` (doubtful)
- Make stitch a proper Task (uniform task list: N*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to `lib/spawn.ts`
- Artifact directory reorganization
- Second use case: short word/phrase transcription (separate entrypoint)
- Metadata flow improvement (segments write own provenance)
