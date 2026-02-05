/**
 * Segment boundary computation for audio splitting.
 *
 * Pure math functions -- no I/O, no side effects.
 * Used by runners.ts to compute segment indices, offsets, durations,
 * and filename suffixes for multi-segment transcription.
 */

import { formatDuration } from "./duration.ts";

// Ignore remainders under 2s to avoid micro-segments from duration rounding.
// Real audio files often have subsecond duration excesses (e.g., 1800.019s
// instead of exactly 1800s), so we absorb tiny tails into the final segment.
export const MIN_SEGMENT_REMAINDER_SEC = 2;

export function computeSegmentCount(
  audioDuration: number,
  segmentSec: number,
): number {
  if (segmentSec <= 0) return 1;
  if (audioDuration <= 0) return 0;
  const fullSegments = Math.floor(audioDuration / segmentSec);
  const remainder = audioDuration - fullSegments * segmentSec;
  // Drop tiny tail segments below MIN_SEGMENT_REMAINDER_SEC.
  if (remainder > 0 && remainder < MIN_SEGMENT_REMAINDER_SEC) {
    return Math.max(fullSegments, 1);
  }
  return Math.ceil(audioDuration / segmentSec);
}

export function getStartSegmentIndex(
  startSec: number,
  segmentSec: number,
  segmentCount: number,
): number {
  if (startSec <= 0 || segmentSec <= 0 || segmentCount <= 1) return 0;
  return Math.min(segmentCount - 1, Math.floor(startSec / segmentSec));
}

function getSegmentEndSec(
  segIndex: number,
  audioDuration: number,
  segmentSec: number,
  overlapSec: number,
  segmentCount: number,
): number {
  if (segmentCount <= 1 || segmentSec <= 0) return audioDuration;
  if (segIndex >= segmentCount - 1) return audioDuration;
  return Math.min((segIndex + 1) * segmentSec + overlapSec, audioDuration);
}

export function getEndSegmentIndex(
  endSec: number,
  audioDuration: number,
  segmentSec: number,
  overlapSec: number,
  segmentCount: number,
): number {
  if (segmentCount <= 1 || segmentSec <= 0) return 0;
  if (endSec <= 0) return 0;
  if (endSec >= audioDuration) return segmentCount - 1;

  for (let i = 0; i < segmentCount; i++) {
    const segEnd = getSegmentEndSec(
      i,
      audioDuration,
      segmentSec,
      overlapSec,
      segmentCount,
    );
    if (endSec <= segEnd) return i;
  }

  return segmentCount - 1;
}

/** Compute --offset-t value in ms for a segment (0 = no offset) */
export function getOffsetMsForSegment(
  segIndex: number,
  startSec: number,
  segmentSec: number,
  segmentCount: number,
): number {
  if (startSec <= 0) return 0;

  const startSegIndex = getStartSegmentIndex(
    startSec,
    segmentSec,
    segmentCount,
  );
  if (segIndex !== startSegIndex) return 0;

  const offsetInSegSec = startSec - startSegIndex * segmentSec;
  return offsetInSegSec * 1000;
}

/** Compute --duration value in ms for a segment (0 = no duration limit) */
export function getDurationMsForSegment(
  segIndex: number,
  startSec: number,
  durationSec: number,
  audioDuration: number,
  segmentSec: number,
  overlapSec: number,
  segmentCount: number,
): number {
  if (durationSec <= 0) return 0;

  const endSec = Math.min(audioDuration, startSec + durationSec);
  if (endSec >= audioDuration) return 0;

  const endSegIndex = getEndSegmentIndex(
    endSec,
    audioDuration,
    segmentSec,
    overlapSec,
    segmentCount,
  );
  if (segIndex !== endSegIndex) return 0;

  const startSegIndex = getStartSegmentIndex(
    startSec,
    segmentSec,
    segmentCount,
  );
  if (endSegIndex === startSegIndex) {
    return durationSec * 1000;
  }

  const endSegStartSec = endSegIndex * segmentSec;
  const localDurationSec = endSec - endSegStartSec;
  return localDurationSec * 1000;
}

export function resolveSegmentSec(
  audioDurationSec: number,
  requestedSegmentSec: number,
  maxSegmentSec: number,
) {
  if (requestedSegmentSec > 0) {
    return requestedSegmentSec;
  }
  return audioDurationSec > maxSegmentSec ? maxSegmentSec : audioDurationSec;
}

export function getSegmentDurationLabel({
  requestedSegmentSec,
  resolvedSegmentSec,
  segmentCount,
}: {
  requestedSegmentSec: number;
  resolvedSegmentSec: number;
  segmentCount: number;
}): string {
  if (
    requestedSegmentSec <= 0 &&
    segmentCount === 1 &&
    !Number.isInteger(resolvedSegmentSec)
  ) {
    return "full";
  }
  return formatDuration(resolvedSegmentSec);
}

/**
 * Generate segment filename suffix.
 * Format: -seg{NN}-d{dur}-ov{ov}
 */
export function getSegmentSuffix(
  index: number,
  segmentSec: number,
  overlapSec: number,
  opts?: { durationLabel?: string },
): string {
  const segNum = String(index).padStart(2, "0");
  const durStr = opts?.durationLabel ?? formatDuration(segmentSec);
  const ovStr = formatDuration(overlapSec);
  return `-seg${segNum}-d${durStr}-ov${ovStr}`;
}
