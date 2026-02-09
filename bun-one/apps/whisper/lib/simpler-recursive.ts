/**
 * What this eliminates:

  - SegmentationPlan as a type — the plan is implicit in the recursion
  - computeSegmentationPlan — the floor/remainder/conditional count logic disappears entirely
  - Parallel arrays — wav and transcribe are one unified Segment[]
  - Post-hoc mutation — the current buildTranscribeSequence creates an array then mutates the last element
  - The count calculation — the recursion naturally discovers when it's done

  The tiny-tail absorption, which required floor/remainder/MIN_SEGMENT_REMAINDER_SEC comparison in the current code, falls out of a single comparison: remaining
  <= segDurationSec + MIN_SEGMENT_REMAINDER_SEC. That's the real win — the edge case that drove the most complexity just becomes the base case of the recursion.

  Walk through a few cases to verify:

  - audio=1800.019, seg=600, config=0 → 3 segments, last has wav=0 (tail absorbed)
  - audio=601.5, seg=600, config=0 → 1 segment, wav=0 (1.5s tail absorbed into single segment)
  - audio=603, seg=600, config=0 → 2 segments (3s remainder is real)
  - audio=120, seg=40, config=50 → 2 segments, last has transcribeSec=10
  - audio=30, seg=600, config=0 → 1 segment, wav=0

  The validation (finite/positive checks) would stay at the entry point of buildSegments, just not buried in a separate function.
 */

// Ignore remainders under 2s to avoid micro-segments from duration rounding.
// Real audio files often have subsecond duration excesses (e.g., 1800.019s
// instead of exactly 1800s), so we absorb tiny tails into the final segment.
const MIN_SEGMENT_REMAINDER_SEC = 2;

interface Segment {
  startSec: number;
  wavDurationSec: number; // 0 = "to end of file"
  transcribeSec: number; // 0 = "full wav"
}

export function buildSegments(
  audioDurationSec: number,
  segDurationSec: number,
  configDurationSec: number,
): Segment[] {
  const effective =
    configDurationSec > 0
      ? Math.min(configDurationSec, audioDurationSec)
      : audioDurationSec;
  const isFullRun = effective === audioDurationSec;

  function go(start: number, remaining: number): Segment[] {
    if (remaining <= 0) return [];

    const isLast = isFullRun
      ? remaining <= segDurationSec + MIN_SEGMENT_REMAINDER_SEC
      : remaining <= segDurationSec;

    if (isLast) {
      return [
        {
          startSec: start,
          wavDurationSec: isFullRun ? 0 : segDurationSec,
          transcribeSec: isFullRun ? 0 : remaining,
        },
      ];
    }

    return [
      { startSec: start, wavDurationSec: segDurationSec, transcribeSec: 0 },
      ...go(start + segDurationSec, remaining - segDurationSec),
    ];
  }

  return go(0, effective);
}
