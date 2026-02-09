# Whisper Ongoing Plan

Follows [WHISPER-SIMPLIFY.md](./WHISPER-SIMPLIFY.md) and earlier plans

I want to keep steady improvements for this cli

## Goal

Track ongoing work for this sub-project (`bon-one/apps/whisper/`)

- Implementation plans have `[ ]` for not started, `[x]` for done
- Before checking any box: `bun run ci` must pass.
- Before committing an issue: User reviews changes.
- We should always identify the issue we are working on

## Issue 101 Rationalize RunResult interface

- Thin out RunResult — remove derived/redundant fields:
  - `processedAudioDurationSec`: derivable from tasks or vttSummary
  - `elapsedSec`: derivable from tasks, or measurable from outside runWhisper
  - `speedup`: derivable (and was incorrectly calculated based on wall-clock)
  - Keep: `tasks`, `outputPath`, `vttSummary`
- processedAudioDurationSec duplication in runners.ts — Lines 184-187 compute
  config.durationSec > 0 ? Math.min(config.durationSec, audioDuration) :
  audioDuration — identical to plan.transcribeDurationSec. Could use
  computeSegmentationPlan and read plan.transcribeDurationSec directly,
  eliminating the duplication. But this is a runners.ts concern, not a
  segmentation.ts bug.
- undoing "smart dry-run with cached provenance"
  - This behavior was introduced in commit
    `b6e49b6612c348150cff4df81ebd2ad36a74886c`.

### Implementation Plan - 101

Ordered for incremental, type-safe execution:

- [x] **Step 1: Enhance VttSummary** (Pure addition, no breaking changes)
  - Add segments: count or array with full metadata
  - Include `provenance: VttProvenance[]` (VttHeaderProvenance |
    VttSegmentProvenance)
  - Type definition should match actual .vtt file content
  - Consider Zod schema (could replace run-bench.ts schema)
- [x] **Step 2: Refactor RunResult** (Now VttSummary has the data we need)
  - Remove derived fields: `processedAudioDurationSec`, `elapsedSec`, `speedup`
  - Keep: `tasks`, `outputPath`, `vttSummary`
  - Update `runWhisper` to populate enriched VttSummary
- [x] **Step 3: Update CLI output** (Use new data source)
  - Update `whisper.ts` to derive timing/speedup from VttSummary and tasks
  - Remove manual calculation of `transcriptionSec`
- [x] **Step 4: Remove smart dry-run hack** (No longer needed)
  - VttSummary now provides timing from provenance naturally
  - Remove lines 262-277 in `runWhisperPipeline`
- [ ] **Step 5: Simplify run-bench.ts** (Optional cleanup)
  - Could rely on .vtt file directly, or re-serialize VttSummary
  - Instead of depending on runWhisper's JSON output
- [ ] **Step 6: Distinguish Task/TaskConfig** (Optional structural cleanup)
  - Is serialized as part of the process --json output
  - Task (discriminated union on `kind`): label, description, elapsedMs (always
    present for display)
  - TaskConfig: what runTask(node:child_process:spawn) needs
  - Not all Tasks are spawn-based (e.g., stitch)

## Backlog

These turn into issues above, inside this very document

- Investigate `simpler-recursive.ts` as a replacement for segmentation
- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
  - VTT stitching clip for monotonicity guarantees - where?
  - if Stitching is a task, it could also cache!
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
