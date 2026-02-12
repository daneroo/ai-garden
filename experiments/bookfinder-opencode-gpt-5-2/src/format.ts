export function formatDurationHMS(totalSeconds: number | null): string {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "--:--:--";
  }

  const seconds = Math.round(totalSeconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatBitrateKbps(bitrateKbps: number | null): string {
  if (bitrateKbps == null || !Number.isFinite(bitrateKbps) || bitrateKbps <= 0) {
    return "-";
  }
  return `${Math.round(bitrateKbps)} kbps`;
}

export function formatElapsedShort(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "-";

  const seconds = Math.round(totalSeconds);
  if (seconds < 60) return `${seconds}s`;

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m${String(s).padStart(2, "0")}s`;

  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h${String(mm).padStart(2, "0")}m${String(s).padStart(2, "0")}s`;
}
