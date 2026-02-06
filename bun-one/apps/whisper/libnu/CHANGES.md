# libnu/ Changes

Tracking all modules copied from `lib/` and modifications made during whispernu
simplification.

## Modules Brought Over Unmodified

- lib/audio.ts : Audio file duration detection via ffprobe
- lib/duration.ts : Parse duration strings (e.g., "1h", "30m") to seconds
- lib/preflight.ts : Check for required commands (ffmpeg, whisper-cli)
- lib/progress.ts : Progress reporting and monitoring
- lib/segmentation.ts : Segment calculation for multi-segment audio
  - Test: lib/segmentation_test.ts (11 tests, all pass)
- lib/vtt.ts : VTT parsing and writing
- lib/vtt-stitch.ts : Multi-segment VTT stitching

## Modules Brought Over and Modified

### runner.ts (from lib/runners.ts)

Test: lib/runners_test.ts → libnu/runner_test.ts (7 tests, all pass)

Modifications:

- Updated imports to use `libnu/` modules instead of `lib/`
- Removed cache.ts import
- Removed `cachePath` parameter from `createToWavTask()` call (line ~242)
- Removed `cachePath` parameter from `createTranscribeTask()` call (line ~266)

### task.ts (from lib/task.ts)

Test: lib/task_test.ts → libnu/task_test.ts (11 tests, all pass)

Modifications:

1. **Import changes:**
   - Updated to use `libnu/` modules (progress.ts now local)

2. **ToWavTaskOptions interface:**
   - Removed: `cachePath: string` field

3. **createToWavTask() function:**
   - Removed cache check logic (8 lines):
     ```typescript
     // Before: checked Bun.file(opts.cachePath).exists()
     // After: always runs ffmpeg
     ```
   - Removed cache write logic (1 line):
     ```typescript
     // Before: await Bun.write(opts.cachePath, Bun.file(opts.outputPath))
     // After: removed
     ```

4. **TranscribeTaskOptions interface:**
   - Removed: `cachePath: string` field

5. **createTranscribeTask() function:**
   - Removed cache check logic (8 lines):
     ```typescript
     // Before: checked Bun.file(opts.cachePath).exists()
     // After: always runs whisper-cli
     ```
   - Removed cache write logic (1 line):
     ```typescript
     // Before: await Bun.write(opts.cachePath, Bun.file(opts.vttPath))
     // After: removed
     ```

**Summary:** All caching functionality removed from whispernu

## Remaining Dependencies (still using lib/)

None! All dependencies now in libnu/
