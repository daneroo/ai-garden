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
