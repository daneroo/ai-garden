# Whisper Task Refactor Plan

This refers to the follow up to
[WHISPER-VTT-HEADERS-PLAN.md](./WHISPER-VTT-HEADERS-PLAN.md)

Let's refine the plan to

- make it more precise for implementation
- divide it into separable phases
  - after each phase we should still have a completely working and tested repo (
    probably commit the intermediate work)
- The plans should be divided into Phases, that define precisely what needs to
  be done in that phase. Reference to specific modules. functions , types, etc.
- Each phase should be small enough to be implemented in a single sitting.
- When the plan seems ready, we will create a task list: with (possibly nested)
  items in a an unnumber list with checkboxes
  `- [ ] item: succint description of the task`

## Deferred Follow-ups

- Make the next plan - smaller - or have committable phases
- Optional `digest` field (sha256 of source input) for stronger provenance
  identity and future cache-key validation.
- Optional `processingTimeSec` / `elapsedMs` in segment provenance to preserve
  performance metrics across cache hits and improve benchmark interpretation.
- Reorganize artifact directory configuration (`output`, `work`, `cache`) with a
  clear per-input namespace strategy to support discovery and cleanup.
- Define explicit cache consistency policy by caller/use-case (especially
  benchmarks):
  - benchmark mode may disable cache reads entirely (`checkCache: () => false`)
  - or benchmark mode may allow cache but report cache-hit ratio separately
- Refactor `Task` / `TaskConfig` to support non-shell task implementations and
  stronger typed task results.
- Provenance-aware cache validation (deferred until segment-level VTT
  transcription tasks emit provenance before `cache-vtt`; current v1 only adds
  provenance at final stitching)
- Preservation/merge rules for non-provenance `NOTE` blocks during stitch (e.g.,
  preserve first occurrence, merge, or drop with warning).

Let's turn this into an actionable plan

## Current Entities (for context)

Understanding the current architecture before proposing changes:

### Flow

```txt
whisper.ts:main()
  └─> runners.ts:runWhisper(config)
        ├─> Build task array (DAG - currently ordered list)
        │     ├─> buildWavTasks() → TaskConfig[]
        │     └─> buildTranscribeTasks() → TaskConfig[]
        │
        ├─> [if dryRun: return early with unexecuted tasks]
        │
        └─> Execute tasks sequentially
              └─> task.ts:runTask(taskConfig) → TaskResult
                    └─> spawn(command, args) + monitor events
```

### Key Types (lib/task.ts)

```ts
// Current: Shell-specific task configuration
interface TaskConfig {
  label: string;
  command: string; // ← shell command
  args: string[]; // ← shell args
  stdoutLogPath: string; // ← assumes stdout capture
  stderrLogPath: string; // ← assumes stderr capture
  monitor: TaskMonitor;
}

interface TaskResult {
  code: number; // ← exit code (shell-specific)
  elapsedMs: number;
}

interface TaskMonitor {
  onEvent(event: TaskEvent): void;
}
```

### Problems Identified

- TaskConfig is tightly coupled to shell spawning
- `dryRun` affects task building (short-circuits with cache-like tasks), should
  affect execution only
- `checkCache` affects task building (swaps ffmpeg for cp), should affect
  execution
- Simple tasks (cp) inherit full monitoring infrastructure (log files for cp
  stdout/stderr)
- No way to represent non-shell work (e.g., in-memory VTT stitch)

### Design Goals (from user)

- Task representation should not be shell-specific
- dry-run should be an execution effect, not construction effect
- Discover a simple "interface" contract for Task

---

## Proposed Design: Generic Task Interface

The idea: separate the _what_ (task description) from the _how_ (execution).

### Core Interface

```ts
// Generic result - returned on SUCCESS only
// Failure = throw (current behavior: non-zero exit throws with message)
interface TaskResult {
  elapsedMs: number;
  // Note: on cache hit, elapsedMs could be populated from cached artifact's
  // provenance metadata (e.g., original processing time stored in VTT header)
}

// Known task kinds - only "real work" tasks
// (copy operations are internal to caching wrapper, not separate tasks)
type TaskKind = "to-wav" | "transcribe" | "stitch";

// The minimal contract for any task
interface Task {
  kind: TaskKind; // Discriminator for filtering/narrowing
  label: string;

  // Pure: may be called many times (dry-run, logging, inspection)
  describe(): string;

  // Side-effecting: called exactly once during execution
  execute(ctx: TaskContext): Promise<TaskResult>;
}

// Context passed to execute() - provides shared services
interface TaskContext {
  reporter: ProgressReporter;
  dryRun: boolean; // Task can check this and skip real work
  workDir: string; // For log files, temp files
}
```

### Usage: Filtering by Kind

```ts
// Filter tasks for inspection/testing
const transcribeTasks = tasks.filter((t) => t.kind === "transcribe");

// Type narrowing works with discriminated unions
function handleTask(task: Task) {
  if (task.kind === "wav-conversion") {
    // TypeScript knows task is WavConversionTask here
  }
}
```

### Naming Convention: build vs create

Two levels of function naming to distinguish orchestration from construction:

- `build*` (high-level): orchestration - loops, branches, checks cache, returns
  `Task[]`
  - Example: `buildWavTasks(ctx)`
- `create*` (low-level): pure factory - creates one `Task` from options
  - Example: `createToWavTask(opts)`

