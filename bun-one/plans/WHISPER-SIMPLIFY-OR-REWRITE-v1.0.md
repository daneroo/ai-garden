# WHISPER-SIMPLIFY-OR-REWRITE v1.0

Baseline Establishment: Complete libnu/ with tests

Links to: [Master Plan](./WHISPER-SIMPLIFY-OR-REWRITE.md) | [v1 (Phase 1)](./WHISPER-SIMPLIFY-OR-REWRITE-v1.md)

Status: COMPLETE

Commit: 7820173

## Goal

Establish complete baseline for Theseus strategy:

- Copy all dependencies to libnu/
- Remove first simplification (caching)
- Bring over all tests
- Verify everything works
- Create foundation for iterative simplification

## What We Did

Copied all lib/ modules to libnu/:

Unmodified (7 modules):

- audio.ts - Audio duration detection
- duration.ts - Duration parsing
- preflight.ts - Command checks
- progress.ts - Progress reporting
- segmentation.ts - Segment calculation (+ 11 tests)
- vtt.ts - VTT parsing/writing
- vtt-stitch.ts - Multi-segment stitching

Modified (2 modules):

- runner.ts (from lib/runners.ts) (+ 7 tests)
  - Removed cache.ts dependency
  - Removed cachePath parameters
- task.ts (from lib/task.ts) (+ 11 tests)
  - Removed cachePath fields from interfaces
  - Removed cache check logic (8 lines × 2)
  - Removed cache write logic (1 line × 2)

## Results

Complete independence:

- whispernu.ts imports only from libnu/
- No dependencies on lib/
- All tests passing (18 tests, 46 assertions)

Caching removed:

- No WAV caching
- No VTT caching
- Always runs ffmpeg + whisper-cli
- Verified: jfk.mp3 takes ~1s both runs (no cache hit)

Documentation:

- libnu/CHANGES.md tracks all modifications
- Easy to see what changed vs original lib/

## Complexity Remaining

Where the complexity lives (to be simplified):

- runner.ts (11K) - main orchestration logic
- task.ts (14K) - task abstraction, monitors
- segmentation.ts (2.7K) - segment calculation

These are the targets for v1.2 simplification.

## Lessons Learned

Ship of Theseus approach works:

- Old code stays runnable (whisper.ts)
- New code independent (whispernu.ts)
- Tests provide safety net
- Can abandon new code easily if needed

Caching removal was straightforward:

- Removed from interfaces (2 fields)
- Removed from execution (4 code blocks)
- Tests still pass
- No hidden dependencies

Testing is essential:

- 18 tests caught issues immediately
- Modified modules brought tests along
- Confidence to continue simplifying

## Next Steps

See v1.2 for next iteration:

- Remove multi-segment complexity?
- Simplify task abstraction?
- Inline segmentation?
- TBD - user will review and decide
