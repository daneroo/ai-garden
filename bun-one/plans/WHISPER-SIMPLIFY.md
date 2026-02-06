# Whisper Simplify or Rewrite Plan

Follows [WHISPER-TASK-REFACTOR-v5-PLAN.md](./WHISPER-TASK-REFACTOR-v5-PLAN.md)
and earlier plans

I want to simplify drastically the code for this cli

## Goal

Our goal is to simplify this sub-project (`bon-one/apps/whisper/`)

KISS: no rewrites, just incremental work

## Implementation Plan

Before checking any box: `bun run ci` must pass.

### Phase 1 - restore clean state of `<repo>/bun-one/apps/whisper`

- [x] remove all of whispernu.ts libnu, and testnu

### Phase 2 - Augment testing

- [x] Add e2e tests gated by RUN_E2E_TESTS env var (skipIf pattern)
- [x] Review and reorganize tests (*.test.ts convention, unit tests in lib/)

### Phase 3 - Add --no-cache flag

- [ ] Add --cache boolean flag to CLI (default: true, yargs gives --no-cache free)
- [ ] Add cache: boolean to RunConfig interface
- [ ] Pass config.cache to task factories
- [ ] Update task factories to skip cache when cache=false
- [ ] Add integration test verifying --no-cache bypasses WAV and VTT cache

### Phase 4 - Clean up task result types

Separate build and run phases of task cleaner - where do we actually use
--dry-run?

Also the definition of `export interface RunResult {..}` is a bit of a hint as
to the mess!

- [ ] Review RunResult interface and task result flow
- [ ] Simplify task result types (keeping dry-run support)
- [ ] Details TBD before execution

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
