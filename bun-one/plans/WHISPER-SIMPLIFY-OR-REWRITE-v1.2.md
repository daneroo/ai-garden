# WHISPER-SIMPLIFY-OR-REWRITE v1.2

Next Simplification Iteration

Links to: [Master Plan](./WHISPER-SIMPLIFY-OR-REWRITE.md) | [v1.0 (Baseline)](./WHISPER-SIMPLIFY-OR-REWRITE-v1.0.md)

Status: PLANNING

## Starting Point

v1.0 baseline established:

- Complete libnu/ with tests (18 tests passing)
- Caching removed
- No lib/ dependencies

Current complexity (where it lives):

- runner.ts (11K) - orchestration, multi-segment logic
- task.ts (14K) - task abstraction, monitors, execution
- segmentation.ts (2.7K) - segment calculation

## Goals

Continue radical simplification while maintaining:

- Tests passing
- whisper.ts (old) still works
- whispernu.ts (new) works

## Options for Simplification

### Option A: Remove Multi-Segment Complexity

Target: Single-segment use case only (≤37h audio)

Remove from runner.ts:

- Segment loop logic
- Multi-segment orchestration
- Stitching logic

Remove entirely:

- segmentation.ts
- vtt-stitch.ts

Impact:

- Simpler use case (audiobooks without segmentation)
- ~2700 lines removed (segmentation.ts + vtt-stitch.ts)
- Runner logic much simpler
- Tests: some will break (multi-segment tests)

Risk: Lose multi-segment capability (but it's in whisper.ts still)

### Option B: Simplify Task Abstraction

Target: Reduce task.ts complexity

Current: Task interface with execute(), describe(), monitors
Proposed: Direct function calls, less indirection

Remove:

- Task interface/factories
- TaskMonitor abstraction?
- Two-phase pattern (build tasks → execute)

Impact:

- Less indirection
- More direct code flow
- Tests: might need rewriting

Risk: Lose structured task execution model

### Option C: Incremental - Start with Segmentation

Target: Simplify just segmentation.ts

Approach:

- Inline segment calculation into runner.ts
- Remove segmentation.ts module
- Keep multi-segment support

Impact:

- Smaller step
- Tests easier to maintain
- Proves simplification approach

Risk: Minimal

### Option D: Hybrid - Remove Segments + Simplify Task

Combine A + B:

- Single segment only
- Direct function calls (no Task abstraction)
- Remove segmentation, vtt-stitch, task abstraction

Impact:

- Most radical simplification
- Smallest code
- Largest change

Risk: Highest (many things changing at once)

## Recommendation

Start with **Option A** (Remove Multi-Segment):

- Clear scope
- Significant simplification
- Single-segment use case is well-defined
- Can always add multi-segment back later

Then follow with **Option B** (Simplify Task) in v1.3

## Success Criteria

Objective:

- Tests pass (or updated tests pass)
- whispernu.ts works for single-segment audio
- Can transcribe jfk.mp3 (11s), hobbit-30m.mp3 (30min)

Subjective:

- Code feels simpler
- Easier to understand runner.ts flow
- Less files to maintain

## Implementation Plan (if Option A chosen)

Remove segmentation support:

- Remove segmentation.ts import from runner.ts
- Remove segment loop in runWhisperPipeline()
- Remove vtt-stitch.ts import
- Assume single segment always
- Update tests (remove multi-segment tests)

Expected result:

- runner.ts: ~11K → ~6K (50% reduction)
- Remove segmentation.ts (2.7K)
- Remove vtt-stitch.ts (5.9K)
- Total reduction: ~13K lines

## Open Questions

For user to decide:

- Which option to pursue?
- Single-segment only acceptable?
- Keep monitors/progress reporting?
- What about --duration flag (duration filtering)?

## Next Actions

Awaiting user review and decision on approach.
