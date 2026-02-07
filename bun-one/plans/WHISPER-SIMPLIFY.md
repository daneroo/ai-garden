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

- [ ] Flatten Task interface to pure data (remove describe/execute, add elapsedMs)
- [ ] Create executeTask(task, config): Promise<Task> - pattern match, immutable
- [ ] Simplify RunResult.tasks from Array<{task, result?}> to Task[]
- [ ] Update runners.ts: build tasks, execute, store results
- [ ] Update whisper.ts: read task.elapsedMs directly (no .result wrapper)
- [ ] Update all tests to work with new structure

Refinements:

- [ ] Smart dry-run: read cached VTT provenance for timing estimates
- [ ] Cleanup: remove unused types, simplify interfaces

## Unplanned Work

These turn into subsequent phases, insode this very document

- Write `.vtt` Provenance metadata as part of transcribe task -> including
  segments
- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to new`lib/exec.ts`
- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
- Second use case: short word/phrase transcription (separate entrypoint)
- Metadata flow improvement (segments write own provenance)
- Integrate markdownlint into ci - `bunx markdownlint-cli --version`
