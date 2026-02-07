# Whisper Ongoing Plan

Follows [WHISPER-SIMPLIFY.md](./WHISPER-SIMPLIFY.md) and earlier plans

I want to keep steady improvements for this cli

## Goal

Track ongoing work for this sub-project (`bon-one/apps/whisper/`)

## Implementation Plan

- Before checking any box: `bun run ci` must pass.
- Before committing an issue: User reviews changes.

### Issue undoing "smart dry-run with cached provenance"

This is related to the way processing time is reported.

This behavior was introduced in commit `b6e49b6612c348150cff4df81ebd2ad36a74886c`.

- [ ] Analyze the current behavior of the processing time calculation
- [ ] Possibly revert the smart dry-run calculation or replace it
- [ ] Analyze dependencies involved in adding processing time to segment VTTs
- [ ] Decide the proper way to calculate and present this information

## Backlog

These turn into issues above, inside this very document

- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to new `lib/exec.ts`
- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
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
