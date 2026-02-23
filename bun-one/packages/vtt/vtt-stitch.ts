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
  /** Actual total audio duration — copied directly to composition provenance durationSec */
  audioDurationSec: number;
  /** Effective duration to use for offset if provenance lacks durationSec */
  defaultSegmentDurationSec: number;
}

/**
 * Stitch multiple VttTranscription runs into a single VttComposition artifact.
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
  if (options.defaultSegmentDurationSec <= 0) {
    throw new Error("stitchVttConcat: defaultSegmentDurationSec must be > 0");
  }

  let currentOffset = 0;
  let totalElapsedMs = 0;
  const isLast = (i: number) => i === transcriptions.length - 1;

  const segments: VttSegment[] = transcriptions.map((t, i) => {
    const startSec = currentOffset;
    totalElapsedMs += t.provenance.elapsedMs;

    let cues = shiftVttCues(t.cues, startSec);

    // Clip: clamp last cue's endTime to segment boundary (non-last segments only)
    const durationSec = t.provenance.durationSec;
    // But as it is (almost) never present, we use the default segment duration.
    const effectiveDurationSec =
      durationSec || options.defaultSegmentDurationSec;
    if (clip && !isLast(i) && effectiveDurationSec != null && cues.length > 0) {
      const boundary = startSec + effectiveDurationSec;
      const lastCue = cues[cues.length - 1]!;
      if (vttTimeToSeconds(lastCue.endTime) > boundary) {
        cues = [
          ...cues.slice(0, -1),
          { ...lastCue, endTime: secondsToVttTime(boundary) },
        ];
      }
    }

    const segment: VttSegment = {
      provenance: {
        ...t.provenance,
        segment: i,
        startSec: startSec,
      },
      cues,
    };

    // Increment offset by the specific transcription's duration
    currentOffset += effectiveDurationSec ?? 0;

    return segment;
  });

  const compositionProvenance: ProvenanceComposition = {
    ...initialProvenance,
    segments: segments.length,
    elapsedMs: totalElapsedMs,
    durationSec: options.audioDurationSec,
  };

  return {
    provenance: compositionProvenance,
    segments,
  };
}
