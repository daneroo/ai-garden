# VTT Compare Implementation Tasks

Checklist for merge phase and scoring improvements.

## Add Data Structures

- [x] Add `WordSpan` interface
- [x] Add `AlignedSpan` interface
- [x] **Validate**: `deno task ci` passes

## Implement Merge

- [x] Add `mergeAnchorsToSpans()` function
  - Initialize first span from first anchor (length = n)
  - Extend span if contiguous in both A and B (posA+1, posB+1, same offset)
  - Otherwise push current span, start new span
- [x] Wire into main after `findUniqueAnchors()`
- [x] **Validate**: Log span count vs anchor count (~67,000 anchors → fewer
      spans)

## Update Scoring

- [x] Update `ComparisonScore` interface (totalWordsA/B, coverageA/B, etc.)
- [x] Rewrite `computeScore()` to work on spans
  - matchedWords = sum of span lengths
  - coverageA/B = matchedWords / totalWordsA/B
  - gapCount = count gaps between spans
  - Drift from span start positions
- [x] **Validate**: Run comparison, verify meaningful metrics

## Update Output

- [x] Update Scoring console output for new metrics
- [x] **Validate**: Output shows spanCount, matchedWords, coverageA/B, gapCount

## Cleanup (Optional)

- [ ] See if we can remove `NGramMatch` completely by refactoring
- [ ] Consolidate DOCS (VTT-COMPARE-PLAN.md) to reflect the most recent work
- [ ] Scan for TODO's we may have left

## Gap Metrics (2026-01-05)

- [x] Add gap histograms to `SpanScore` (word count + time buckets)
- [x] Add min/avg/max stats for gaps (words and time)
- [x] Use dynamic integer keys for word histogram (1, 2, 3, ... N)
- [x] Use log-scale buckets for time histogram (0.32s, 1s, 3.16s, 10s, ...)
- [x] Display cue duration [min, max] in Tokenize output
- [x] **Bug fix**: Word interpolation gave last word endSec timestamp, causing
      0-duration gaps when cues were back-to-back. Fixed by dividing by N
      instead of N-1.
- [x] **Validate**: `deno task ci` passes, min gap time now 0.21s (not 0.00s)

## Next Steps

- [ ] Recursive gap filling - re-run n-gram matching on unmatched gap regions
- [ ] Code review and refactoring
- [ ] Consider extracting reusable modules
