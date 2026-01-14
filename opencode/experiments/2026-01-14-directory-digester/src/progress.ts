import type { ScanStats } from "./types";

const CLEAR_LINE = "\x1b[2K";

export const updateProgress = (message: string) => {
  process.stderr.write(`\r${CLEAR_LINE}${message}`);
};

export const finalizeProgress = (stats: ScanStats, label: string) => {
  const summary = [
    `${label} summary`,
    `start=${stats.startTime.toISOString()}`,
    `end=${stats.endTime.toISOString()}`,
    `files=${stats.files}`,
    `bytes=${stats.bytes}`,
    `mismatches=${stats.mismatches}`,
    `missing=${stats.missing}`,
    `extra=${stats.extra}`,
  ].join(" | ");

  process.stderr.write(`\r${CLEAR_LINE}${summary}\n`);
};
