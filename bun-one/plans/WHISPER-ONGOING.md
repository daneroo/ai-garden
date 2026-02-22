# Whisper Ongoing Plan

Follows [WHISPER-SIMPLIFY.md](./WHISPER-SIMPLIFY.md) and earlier plans

I want to keep steady improvements for this cli

## Goal

Track ongoing work for this sub-project (`bon-one/apps/whisper/`)

- Implementation plans have `[ ]` for not started, `[x]` for done
- Before checking any box: `bun run ci` must pass.
- Before committing an issue: User reviews changes.
- We should always identify the issue we are working on

## Current Task

Fix benchmarks

### Implementation Plan

- [ ] run-benchmarks
  - Update `scripts/benchmarks/run-bench.ts` to use `vttResult`
  - Probable direction: store only the provenance records from the VTT (not the
    full `vttSummary` or `vttResult`) — all timing and metadata the benchmark
    needs lives in `ProvenanceComposition`

## Backlog

These turn into issues above, inside this very document

- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
  - script to repopulate samples/models
- Cache (.vtt/.wav) is permanent - add cleanup/expiry criteria
- Investigate `simpler-recursive.ts` as a replacement for segmentation
- Extract `runTask`/monitors to new `lib/exec.ts`
- Second use case: short word/phrase transcription (separate entrypoint)
- Integrate markdownlint into ci - `bunx markdownlint-cli --version`
  - Fix conflicting setup of VSCode, et al..
  - See [BUN_ONE_QUALITY.md](./BUN_ONE_QUALITY.md)
