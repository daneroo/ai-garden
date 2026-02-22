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

Switch to `packages/vtt` in apps/whisper.

### Implementation Plan

- [x] Detailed plan in `plans/VTT_MIGRATION.md` build the requirements.
- [x] Requirements approved. Build the implementation task list below.
      Ref: `plans/VTT_MIGRATION.md` for the detailed requirements (implications 1-6).

- [x] Step 1 — vtt-writer.ts (new file, Impl 2.3)
  - Create `apps/whisper/lib/vtt-writer.ts`
  - Expose `writeVttTranscription` and `writeVttComposition`
  - Serialize typed `@bun-one/vtt` artifacts to canonical VTT text format
  - Add unit tests in `lib/vtt-writer.test.ts`
- [x] Step 2 — executeTranscribe (Impl 2)
  - Update `lib/task.ts` to use `@bun-one/vtt` and the new writer
  - Fresh generation: `parseRaw` then build `ProvenanceTranscription`,
    write via `writeVttTranscription`
  - Cache read: validate with `parseTranscription`, throw on warnings
  - Return type unchanged
- [x] Step 3 — stitching (Impl 3)
  - Update `lib/runners.ts`, remove `stitchSegments` function
  - Read each segment VTT with `parseTranscription`
  - Build `initialProvenance`, call `stitchVttConcat` from `@bun-one/vtt`
  - Write via `writeVttComposition`
- [x] Step 4 — RunResult + runWhisper (Impl 1, 4a)
  - Change `vttSummary?: VttSummary` to
    `vttResult?: ParseResult<VttComposition>`
  - Read back final VTT with `parseComposition`, attach to result
  - Update reporter `finish()` to read from `result.vttResult.value.provenance`
- [x] Step 5 — CLI consumer (Impl 4b)
  - Update `whisper.ts` to read from `result.vttResult?.value.provenance`
  - Remove `getHeaderProvenance` import from `vtt.ts`
- [x] Step 6 — dead code (Impl 5, 6)
  - Delete `lib/vtt.ts`, `lib/vtt.test.ts`
  - Delete `lib/vtt-stitch.ts`, `lib/vtt-stitch.test.ts`
  - Verify no remaining imports reference these files
- [ ] Step 7 — run-benchmarks (Impl 6, deferred)
  - Update `scripts/benchmarks/run-bench.ts` to use `vttResult`
  - Probable direction: store only the provenance records from the VTT
    (not the full `vttSummary` or `vttResult`) — all timing and metadata
    the benchmark needs lives in `ProvenanceComposition`
  - Separate pass

## Backlog

These turn into issues above, inside this very document

- Caching for Stitched Segment?
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
