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

/**
 * Stitch multiple VttTranscription runs into a single VttComposition artifact.
 */
export function stitchVttConcat(
  transcriptions: VttTranscription[],
  initialProvenance: Omit<
    ProvenanceComposition,
    "segments" | "elapsedMs" | "durationSec"
  >,
): VttComposition {
  let currentOffset = 0;
  let totalElapsedMs = 0;

  const segments: VttSegment[] = transcriptions.map((t, i) => {
    const startSec = currentOffset;
    totalElapsedMs += t.provenance.elapsedMs;

    const segment: VttSegment = {
      provenance: {
        ...t.provenance,
        segment: i,
        startSec: startSec,
      },
      cues: shiftVttCues(t.cues, startSec),
    };

    // Increment offset by the specific transcription's duration
    currentOffset += t.provenance.durationSec ?? 0;

    return segment;
  });

  const compositionProvenance: ProvenanceComposition = {
    ...initialProvenance,
    segments: segments.length,
    elapsedMs: totalElapsedMs,
    durationSec: currentOffset,
  };

  return {
    provenance: compositionProvenance,
    segments,
  };
}
