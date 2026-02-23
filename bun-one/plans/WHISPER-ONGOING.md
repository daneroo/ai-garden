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

- [x] run-benchmarks
  - [x] Update `scripts/benchmarks/run-bench.ts` to use `vttResult`
  - [x] Replace stored benchmark record shape to be provenance-centric (do not
        extend full `RunResult`)
  - [x] Store only benchmark key + runtime metadata + composition provenance:
    - [x] `benchmarkKey`
    - [x] `timestamp`, `hostname`, `arch`
    - [x] `provenance` (`ProvenanceComposition`)
  - [x] Remove legacy `vttSummary` handling from schema/load/normalize paths
  - [x] Derive benchmark metrics from provenance:
    - [x] `processedAudioDurationSec = provenance.durationSec`
    - [x] `elapsedSec = round(provenance.elapsedMs / 1000)`
    - [x] `speedup = processedAudioDurationSec / elapsedSec`
  - [x] In execute path, extract from `result.vttResult.value.provenance` and
        persist compact JSON records in `reports/benchmarks`
  - [x] Keep summary/plot generation sourced from `loadExistingData()` using
        provenance-derived metrics only
  - [ ] Augment `stitchVttConcat` by passing in `audioDuration`
    - [x] Add `audioDurationSec` to `StitchOptions`
    - [x] validate that
          `defaultSegmentDurationSec: Math.min(segDurationSec, audioDuration),`
          is not needed now
    - [x] Rename `audioDuration` to `audioDurationSec` - variable name and
          function (getAudioDuration(Sec))
    - [x] Revisit the idea of duration==0? - in the conteext of currentOffest
          accumulator in stichVttConcat
    - [x] tasks.ts:executeTranscribe will unconditionally add durationSec to the
          ProvenanceTranscription
    - [x] Temprarily backfill the cached vtt to have the same content (include
          the durationSec)
    - [ ] Cleaup temprary vtt cache backfill when the cache vtt are confirmed to
          all have the durationSec
- [ ] create `bun run scripts/benchmarks/performance.ts`
  - [ ] extract performance and graph from existing `.vtt` glob or directory

## Backlog

These turn into issues above, inside this very document

- JSON results include all the Cues!
- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
  - script to repopulate samples/models
- Cache (.vtt/.wav) is permanent - add cleanup/expiry criteria
- Investigate `simpler-recursive.ts` as a replacement for segmentation
- Extract `runTask`/monitors to new `lib/exec.ts`
- Second use case: short word/phrase transcription (separate entrypoint)
- Integrate markdownlint into ci - `bunx markdownlint-cli --version`
  - Fix conflicting setup of VSCode, et al..
  - See [BUN_ONE_QUALITY.md](./BUN_ONE_QUALITY.md)
