/**
 * Segment boundary computation for audio splitting.
 *
 * Pure math -- no I/O, no side effects.
 */

import { formatDuration } from "./duration.ts";

// Ignore remainders under 2s to avoid micro-segments from duration rounding.
// Real audio files often have subsecond duration excesses (e.g., 1800.019s
// instead of exactly 1800s), so we absorb tiny tails into the final segment.
export const MIN_SEGMENT_REMAINDER_SEC = 2;

/** A segment of audio defined by start/end boundaries */
export interface Segment {
  startSec: number;
  endSec: number;
}

/**
 * Compute segment boundaries for an audio file.
 * Pure geometry: given duration and slicing parameters, returns [start, end] pairs.
 */
export function computeSegments(
  audioDuration: number,
  segmentSec: number,
  maxSegmentSec: number,
): Segment[] {
  const effectiveSegmentSec = resolveSegmentSec(
    audioDuration,
    segmentSec,
    maxSegmentSec,
  );
  const count = computeSegmentCount(audioDuration, effectiveSegmentSec);

  if (count === 0) return [];

  const segments: Segment[] = [];
  for (let i = 0; i < count; i++) {
    const startSec = i * effectiveSegmentSec;
    const endSec =
      i === count - 1
        ? audioDuration
        : Math.min((i + 1) * effectiveSegmentSec, audioDuration);
    segments.push({ startSec, endSec });
  }

  return segments;
}

function computeSegmentCount(
  audioDuration: number,
  segmentSec: number,
): number {
  if (segmentSec <= 0) return 1;
  if (audioDuration <= 0) return 0;
  const fullSegments = Math.floor(audioDuration / segmentSec);
  const remainder = audioDuration - fullSegments * segmentSec;
  if (remainder > 0 && remainder < MIN_SEGMENT_REMAINDER_SEC) {
    return Math.max(fullSegments, 1);
  }
  return Math.ceil(audioDuration / segmentSec);
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
 * Format: -seg{NN}-d{dur}
 */
export function getSegmentSuffix(
  index: number,
  segmentSec: number,
  opts?: { durationLabel?: string },
): string {
  const segNum = String(index).padStart(2, "0");
  const durStr = opts?.durationLabel ?? formatDuration(segmentSec);
  return `-seg${segNum}-d${durStr}`;
}
