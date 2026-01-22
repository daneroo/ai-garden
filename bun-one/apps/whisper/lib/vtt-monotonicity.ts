/**
 * VTT Monotonicity Analyzer
 *
 * Analyzes VTT files for cue timestamp monotonicity issues.
 * Detects overlapping cues where a cue's start time is before the previous cue's end time.
 *
 * Note: These violations appear to be specific to `whisperkit` output.
 *       `whisper.cpp` output seems to be monotonic.
 *
 * Observations:
 * - Violations frequently correlate with `<|startoftranscript|>` tags
 *   (approaching 100% for -wN files).
 * - There is potential alignment to 20ms audio frame boundaries, suggesting
 *   quantization issues, though this remains inconclusive.
 *
 * Usage:
 *   deno run -A lib/vtt-monotonicity.ts | tee MONOTONICITY.md
 *
 * If no files specified, analyzes all VTT files in data/output/
 */

import { readVtt, type VttCue, vttTimeToSeconds } from "./vtt.ts";

// Run if main
if (import.meta.main) {
  const files = Deno.args.length > 0 ? Deno.args : await getDefaultVttFiles();

  // Markdown header
  console.log(`# Cue Monotonicity Violation Analysis\n`);
  console.log(`- **Date**: ${new Date().toISOString()}\n`);

  for (const file of files) {
    await analyzeFile(file);
  }
}

async function getDefaultVttFiles(): Promise<string[]> {
  const files: string[] = [];
  for await (const entry of Deno.readDir("data/output")) {
    if (entry.isFile && entry.name.endsWith(".vtt")) {
      files.push(`data/output/${entry.name}`);
    }
  }
  return files.sort();
}

async function analyzeFile(path: string): Promise<void> {
  const cues = await readVtt(path);
  const result = analyzeCueMonotonicity(cues);

  const filename = path.split("/").pop() || path;
  console.log(`\n## ${filename}\n`);
  console.log(`- Total cues: ${result.totalCues}`);
  console.log(
    `- Violations: ${result.violations.length} (${result.violationPct}%)`,
  );

  if (result.violations.length > 0) {
    console.log(`- With \`<|startoftranscript|>\`: ${result.overlapsWithTag}`);
    console.log(`- Max violation: ${result.maxViolation.toFixed(3)}s`);

    // Table output
    // Table output
    console.log(`\n<details>`);
    console.log(
      `<summary>Show ${result.violations.length} violations</summary>`,
    );

    console.log(
      `\n|        start |          end | overlap | text                                     |`,
    );
    console.log(
      `|-------------:|-------------:|--------:|------------------------------------------|`,
    );

    const padTime = (t: string) => {
      // Ensure HH:MM:SS.mmm format (12 chars)
      // Input might be MM:SS.mmm or HH:MM:SS.mmm
      if (t.length === 9) return "00:" + t;
      return t;
    };

    const fmtRow = (cue: VttCue, overlap?: number) => {
      const start = padTime(cue.startTime);
      const end = padTime(cue.endTime);

      const overlapStr = overlap !== undefined ? `${overlap.toFixed(3)}s` : "";

      const text = cue.text
        .replace(/[\r\n]+/g, " ")
        .substring(0, 40)
        .padEnd(40)
        .replace(/\|/g, "\\|");

      return `| ${start.padStart(13)} | ${
        end.padStart(
          13,
        )
      } | ${overlapStr.padStart(7)} | ${text} |`;
    };

    let lastPrinted = -1;

    // Use the ViolationDetails from the result which already has indices
    for (const v of result.violations) {
      const currIndex = v.index - 1; // The "context" cue (previous in list)
      const nextIndex = v.index; // The violating cue (current in list)

      // Print context row if not already printed
      if (lastPrinted !== currIndex) {
        console.log(fmtRow(cues[currIndex]));
      }

      // Print violating row with highlighted start time
      console.log(fmtRow(cues[nextIndex], v.overlap));
      lastPrinted = nextIndex;
    }
    console.log(`</details>`);
  }
}

interface MonotonicityResult {
  totalCues: number;
  violationPct: string;
  overlapsWithTag: number;
  maxViolation: number;
  violations: ViolationDetail[];
}

interface ViolationDetail {
  index: number; // Index of the violating cue
  overlap: number;
}

function analyzeCueMonotonicity(cues: VttCue[]): MonotonicityResult {
  const violations: ViolationDetail[] = [];
  let overlapsWithTag = 0;
  let maxViolation = 0;

  for (let i = 0; i < cues.length - 1; i++) {
    const curr = cues[i];
    const next = cues[i + 1];

    const currEnd = vttTimeToSeconds(curr.endTime);
    const nextStart = vttTimeToSeconds(next.startTime);

    if (nextStart < currEnd) {
      const overlap = currEnd - nextStart;
      if (overlap > maxViolation) maxViolation = overlap;

      const hasTag = next.text.includes("<|startoftranscript|>");
      if (hasTag) overlapsWithTag++;

      violations.push({
        index: i + 1,
        overlap,
      });
    }
  }

  return {
    totalCues: cues.length,
    violations,
    violationPct: (
      (violations.length / Math.max(cues.length - 1, 1)) *
      100
    ).toFixed(2),
    overlapsWithTag,
    maxViolation,
  };
}

export {
  analyzeCueMonotonicity,
  type MonotonicityResult,
  type ViolationDetail,
};
