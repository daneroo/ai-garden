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
  /** Duration in seconds to transcribe. 0 means "full WAV". */
  durationSec: number;
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
 * Which segments need transcribing, and for how long?
 * Include every segment that starts before the cutoff (or all if no cutoff).
 * All get durationSec=0 (full), except the last — partial up to the cutoff.
 */
export function buildTranscribeSequence(
  wavSegs: WavSegment[],
  configDurationSec: number,
): TranscribeSegment[] {
  // How far into the audio to transcribe (seconds). Infinity = no limit.
  const cutoffSec = configDurationSec > 0 ? configDurationSec : Infinity;
  const included = wavSegs.filter((seg) => seg.startSec < cutoffSec);

  return included.map((seg, i) => ({
    durationSec:
      cutoffSec < Infinity && i === included.length - 1
        ? cutoffSec - seg.startSec
        : 0,
  }));
}

/**
 * Build both sequences in a single pass.
 * Loop breaks at cutoff — wav and trns always have the same count.
 * durationSec=0 only for the true last segment of the audio (convert to EOF).
 */
export function buildSequences(
  audioDurationSec: number,
  segDurationSec: number,
  configDurationSec: number,
): { wav: WavSegment[]; trns: TranscribeSegment[] } {
  if (audioDurationSec <= 0 || segDurationSec <= 0) {
    throw new Error(
      `buildSequences requires positive inputs, got audioDurationSec=${audioDurationSec} segDurationSec=${segDurationSec}`,
    );
  }
  const count = computeCount(audioDurationSec, segDurationSec);
  // How far into the audio to transcribe (seconds). Infinity = no limit.
  const cutoffSec = configDurationSec > 0 ? configDurationSec : Infinity;
  const wav: WavSegment[] = [];
  const trns: TranscribeSegment[] = [];

  // sentinel meaning: wav: convert to end of file, whisper: transcribe entire file
  const full = 0;

  // Example: audio=120s, seg=40s, configDurationSec=50s
  //   i=0: wav {startSec:0,  durationSec:40}, trns {durationSec:0}
  //   i=1: wav {startSec:40, durationSec:40}, trns {durationSec:10} ← last, 50%40=10s
  //   i=2: startSec=80 >= configDurationSec=50 — no more items needed, break
  for (let i = 0; i < count; i++) {
    const startSec = i * segDurationSec;
    if (startSec >= cutoffSec) break;

    wav.push({
      startSec,
      durationSec: i === count - 1 ? full : segDurationSec,
    });

    trns.push({ durationSec: full });
  }

  // Last transcribed segment: partial durationSec if cutoff falls mid-segment
  // (cutoffSec % segDurationSec = 0 at exact boundaries, which means "full" — correct)
  if (configDurationSec > 0) {
    trns[trns.length - 1]!.durationSec = cutoffSec % segDurationSec;
  }

  return { wav, trns };
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
