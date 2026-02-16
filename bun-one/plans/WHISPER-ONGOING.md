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

Next Task not chosen yet

### Implementation Plan

- [ ] \*\*Step 1: xx
  - sub step

## Backlog

These turn into issues above, inside this very document

- Caching for Stiched Segment?
- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
  - VTT stitching clip for monotonicity guarantees - where?
  - if Stitching is a task, it could also cache!
- Cache (.vtt/.wav) is permanent - add cleanup/expiry criteria
- Investigate `simpler-recursive.ts` as a replacement for segmentation
- Extract `runTask`/monitors to new `lib/exec.ts`
- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
  - script to repopulate samples/models
- Second use case: short word/phrase transcription (separate entrypoint)
- Integrate markdownlint into ci - `bunx markdownlint-cli --version`
- Consider schema-first or shared schema for benchmark JSON (export schema from
  runners, derive types from schema)
- Clean up stale/legacy `startSec` references (on VttHeaderProvenance, etc.)
  - Segment provenance always has `startSec: 0` for single-segment runs, which
    is noise. Investigate whether startSec belongs in segment provenance at all,
    or only when segments > 1.
- Decide if normal run with cache hit should display real-time (0s) or cached
  provenance time (original execution time). Currently shows 0s which is
  accurate but leads to silly speedup values (62069.6x).
