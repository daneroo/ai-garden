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

export interface SegmentationPlan {
  count: number;
  transcribeDurationSec: number;
  transcribesEntireAudio: boolean;
}

/**
 * Build WAV segments from audio/config parameters.
 *
 * Build constant-size WAV segments from a precomputed segmentation plan.
 * - transcribeDurationSec: how much audio to transcribe (clamped to audioDurationSec)
 * - transcribesEntireAudio: transcribing the entire file (uses tiny-tail absorption)
 * - partial run: transcribing a prefix (ceil division, no tiny-tail concerns)
 *
 * Example: audioDurationSec=120, segDurationSec=40, configDurationSec=50
 *   transcribeDurationSec=50, transcribesEntireAudio=false, count=ceil(50/40)=2
 *   wav: [{startSec:0, durationSec:40}, {startSec:40, durationSec:40}]
 */
function buildWavSequence(
  segDurationSec: number,
  plan: SegmentationPlan,
): WavSegment[] {
  // sentinel: wav durationSec=0 means "convert to end of file"
  const full = 0;

  return Array.from({ length: plan.count }, (_, i) => ({
    startSec: i * segDurationSec,
    // Last segment in a full run: convert to end of file (durationSec=0)
    durationSec:
      plan.transcribesEntireAudio && i === plan.count - 1
        ? full
        : segDurationSec,
  }));
}

/**
 * Build transcribe segments from audio/config parameters.
 *
 * All transcribe segments are full (durationSec=0) except the last one for
 * partial runs.
 */
function buildTranscribeSequence(
  segDurationSec: number,
  plan: SegmentationPlan,
): TranscribeSegment[] {
  // sentinel: trns durationSec=0 means "transcribe entire wav"
  const full = 0;
  const trns: TranscribeSegment[] = Array.from({ length: plan.count }, () => ({
    durationSec: full,
  }));

  // Partial run: last transcribed segment gets the remainder.
  // Exact boundary gives 0, which correctly means "full wav".
  if (!plan.transcribesEntireAudio && trns.length > 0) {
    trns[trns.length - 1]!.durationSec =
      plan.transcribeDurationSec % segDurationSec;
  }

  return trns;
}

/**
 * Build both WAV and transcribe sequences from audio and config parameters.
 *
 * Composition only: wav.length === trns.length by construction.
 */
export function buildSequences(
  audioDurationSec: number,
  segDurationSec: number,
  configDurationSec: number,
): { wav: WavSegment[]; trns: TranscribeSegment[] } {
  const plan = computeSegmentationPlan(
    audioDurationSec,
    segDurationSec,
    configDurationSec,
  );
  const wav = buildWavSequence(segDurationSec, plan);
  const trns = buildTranscribeSequence(segDurationSec, plan);
  return { wav, trns };
}

// --- internal ---

/**
 * Compute the segmentation plan for this run.
 *
 * This function is the segmentation policy in one place.
 *
 * It returns three values:
 * - transcribeDurationSec: effective duration we intend to transcribe
 * - count: how many segments must exist for that transcription plan
 * - transcribesEntireAudio: whether transcription covers the entire source audio
 *
 * Step 1: resolve transcribeDurationSec
 * - configDurationSec <= 0 means "no limit", so transcribe full audio
 * - configDurationSec > 0 means "up to that point", clamped to audio length
 *
 * Step 2: compute count from that effective duration
 * - partial run (effective duration < audio duration): count = ceil(duration/seg)
 *   because any positive remainder requires one more segment to cover it
 * - full run (effective duration == audio duration): use tiny-tail absorption
 *   so sub-2s remainders do not create micro-segments
 */
export function computeSegmentationPlan(
  audioDurationSec: number,
  segDurationSec: number,
  configDurationSec: number,
): SegmentationPlan {
  if (audioDurationSec <= 0 || segDurationSec <= 0) {
    throw new Error(
      `build sequence requires positive inputs, got audioDurationSec=${audioDurationSec} segDurationSec=${segDurationSec}`,
    );
  }

  let transcribeDurationSec = audioDurationSec;
  if (configDurationSec > 0) {
    transcribeDurationSec = Math.min(configDurationSec, audioDurationSec);
  }

  const transcribesEntireAudio = transcribeDurationSec === audioDurationSec;
  if (!transcribesEntireAudio) {
    return {
      count: Math.ceil(transcribeDurationSec / segDurationSec),
      transcribeDurationSec,
      transcribesEntireAudio,
    };
  }

  const fullSegments = Math.floor(audioDurationSec / segDurationSec);
  const remainderSec = audioDurationSec % segDurationSec;
  if (remainderSec > 0 && remainderSec < MIN_SEGMENT_REMAINDER_SEC) {
    return {
      count: Math.max(fullSegments, 1),
      transcribeDurationSec,
      transcribesEntireAudio,
    };
  }
  return {
    count: Math.ceil(audioDurationSec / segDurationSec),
    transcribeDurationSec,
    transcribesEntireAudio,
  };
}
