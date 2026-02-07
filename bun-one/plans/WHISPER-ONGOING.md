# Whisper Ongoing Plan

Follows [WHISPER-SIMPLIFY.md](./WHISPER-SIMPLIFY.md) and earlier plans

I want to keep steady improvements for this cli

## Goal

Track ongoing work for this sub-project (`bon-one/apps/whisper/`)

## Implementation Plan

- Before checking any box: `bun run ci` must pass.
- Before committing an issue: User reviews changes.

### Issue: elapsed and speedup in benchmark

- Goal: fix incorrect elapsed/speedup reporting in benchmark runs, especially
  with cached segments
- [x] Reproduce with empty cache and 3600s runs (hobbit/quixote)
  - Defensive preparation and reproduction
    - `rm ../../reports/benchmarks/2026*Z-*-tiny.en-3600s.json` # remove two
      grid entries for run-bench
    - `rm -rf data/cache data/output/ data/work/` # empty the cache
    - `bun run scripts/benchmarks/run-bench.ts` # run missing grid entries
  - note that even just these two entries, will take about five minutes to run
- [x] Trace elapsed/speedup sources in benchmark output
- [x] Decide expected behavior when cache hits are involved
- [x] Implement corrections in benchmark reporting
- [x] Update summary plots/data if needed

## Backlog

These turn into issues above, inside this very document

- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to new `lib/exec.ts`
- Artifact directory reorganization WORK,CACHE,OUTPUT,SAMPLES
- Second use case: short word/phrase transcription (separate entrypoint)
- Integrate markdownlint into ci - `bunx markdownlint-cli --version`
- Consider schema-first or shared schema for benchmark JSON (export schema from runners, derive types from schema)
- Clean up stale/legacy `startSec` references (on VttHeaderProvenance, etc.)
  - Segment provenance always has `startSec: 0` for single-segment runs, which
    is noise. Investigate whether startSec belongs in segment provenance at all,
    or only when segments > 1.
- Decide if normal run with cache hit should display real-time (0s) or cached
  provenance time (original execution time). Currently shows 0s which is
  accurate but leads to silly speedup values (62069.6x).
