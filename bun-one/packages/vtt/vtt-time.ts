/**
 * Convert VTT timestamp (HH:MM:SS.mmm) to seconds.
 * Handles HH:MM:SS, MM:SS, or SS formats.
 */
export function vttTimeToSeconds(time: string): number {
  const parts = time.split(":");
  if (parts.length === 3) {
    const [hours = "0", minutes = "0", seconds = "0"] = parts;
    return (
      parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds)
    );
  } else if (parts.length === 2) {
    const [minutes = "0", seconds = "0"] = parts;
    return parseInt(minutes) * 60 + parseFloat(seconds);
  }
  return parseFloat(time);
}

/**
 * Convert seconds to VTT timestamp format (HH:MM:SS.mmm)
 */
export function secondsToVttTime(sec: number): string {
  if (sec < 0) {
    throw new Error("Time cannot be negative");
  }

  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = seconds.toFixed(3).padStart(6, "0"); // "SS.mmm"

  return `${hh}:${mm}:${ss}`;
}
