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

## Unplanned Work

These turn into subsequent phases, insode this very document

- remove of make caching optional
- Write `.vtt` Provenance metadata as part of transcribe task -> including
  segments
- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to new`lib/exec.ts`
- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
- Second use case: short word/phrase transcription (separate entrypoint)
- Metadata flow improvement (segments write own provenance)
- Integrate markdownlint into ci - `bunx markdownlint-cli --version`
