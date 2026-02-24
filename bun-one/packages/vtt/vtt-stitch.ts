import type {
  // ProvenanceBase,
  ProvenanceComposition,
  VttComposition,
  VttCue,
  VttSegment,
  VttTranscription,
} from "./vtt-schema-zod.ts";
import { secondsToVttTime, vttTimeToSeconds } from "./vtt-time.ts";

/**
 * Shift all cue timestamps by a given offset.
 */
export function shiftVttCues(cues: VttCue[], offsetSec: number): VttCue[] {
  if (offsetSec === 0) return [...cues];

  return cues.map((cue) => ({
    ...cue,
    startTime: secondsToVttTime(vttTimeToSeconds(cue.startTime) + offsetSec),
    endTime: secondsToVttTime(vttTimeToSeconds(cue.endTime) + offsetSec),
  }));
}

export interface StitchOptions {
  /** When true, clamp each non-last segment's final cue endTime to its boundary */
  clip?: boolean;
  /** Actual transcription duration — copied directly to composition provenance durationSec.
   *  Use config.durationSec if explicitly set, else full audio duration. */
  transcriptionDurationSec: number;
  /** Expected duration of each segment (the requested chunk size passed to ffmpeg).
   *  Used to calculate absolute global offsets (i * plannedSegmentDurationSec).
   *  The actual WAV duration and transcribed duration of the last segment may be different
   *  due to final segment being potentially partial. */
  plannedSegmentDurationSec: number;
}

/**
 * Stitch multiple VttTranscription runs into a single VttComposition artifact.
 *
 * Offset Math:
 * We explicitly calculate offsets as the mathematical index `i * plannedSegmentDurationSec`
 * (e.g. 0s, 3600s, 7200s).
 * Each segment is anchored perfectly to its mathematical grid boundary.
 *
 * We do this because the the provenance.durationSec
 * recorded in the incoming VttTranscription[].provenance.durationSec
 * is calculated differently from the (possibly/slightly different)
 * duration of the converted .wav audio.
 * This is why it is not used to calculate VttSegment.provenance.startSec.
 *
 * "Clip" operation is meant to ensure that successive segments do not overlap.
 * It is therefore never applied to the last segment.
 */
export function stitchVttConcat(
  transcriptions: VttTranscription[],
  initialProvenance: Omit<
    ProvenanceComposition,
    "segments" | "elapsedMs" | "durationSec"
  >,
  options: StitchOptions,
): VttComposition {
  const { clip = false } = options;
  if (options.plannedSegmentDurationSec <= 0) {
    throw new Error("stitchVttConcat: plannedSegmentDurationSec must be > 0");
  }

  let totalElapsedMs = 0;
  const isLast = (i: number) => i === transcriptions.length - 1;

  const segments: VttSegment[] = transcriptions.map((t, i) => {
    totalElapsedMs += t.provenance.elapsedMs;

    let cues = t.cues;

    // Clip: clamp last cue's endTime to planned segment boundary (non-last only)
    if (clip && !isLast(i) && cues.length > 0) {
      const lastCue = cues[cues.length - 1]!;
      const cueEndTimeSec = vttTimeToSeconds(lastCue.endTime);

      if (cueEndTimeSec > options.plannedSegmentDurationSec) {
        cues = [
          ...cues.slice(0, -1),
          {
            ...lastCue,
            endTime: secondsToVttTime(options.plannedSegmentDurationSec),
          },
        ];
      }
    }

    // Shift unconditionally
    const startSec = i * options.plannedSegmentDurationSec;
    cues = shiftVttCues(cues, startSec);

    const segment: VttSegment = {
      provenance: {
        ...t.provenance,
        segment: i,
        startSec: startSec,
      },
      cues,
    };

    return segment;
  });

  const compositionProvenance: ProvenanceComposition = {
    ...initialProvenance,
    segments: segments.length,
    elapsedMs: totalElapsedMs,
    durationSec: options.transcriptionDurationSec,
  };

  return {
    provenance: compositionProvenance,
    segments,
  };
}
