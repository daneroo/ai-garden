export function segment(audioDurationSec: number, segmentSec: number) {
  // How many segments we'd split this input into.
  // `segmentSec=0` means treat the input as a single segment.
  const segmentCount =
    segmentSec > 0 ? Math.ceil(audioDurationSec / segmentSec) : 1;

  // Build WAV conversion tasks (currently placeholder args/logs).
  // Note: WAV tasks are always emitted for all segments.
  const sequence: { i: number; start: number; end: number }[] = Array.from(
    { length: segmentCount },
    (_, i) => {
      // const segNum = i + 1;
      return {
        i,
        start: i * segmentSec,
        end: (i + 1) * segmentSec,
      };
    },
  );

  return sequence;
}
