/**
 * Segment sequence builders for audio splitting.
 *
 * Pure math — no I/O, no side effects.
 * Produces ready-to-use sequences that runners.ts maps into tasks.
 */

// Ignore remainders under 2s to avoid micro-segments from duration rounding.
// Real audio files often have subsecond duration excesses (e.g., 1800.019s
// instead of exactly 1800s), so we absorb tiny tails into the final segment.
const MIN_SEGMENT_REMAINDER_SEC = 2;

export interface WavSegment {
  startSec: number;
  /** Duration in seconds. 0 means "to end of file" (last segment). */
  durationSec: number;
}

export interface TranscribeSegment {
  segIndex: number;
  /** Duration in milliseconds for whisper --duration. 0 means "full WAV". */
  durationMs: number;
}

/**
 * Build the WAV splitting sequence given a resolved segment duration.
 * The last segment always has durationSec=0 (ffmpeg reads to end of file).
 *
 * Preconditions: audioDurationSec > 0, segDurationSec > 0
 */
export function buildWavSequence(
  audioDurationSec: number,
  segDurationSec: number,
): WavSegment[] {
  if (audioDurationSec <= 0 || segDurationSec <= 0) {
    throw new Error(
      `buildWavSequence requires positive inputs, got audioDurationSec=${audioDurationSec} segDurationSec=${segDurationSec}`,
    );
  }
  const count = computeCount(audioDurationSec, segDurationSec);
  return Array.from({ length: count }, (_, i) => ({
    startSec: i * segDurationSec,
    durationSec: i === count - 1 ? 0 : segDurationSec,
  }));
}

/**
 * Filter WAV segments into a transcription sequence.
 *
 * Only segments whose startSec < configDurationSec are included.
 * The last included segment gets a partial durationMs; all others get 0.
 * When configDurationSec <= 0 (transcribe everything), all segments are included
 * with durationMs=0.
 */
export function buildTranscribeSequence(
  wavSegs: WavSegment[],
  configDurationSec: number,
): TranscribeSegment[] {
  if (configDurationSec <= 0) {
    return wavSegs.map((_, i) => ({ segIndex: i, durationMs: 0 }));
  }

  const included: TranscribeSegment[] = [];
  for (let i = 0; i < wavSegs.length; i++) {
    const seg = wavSegs[i]!;
    if (seg.startSec >= configDurationSec) break;

    const isLast =
      i === wavSegs.length - 1 || wavSegs[i + 1]!.startSec >= configDurationSec;
    if (isLast) {
      const localSec = configDurationSec - seg.startSec;
      included.push({ segIndex: i, durationMs: localSec * 1000 });
    } else {
      included.push({ segIndex: i, durationMs: 0 });
    }
  }
  return included;
}

// --- internal ---

/**
 * Compute segment count. Only exists because of the tiny-tail absorption rule:
 * without MIN_SEGMENT_REMAINDER_SEC this would just be Math.ceil(audio/seg).
 */
function computeCount(
  audioDurationSec: number,
  segDurationSec: number,
): number {
  const fullSegments = Math.floor(audioDurationSec / segDurationSec);
  const remainderSec = audioDurationSec % segDurationSec;
  if (remainderSec > 0 && remainderSec < MIN_SEGMENT_REMAINDER_SEC) {
    return Math.max(fullSegments, 1);
  }
  return Math.ceil(audioDurationSec / segDurationSec);
}