```ts
// buildWavTasks always builds the same structure
// cache behavior is handled at execute() time, not build time
function buildWavTasks(ctx: SegmentContext): Task[] {
  return [createToWavTask({ label, inputPath, outputPath, cachePath, ... })];
}

// Caching logic lives inside execute(), could also be a wrapper
// - check cache before work
// - save to cache after work
```

### Task Implementations (concrete factories)

```ts
// to-wav task (ffmpeg)
function createToWavTask(opts: {
  label: string;
  inputPath: string;
  outputPath: string;
  startSec: number;
  durationSec: number;
  monitor: TaskMonitor;
}): Task {
  return {
    kind: "to-wav",
    label: opts.label,
    describe: () => `ffmpeg: ${opts.inputPath} → ${opts.outputPath}`,
    execute: async (ctx) => {
      if (ctx.dryRun) return { elapsedMs: 0 };
      const args = ["-y", "-i", opts.inputPath, "-ss", ...];
      // spawn ffmpeg, monitor events, log capture
    },
  };
}

// transcribe task (whisper-cli)
function createTranscribeTask(opts: {
  label: string;
  wavPath: string;
  outputPrefix: string;
  model: string;
  threads: number;
  monitor: TaskMonitor;
}): Task {
  return {
    kind: "transcribe",
    label: opts.label,
    describe: () => `whisper: ${opts.wavPath} (model=${opts.model})`,
    execute: async (ctx) => {
      if (ctx.dryRun) return { elapsedMs: 0 };
      // spawn whisper-cli, monitor events, log capture
    },
  };
}
```

### What Changes

| Before                                   | After                            |
| ---------------------------------------- | -------------------------------- |
| `buildWavTasks()` returns `TaskConfig[]` | Returns `Task[]`                 |
| `checkCache` affects which TaskConfig    | Task.execute() checks cache      |
| dryRun short-circuits in runner          | Task.execute() checks ctx.dryRun |
| `runTask(config)`                        | `task.execute(ctx)`              |

### What Stays

- TaskMonitor pattern (used by SpawnTask)
- ProgressReporter pattern (injected via TaskContext)
- buildWavTasks / buildTranscribeTasks structure
- Sequential execution loop (can evolve to DAG later)

---

## Acceptance Criteria

Global criteria for the refactor to be considered complete:

- `bun run ci` passes (all tests pass, no lint errors)
- `./scripts/demo/demo.sh` runs as expected from `apps/whisper`:
  - Full run completes successfully
  - Segmented run completes successfully
  - Overlap guard fails as expected
- Existing test coverage preserved or improved

---

## Implementation Phases

Each phase should leave the repo in a passing state (`bun run ci`).

### Phase 1: Define Task Interface and Types

Introduce the new types without changing execution behavior.

Files to modify:

- `lib/task.ts`: Add `Task`, `TaskResult`, `TaskContext`, `TaskKind` types
- Keep existing `TaskConfig` and `runTask` working

Acceptance:

- `bun run ci` passes
- No functional changes yet

### Phase 2: Create Factory Functions

Add `createToWavTask` and `createTranscribeTask` factories that return `Task`
objects.

Files to modify:

- `lib/task.ts`: Add factory functions
- Factories wrap existing spawn logic inside `execute()`

Acceptance:

- `bun run ci` passes
- Factories can be called but aren't used yet

### Phase 3: Migrate buildWavTasks / buildTranscribeTasks

Update `runners.ts` to return `Task[]` instead of `TaskConfig[]`.

Files to modify:

- `lib/runners.ts`: Update `buildWavTasks`, `buildTranscribeTasks` to use
  factories
- Update `runWhisper` to call `task.execute(ctx)` instead of `runTask(config)`

Acceptance:

- `bun run ci` passes
- `./scripts/demo/demo.sh` passes
- Cache behavior still works (now at execute-time)

### Phase 4: Move dryRun to Execute-Time

Remove dryRun logic from runner, move into `execute()`.

Files to modify:

- `lib/runners.ts`: Remove dryRun short-circuit from task building
- Factory `execute()` checks `ctx.dryRun`

Acceptance:

- `bun run ci` passes
- `bun run whisper.ts --dry-run` still works
- Live runs still work

### Phase 5: Cleanup and Remove Old Types

Remove deprecated types and update tests.

Files to modify:

- `lib/task.ts`: Remove old `TaskConfig` if no longer needed
- `lib/runners_test.ts`: Update tests to use new `Task` interface
- `lib/task_test.ts`: Update tests

Acceptance:

- `bun run ci` passes
- All tests updated to new interface

---

## Task Checklist

Checking off a box means: CI passes (`bun run ci`) and reviewed by user.

- [ ] Phase 1: Define Task interface and types
- [ ] Phase 2: Create factory functions
- [ ] Phase 3: Migrate buildWavTasks / buildTranscribeTasks
- [ ] Phase 4: Move dryRun to execute-time
- [ ] Phase 5: Cleanup and remove old types
- [ ] Final: `./scripts/demo/demo.sh` passes

---

## Deferred to Future Plans

Not addressed in this refactor:

- VTT provenance metadata in segment transcription tasks (can be Phase 2 of a
  follow-up)
- digest field (sha256 provenance)
- processingTimeSec in segment provenance
- Artifact directory reorganization
- Cache consistency policy for benchmarks
- Provenance-aware cache validation
- NOTE block preservation during stitch
