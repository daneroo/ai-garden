# Whisper Simplify or Rewrite Plan

Follows [WHISPER-TASK-REFACTOR-v5-PLAN.md](./WHISPER-TASK-REFACTOR-v5-PLAN.md)
and earlier plans

I want to simplify drastically the code for this cli

## Goal

Our goal is to simplify this sub-project (`bon-one/apps/whisper/`)

KISS: no rewrites, just incremental work

## Implementation Plan

- Before checking any box: `bun run ci` must pass.
- Before committing a phase: User reviews changes.

### Phase 1 - restore clean state of `<repo>/bun-one/apps/whisper`

- [x] remove all of whispernu.ts libnu, and testnu

### Phase 2 - Augment testing

- [x] Add e2e tests gated by RUN_E2E_TESTS env var (skipIf pattern)
- [x] Review and reorganize tests (\*.test.ts convention, unit tests in lib/)

### Phase 3 - Add --no-cache flag

- [x] Add --cache boolean flag to CLI (default: true, yargs gives --no-cache
      free)
- [x] Add cache: boolean to RunConfig interface
- [x] Pass config.cache to task factories
- [x] Update task factories to skip cache when cache=false
- [x] Add integration test verifying --no-cache bypasses WAV and VTT cache

### Phase 4 - Clean up task result types (functional refactor)

Move from OOP (objects with methods) to functional (data + pure functions).

Goal: Task is just data. Functions transform tasks. Task in → Task out.

Core refactor (done together as one cohesive change):

- [x] Flatten Task interface to pure data (remove describe/execute, add elapsedMs)
- [x] Create executeTask(task, reporter): Promise<Task> - pattern match, immutable
- [x] Simplify RunResult.tasks from Array<{task, result?}> to Task[]
- [x] Update runners.ts: build tasks, execute, store results
- [x] Update whisper.ts: read task.elapsedMs directly (no .result wrapper)
- [x] Update all tests to work with new structure

### Phase 5 - Per-segment VTT provenance

Currently provenance is only written at stitch time (runners.ts). This
phase moves per-segment provenance into executeTranscribe, where we have
the actual execution context, then cleans up stitch to use it.

Step 1: executeTranscribe writes provenance into each segment VTT

After whisper-cli writes the VTT, executeTranscribe re-opens it and
injects a NOTE Provenance block with fields available on TranscribeTask:

- `input`: basename(task.wavPath) — always
- `model`: task.model (short name, e.g., "tiny.en") — always
- `wordTimestamps`: task.wordTimestamps (boolean) — always
- `durationMs`: task.durationMs — only when > 0 (partial segment)
- `elapsedMs`: measured execution time — always
- `generated`: ISO timestamp — always

NOT available to executeTranscribe (stays in stitch):

- `startSec` — segment offset in original audio
- `segment` — segment index

- [x] Add provenance injection to executeTranscribe (read VTT, prepend
      NOTE Provenance, write back)
- [x] Add elapsedMs to VttHeaderProvenance type (and parser)
- [x] Unit test: provenance round-trip (write + parse back)

Step 2: Clean up stitchSegments roll-up

Stitch currently constructs segment provenance from scratch using runner
context. After step 1, each segment VTT already has provenance. Stitch
should read it and merge with the fields only it knows (startSec,
segment index).

- [x] stitchSegments reads provenance from individual VTT files
- [x] Header provenance includes wordTimestamps from config
- [x] Segment provenance merges executeTranscribe fields (drops generated)
- [x] Verify: segment provenance in final VTT includes all fields
      (from executeTranscribe + startSec/segment from stitch)

Step 3: Smart dry-run (POC for cached provenance)

When dry-run + cache enabled, read cached VTT provenance to populate
elapsedMs on the task — showing estimated timings without executing.

- [ ] In task building: if cache enabled and cached VTT exists, read
      provenance elapsedMs into the task
- [ ] dry-run output shows cached timing estimates

## Unplanned Work

These turn into subsequent phases, inside this very document

- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to new `lib/exec.ts`
- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
- Second use case: short word/phrase transcription (separate entrypoint)
- Integrate markdownlint into ci - `bunx markdownlint-cli --version`
- Clean up stale/legacy `startSec` references (on VttHeaderProvenance, etc.)
  - Segment provenance always has `startSec: 0` for single-segment runs,
    which is noise. Investigate whether startSec belongs in segment
    provenance at all, or only when segments > 1.
