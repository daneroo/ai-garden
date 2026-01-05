/**
 * VTT-VTT Comparison - Compare two VTT transcript files
 *
 * Single self-contained experimental module for comparing transcripts
 * from different Whisper engines/models/modes.
 *
 * Run: deno run -A lib/vtt-compare.ts
 */

import { readVtt, summarizeVtt, type VttCue, vttTimeToSeconds } from "./vtt.ts";

// Global verbose flag for diagnostics
const verbose = true;
const VERBOSITY_EMPTY_CUES = false;
const VERBOSITY_TIMEWORDS = false;
const VERBOSITY_DUPLICATE_NGRAMS = false;
const VERBOSITY_REJECTED_ANCHORS = false;
const VERBOSITY_MATCHED_ANCHORS = false;
const VERBOSITY_MONOTONICITY_VIOLATIONS = false;
const VERBOSITY_SPANS_GAPS = true;

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const RESET = "\x1b[0m";

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

if (import.meta.main) {
  await main();
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  // Available VTT files - uncomment pairs to compare:
  // const pathA = "data/output/hobbit.whispercpp-tiny.en-w1.vtt";
  // const pathA = "data/output/hobbit.whispercpp-tiny.en-wN.vtt";
  // const pathA = "data/output/hobbit.whispercpp-small.en-w1.vtt";
  // const pathA = "data/output/hobbit.whispercpp-small.en-wN.vtt";
  // const pathA = "data/output/hobbit.whisperkit-tiny.en-w1.vtt";
  // const pathA = "data/output/hobbit.whisperkit-tiny.en-wN.vtt";
  // const pathA = "data/output/hobbit.whisperkit-small.en-w1.vtt";
  // const pathA = "data/output/hobbit.whisperkit-small.en-wN.vtt";

  // Compare tiny vs small (same runner, same word-ts mode)
  const pathA = "data/output/hobbit.whispercpp-tiny.en-wN.vtt";
  const pathB = "data/output/hobbit.whispercpp-small.en-wN.vtt";

  console.log("# VTT-VTT Comparison\n");

  // Load VTT files
  const cuesA = await readVtt(pathA);
  const summaryA = summarizeVtt(cuesA);
  console.log(`Loaded: ${pathA}`);
  console.log(
    `  ${summaryA.cueCount} cues, ${
      summaryA.durationSec.toFixed(2)
    }s (${summaryA.firstCueStart} -> ${summaryA.lastCueEnd})`,
  );
  if (summaryA.monotonicityViolations === 0) {
    console.log(`  ${GREEN}✔${RESET} monotonicity violations: none\n`);
  } else {
    console.log(
      `  ${RED}✘${RESET} monotonicity violations: ${summaryA.monotonicityViolations} (max ${
        summaryA.monotonicityViolationMaxOverlap.toFixed(2)
      }s)\n`,
    );
  }

  const cuesB = await readVtt(pathB);
  const summaryB = summarizeVtt(cuesB);
  console.log(`Loaded: ${pathB}`);
  console.log(
    `  ${summaryB.cueCount} cues, ${
      summaryB.durationSec.toFixed(2)
    }s (${summaryB.firstCueStart} -> ${summaryB.lastCueEnd})`,
  );
  if (summaryB.monotonicityViolations === 0) {
    console.log(`  ${GREEN}✔${RESET} monotonicity violations: none\n`);
  } else {
    console.log(
      `  ${RED}✘${RESET} monotonicity violations: ${summaryB.monotonicityViolations} (max ${
        summaryB.monotonicityViolationMaxOverlap.toFixed(2)
      }s)\n`,
    );
  }

  // Tokenize: Convert to TimedWords
  console.log("## Tokenize\n");

  const wordsA = cuesToTimedWords(cuesA);
  console.log(`Transcript A: ${cuesA.length} cues -> ${wordsA.length} words`);
  if (verbose && VERBOSITY_TIMEWORDS) printSampleWords(wordsA, 10);

  const wordsB = cuesToTimedWords(cuesB);
  console.log(`Transcript B: ${cuesB.length} cues -> ${wordsB.length} words`);
  if (verbose && VERBOSITY_TIMEWORDS) printSampleWords(wordsB, 10);

  // Build n-gram indices
  console.log("\n## Build N-gram Indices\n");

  const n = 6; // n-gram size
  const indexA = buildNgramIndex(wordsA, n);
  const indexB = buildNgramIndex(wordsB, n);

  console.log(`N-gram size: ${n}`);

  showNGramIndex("A", indexA);
  showNGramIndex("B", indexB);

  // Find unique anchors
  console.log("\n## Find Unique Anchors\n");

  const anchors = findUniqueAnchors(indexA, indexB, wordsA, wordsB);
  showUniqueAnchors(anchors);

  // Merge anchors to spans
  console.log("\n## Merge Anchors to Spans\n");

  const spans = mergeAnchorsToSpans(anchors, n);
  const totalMatchedWords = spans.reduce(
    (sum, span) => sum + (span.spanA.end - span.spanA.start),
    0,
  );
  console.log(`Anchors: ${anchors.length} → Spans: ${spans.length}`);
  console.log(`Total matched words: ${totalMatchedWords}`);

  // Score
  console.log("\n## Score\n");

  const spanScore = computeScoreFromSpans(spans, wordsA, wordsB);
  showSpanScore(spanScore);
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKENIZE: VttCue[] → TimedWord[]
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert VTT cues to a flat array of timed words
 */
function cuesToTimedWords(cues: VttCue[]): TimedWord[] {
  const result: TimedWord[] = [];
  let wordIndex = 0;

  for (let cueIndex = 0; cueIndex < cues.length; cueIndex++) {
    const cue = cues[cueIndex];

    // Prenormalize: strip <|XX.XX|> tags
    const cleanText = prenormalize(cue.text);
    if (!cleanText.trim()) {
      if (verbose && VERBOSITY_EMPTY_CUES) {
        console.error(
          `  cueIndex: ${cueIndex} - EMPTY CUE: ${cue.startTime} --> ${cue.endTime} "${cue.text}"`,
        );
      }
      continue;
    }

    // Split to words
    const rawWords = cleanText.split(/\s+/).filter((w) => w.length > 0);
    if (rawWords.length === 0) {
      if (verbose) {
        console.error(
          `  cueIndex: ${cueIndex} - NO RAW WORDS: ${cue.startTime} --> ${cue.endTime} "${cue.text}"`,
        );
      }
      continue;
    }

    // Interpolate timestamps
    const startSec = vttTimeToSeconds(cue.startTime);
    const endSec = vttTimeToSeconds(cue.endTime);
    const duration = endSec - startSec;

    for (let i = 0; i < rawWords.length; i++) {
      const word = rawWords[i];
      const normalized = normalize(word);
      if (!normalized) {
        continue; // Skip words that normalize to empty
      }

      // Interpolate time: distribute words evenly across cue duration
      const time = startSec + (duration * i) / Math.max(rawWords.length - 1, 1);

      result.push({
        word,
        normalized,
        time,
        cueIndex,
        wordIndex: wordIndex++,
      });
    }
  }

  return result;
}

/**
 * Strip <|XX.XX|> timestamp tags from whisperkit output
 */
function prenormalize(text: string): string {
  // Remove <|startoftranscript|>, <|XX.XX|>, and similar tags
  return text.replace(/<\|[^|]*\|>/g, "").trim();
}

/**
 * Normalize a word: lowercase, remove punctuation
 * TODO: Handle compound words like "well-being" (currently becomes "wellbeing")
 */
function normalize(word: string): string {
  return word
    .toLowerCase()
    .replace(/[\W_]+/g, "") // Remove non-word characters
    .trim();
}

// ═══════════════════════════════════════════════════════════════════════════
// N-GRAM INDEXING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * N-gram index: hash -> array of positions where this n-gram starts
 */
type NgramIndex = Map<string, NgramPosition[]>;

interface NgramPosition {
  wordIndex: number; // Index of first word in the n-gram
  time: number; // Timestamp of first word
}

/**
 * Build an index of all n-grams in the word sequence
 */
function buildNgramIndex(words: TimedWord[], n: number): NgramIndex {
  const index: NgramIndex = new Map();

  for (let i = 0; i <= words.length - n; i++) {
    // Build the n-gram hash from normalized words
    const ngramWords: string[] = [];
    for (let j = 0; j < n; j++) {
      ngramWords.push(words[i + j].normalized);
    }
    const hash = ngramWords.join(" ");

    // Add this position to the index
    const position: NgramPosition = {
      wordIndex: words[i].wordIndex,
      time: words[i].time,
    };

    const existing = index.get(hash);
    if (existing) {
      existing.push(position);
    } else {
      index.set(hash, [position]);
    }
  }

  return index;
}

/**
 * Display statistics for an n-gram index: distinct count, singletons, and optionally duplicates.
 */
function showNGramIndex(label: string, index: NgramIndex): void {
  // Count singleton n-grams (appear exactly once) - these are anchor candidates
  let singletons = 0;
  for (const positions of index.values()) {
    if (positions.length === 1) singletons++;
  }

  const duplicateCount = index.size - singletons;
  console.log(
    `Transcript ${label}: ${index.size} distinct n-grams, ${singletons} appear only once`,
  );

  // Show duplicate n-grams if verbose
  if (verbose && VERBOSITY_DUPLICATE_NGRAMS && duplicateCount > 0) {
    console.log(`  Duplicates (${duplicateCount}):`);
    for (const [hash, positions] of index) {
      if (positions.length > 1) {
        const locs = positions
          .map((p) => `(${p.wordIndex}, ${toHMS(p.time)})`)
          .join(", ");
        console.log(`    "${hash}" × ${positions.length}: ${locs}`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FIND UNIQUE ANCHORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find n-grams that appear exactly once in BOTH transcripts.
 * These are reliable anchor points for alignment.
 */
function findUniqueAnchors(
  indexA: NgramIndex,
  indexB: NgramIndex,
  wordsA: TimedWord[],
  wordsB: TimedWord[],
): NGramMatch[] {
  const MAX_DRIFT_THRESHOLD = 6; // seconds - reject anchors with larger drift
  const anchors: NGramMatch[] = [];

  // Track statistics
  let matchedSingletons = 0; // n-grams that are singletons in BOTH transcripts
  let rejectedForDrift = 0; // rejected due to exceeding MAX_DRIFT_THRESHOLD

  // For each n-gram in A that appears exactly once
  for (const [hash, positionsA] of indexA) {
    if (positionsA.length !== 1) continue;

    // Check if it also appears exactly once in B
    const positionsB = indexB.get(hash);
    if (!positionsB || positionsB.length !== 1) continue;

    // This n-gram is a singleton in both A and B
    matchedSingletons++;

    // Filter out anchors with time drift > MAX_DRIFT_THRESHOLD
    const timeDelta = Math.abs(positionsA[0].time - positionsB[0].time);
    if (timeDelta > MAX_DRIFT_THRESHOLD) {
      rejectedForDrift++;
      if (verbose && VERBOSITY_REJECTED_ANCHORS) {
        printRejectionContext(
          hash,
          positionsA[0],
          positionsB[0],
          wordsA,
          wordsB,
          MAX_DRIFT_THRESHOLD,
        );
      }
      continue;
    }

    // Found a unique anchor!
    anchors.push({
      hash,
      posA: positionsA[0].wordIndex,
      posB: positionsB[0].wordIndex,
      timeA: positionsA[0].time,
      timeB: positionsB[0].time,
    });
  }

  // Output statistics
  console.log(`Singleton n-grams in both: ${matchedSingletons}`);
  console.log(
    `  Rejected for drift > ${MAX_DRIFT_THRESHOLD}s: ${rejectedForDrift}`,
  );
  console.log(`Matched anchors: ${anchors.length}`);

  // Sort anchors by position in A (required for mergeAnchorsToSpans)
  anchors.sort((a, b) => a.posA - b.posA);

  return anchors;
}

/**
 * Display unique anchor statistics and optionally list matched anchors.
 */
function showUniqueAnchors(anchors: NGramMatch[]): void {
  // Show matched anchors if verbose
  if (verbose && VERBOSITY_MATCHED_ANCHORS) {
    console.log(`\nMatched anchors:`);
    if (anchors.length === 0) {
      console.log(`  (none)`);
    } else {
      const n = 5;
      for (const anchor of anchors.slice(0, n)) {
        const drift = Math.abs(anchor.timeA - anchor.timeB).toFixed(2);
        console.log(
          `  "${anchor.hash}" posA:${anchor.posA} posB:${anchor.posB} drift:${drift}s`,
        );
      }
      if (anchors.length > n) {
        const hiddenCount = anchors.length - n * 2;
        if (hiddenCount > 0) {
          console.log(`  ... ${hiddenCount} more`);
        }
        for (const anchor of anchors.slice(-n)) {
          const drift = Math.abs(anchor.timeA - anchor.timeB).toFixed(2);
          console.log(
            `  "${anchor.hash}" posA:${anchor.posA} posB:${anchor.posB} drift:${drift}s`,
          );
        }
      }
    }
  }

  // Check and display monotonicity violations
  checkMonotonicity(anchors);
}

/**
 * Check monotonicity of all 4 fields.
 * Returns count of violations for each field and displays them if verbose.
 *
 * NOTE: The matching algorithm assumes monotonic timestamps and does NOT attempt
 * to compensate for monotonicity violations in the original VTT files (e.g. from WhisperKit).
 * Such violations in the source will appear here as violations in the matches.
 */
function checkMonotonicity(anchors: NGramMatch[]): {
  posA: number;
  posB: number;
  timeA: number;
  timeB: number;
} {
  let posACount = 0;
  let posBCount = 0;
  let timeACount = 0;
  let timeBCount = 0;

  // First pass: count violations
  for (let i = 0; i < anchors.length - 1; i++) {
    if (anchors[i + 1].posA < anchors[i].posA) posACount++;
    if (anchors[i + 1].posB < anchors[i].posB) posBCount++;
    if (anchors[i + 1].timeA < anchors[i].timeA) timeACount++;
    if (anchors[i + 1].timeB < anchors[i].timeB) timeBCount++;
  }

  const hasViolations = posACount > 0 || posBCount > 0 || timeACount > 0 ||
    timeBCount > 0;
  if (verbose) {
    if (!hasViolations) {
      console.log(`\nMonotonicity violations: none`);
    } else {
      console.log(`\nMonotonicity violations:`);

      if (VERBOSITY_MONOTONICITY_VIOLATIONS) {
        // Helper to format row
        const fmtRow = (
          a: NGramMatch,
          vPosA: boolean,
          vPosB: boolean,
          vTimeA: boolean,
          vTimeB: boolean,
        ) => {
          const posA = vPosA
            ? `${RED}${a.posA.toString().padStart(6)}${RESET}`
            : a.posA.toString().padStart(6);
          const posB = vPosB
            ? `${RED}${a.posB.toString().padStart(6)}${RESET}`
            : a.posB.toString().padStart(6);
          const timeA = vTimeA
            ? `${RED}${toHMS(a.timeA)}${RESET}`
            : toHMS(a.timeA);
          const timeB = vTimeB
            ? `${RED}${toHMS(a.timeB)}${RESET}`
            : toHMS(a.timeB);
          return `  | ${posA} | ${posB} | ${timeA} | ${timeB} | ${a.hash}`;
        };

        // Table output with lookahead
        console.log();
        console.log(`  | posA   | posB   | timeA        | timeB        | hash`);
        console.log(
          `  |--------|--------|--------------|--------------|------`,
        );

        let lastPrinted = -1;
        for (let i = 0; i < anchors.length - 1; i++) {
          const curr = anchors[i];
          const next = anchors[i + 1];

          const vPosA = next.posA < curr.posA;
          const vPosB = next.posB < curr.posB;
          const vTimeA = next.timeA < curr.timeA;
          const vTimeB = next.timeB < curr.timeB;

          if (vPosA || vPosB || vTimeA || vTimeB) {
            // Print current row as context if not already printed
            if (lastPrinted !== i) {
              console.log(fmtRow(curr, false, false, false, false));
            }
            // Print next row with violations highlighted
            console.log(fmtRow(next, vPosA, vPosB, vTimeA, vTimeB));
            lastPrinted = i + 1;
          }
        }
      }

      // Summary at the end
      console.log();
      console.log(`  posA:  ${posACount} violations`);
      console.log(`  posB:  ${posBCount} violations`);
      console.log(`  timeA: ${timeACount} violations`);
      console.log(`  timeB: ${timeBCount} violations`);
    }
  }

  return {
    posA: posACount,
    posB: posBCount,
    timeA: timeACount,
    timeB: timeBCount,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MERGE ANCHORS TO SPANS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Merge overlapping n-gram anchors into contiguous aligned spans.
 *
 * REQUIRES: anchors must be sorted by posA (as returned by findUniqueAnchors).
 *
 * Anchors are merged if they are contiguous in both A and B:
 * - next.posA === current.posA + 1
 * - next.posB === current.posB + 1
 * - (posB - posA) offset remains constant
 *
 * This preserves the high-confidence property of the matches.
 */
function mergeAnchorsToSpans(anchors: NGramMatch[], n: number): AlignedSpan[] {
  if (anchors.length === 0) {
    return [];
  }

  // Assert sorted by posA
  // TODO: refactor to reuse checkMonotonicity() in a flexible way
  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i].posA < anchors[i - 1].posA) {
      throw new Error(
        `mergeAnchorsToSpans: anchors not sorted by posA at index ${i}`,
      );
    }
  }

  const spans: AlignedSpan[] = [];

  // Initialize first span from first anchor
  let currentSpan: AlignedSpan = {
    spanA: { start: anchors[0].posA, end: anchors[0].posA + n },
    spanB: { start: anchors[0].posB, end: anchors[0].posB + n },
  };

  for (let i = 1; i < anchors.length; i++) {
    const curr = anchors[i];

    // Check if this anchor overlaps with or is contiguous to current span
    // Overlap means the anchor starts before the span ends
    const overlapsInA = curr.posA < currentSpan.spanA.end;
    const overlapsInB = curr.posB < currentSpan.spanB.end;

    if (overlapsInA && overlapsInB) {
      // Extend current span to include this anchor
      currentSpan.spanA.end = Math.max(currentSpan.spanA.end, curr.posA + n);
      currentSpan.spanB.end = Math.max(currentSpan.spanB.end, curr.posB + n);
    } else {
      // Push completed span and start a new one
      spans.push(currentSpan);
      currentSpan = {
        spanA: { start: curr.posA, end: curr.posA + n },
        spanB: { start: curr.posB, end: curr.posB + n },
      };
    }
  }

  // Push final span
  spans.push(currentSpan);

  return spans;
}

// ═══════════════════════════════════════════════════════════════════════════
// SCORE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute comparison score from aligned spans.
 * This provides accurate metrics without double-counting overlapping anchors.
 */
function computeScoreFromSpans(
  spans: AlignedSpan[],
  wordsA: TimedWord[],
  wordsB: TimedWord[],
): SpanScore {
  const totalWordsA = wordsA.length;
  const totalWordsB = wordsB.length;

  // Span metrics
  const spanCount = spans.length;
  const matchedWords = spans.reduce(
    (sum, span) => sum + (span.spanA.end - span.spanA.start),
    0,
  );
  const coverageA = totalWordsA > 0 ? matchedWords / totalWordsA : 0;
  const coverageB = totalWordsB > 0 ? matchedWords / totalWordsB : 0;

  // TODO: IMPORTANT - Gap calculation is a ROUGH ESTIMATE only!
  // Currently, gaps are calculated entirely with respect to stream A.
  // This works well when the two streams align closely, but gaps in A
  // may not correspond to gaps in B at all. The word indices and durations
  // are for stream A only. A proper gap analysis would need to consider
  // both streams and potentially show mismatched regions between them.
  //
  // Gap count: number of regions between spans (including before first and after last)
  // If spans are sorted, gaps = spanCount + 1, but we only count non-empty gaps
  let gapCount = 0;
  const gapHistoWords: Record<string, number> = {
    "1": 0,
    "2": 0,
    "3": 0,
    "4+": 0,
  };
  const gapHistoTime: Record<string, number> = {
    "<=1s": 0,
    "<=5s": 0,
    "<=10s": 0,
    ">10s": 0,
  };

  if (spans.length > 0) {
    const recordGap = (wordCount: number, duration: number) => {
      gapCount++;
      // Word histogram
      if (wordCount === 1) gapHistoWords["1"]++;
      else if (wordCount === 2) gapHistoWords["2"]++;
      else if (wordCount === 3) gapHistoWords["3"]++;
      else gapHistoWords["4+"]++;
      // Time histogram
      if (duration <= 1) gapHistoTime["<=1s"]++;
      else if (duration <= 5) gapHistoTime["<=5s"]++;
      else if (duration <= 10) gapHistoTime["<=10s"]++;
      else gapHistoTime[">10s"]++;
    };

    // Gap before first span
    if (spans[0].spanA.start > 0) {
      const duration = wordsA[spans[0].spanA.start].time - wordsA[0].time;
      recordGap(spans[0].spanA.start, duration);
    }
    // Gaps between spans
    for (let i = 1; i < spans.length; i++) {
      const gapStart = spans[i - 1].spanA.end;
      const gapEnd = spans[i].spanA.start;
      if (gapEnd > gapStart) {
        const duration = wordsA[gapEnd].time - wordsA[gapStart].time;
        recordGap(gapEnd - gapStart, duration);
      }
    }
    // Gap after last span
    if (spans[spans.length - 1].spanA.end < totalWordsA) {
      const gapStart = spans[spans.length - 1].spanA.end;
      const duration = wordsA[totalWordsA - 1].time - wordsA[gapStart].time;
      recordGap(totalWordsA - gapStart, duration);
    }
  }

  // Log gap histograms if verbose
  if (verbose && VERBOSITY_SPANS_GAPS && gapCount > 0) {
    const wordHistoParts = Object.entries(gapHistoWords)
      .filter(([_, count]) => count > 0)
      .map(([words, count]) => `${words} -> ${count}`);
    console.log(`  Gap Histo (words): ${wordHistoParts.join(", ")}`);

    const timeHistoParts = Object.entries(gapHistoTime)
      .filter(([_, count]) => count > 0)
      .map(([time, count]) => `${time} -> ${count}`);
    console.log(`  Gap Histo (time):  ${timeHistoParts.join(", ")}`);
  }

  // Drift metrics: computed from span start positions
  let totalDrift = 0;
  let maxDrift = 0;
  for (const span of spans) {
    const timeA = wordsA[span.spanA.start].time;
    const timeB = wordsB[span.spanB.start].time;
    const drift = Math.abs(timeA - timeB);
    totalDrift += drift;
    if (drift > maxDrift) maxDrift = drift;
  }
  const avgDrift = spanCount > 0 ? totalDrift / spanCount : 0;

  // Matched duration: sum of time spans covered by matched regions
  let matchedDurationA = 0;
  let matchedDurationB = 0;
  for (const span of spans) {
    const startTimeA = wordsA[span.spanA.start].time;
    const endTimeA = wordsA[span.spanA.end - 1].time;
    matchedDurationA += endTimeA - startTimeA;

    const startTimeB = wordsB[span.spanB.start].time;
    const endTimeB = wordsB[span.spanB.end - 1].time;
    matchedDurationB += endTimeB - startTimeB;
  }

  return {
    totalWordsA,
    totalWordsB,
    spanCount,
    matchedWords,
    matchedDurationA,
    matchedDurationB,
    coverageA,
    coverageB,
    gapCount,
    avgDrift,
    maxDrift,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function printSampleWords(words: TimedWord[], count: number): void {
  const sample = words.slice(0, count);
  for (const w of sample) {
    console.log(
      `  [${w.wordIndex}] ${
        w.time.toFixed(2)
      }s: "${w.word}" → "${w.normalized}"`,
    );
  }
  if (words.length > count) {
    console.log(`  ... and ${words.length - count} more`);
  }
  console.log();
}

function showSpanScore(spanScore: SpanScore): void {
  console.log(`Span count:        ${spanScore.spanCount}`);
  console.log(`Matched words:     ${spanScore.matchedWords}`);
  console.log(
    `Matched duration A/B: ${toHMS(spanScore.matchedDurationA)}, ${
      toHMS(
        spanScore.matchedDurationB,
      )
    }`,
  );
  console.log(
    `Coverage A/B:      ${(spanScore.coverageA * 100).toFixed(2)}%, ${
      (
        spanScore.coverageB * 100
      ).toFixed(2)
    }%`,
  );
  console.log(`Gap count:         ${spanScore.gapCount}`);
  console.log(`Avg drift:         ${spanScore.avgDrift.toFixed(3)}s`);
  console.log(`Max drift:         ${spanScore.maxDrift.toFixed(3)}s`);
}

/**
 * Print detailed context for a rejected anchor match.
 * Shows words before and after the n-gram in both transcripts.
 */
function printRejectionContext(
  hash: string,
  posA: NgramPosition,
  posB: NgramPosition,
  wordsA: TimedWord[],
  wordsB: TimedWord[],
  maxTimeDelta: number,
): void {
  const timeDelta = Math.abs(posA.time - posB.time);
  const contextSize = 10; // words before and after

  console.error(
    `  REJECTED: "${hash}" drift:${timeDelta.toFixed(2)}s > ${maxTimeDelta}s`,
  );
  console.error(
    `    in A: pos:${posA.wordIndex} time:${posA.time.toFixed(2)}s (${
      toHMS(
        posA.time,
      )
    })`,
  );
  console.error(
    `    in B: pos:${posB.wordIndex} time:${posB.time.toFixed(2)}s (${
      toHMS(
        posB.time,
      )
    })`,
  );

  // Extract context for A
  const startA = Math.max(0, posA.wordIndex - contextSize);
  const endA = Math.min(
    wordsA.length,
    posA.wordIndex + hash.split(" ").length + contextSize,
  );
  const contextWordsA = wordsA.slice(startA, endA).map((w) => w.normalized);
  const ngramLen = hash.split(" ").length;
  const highlightStartA = posA.wordIndex - startA;
  const highlightEndA = highlightStartA + ngramLen;

  // Build context string with markers
  const beforeA = contextWordsA.slice(0, highlightStartA).join(" ");
  const matchA = contextWordsA.slice(highlightStartA, highlightEndA).join(" ");
  const afterA = contextWordsA.slice(highlightEndA).join(" ");
  console.error(`    A context: ...${beforeA} [${matchA}] ${afterA}...`);

  // Extract context for B
  const startB = Math.max(0, posB.wordIndex - contextSize);
  const endB = Math.min(wordsB.length, posB.wordIndex + ngramLen + contextSize);
  const contextWordsB = wordsB.slice(startB, endB).map((w) => w.normalized);
  const highlightStartB = posB.wordIndex - startB;
  const highlightEndB = highlightStartB + ngramLen;

  // Build context string with markers
  const beforeB = contextWordsB.slice(0, highlightStartB).join(" ");
  const matchB = contextWordsB.slice(highlightStartB, highlightEndB).join(" ");
  const afterB = contextWordsB.slice(highlightEndB).join(" ");
  console.error(`    B context: ...${beforeB} [${matchB}] ${afterB}...`);
  console.error(); // blank line for readability
}

/**
 * Convert seconds to VTT-style HH:MM:SS.mmm format
 */
function toHMS(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${
    s
      .toFixed(3)
      .padStart(6, "0")
  }`;
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════

interface TimedWord {
  word: string; // After prenormalize (tags stripped)
  normalized: string; // Lowercase, no punctuation
  time: number; // Seconds (interpolated within cue)
  cueIndex: number; // Source cue for traceability
  wordIndex: number; // Global word index (unique identifier)
}

interface NGramMatch {
  hash: string; // Normalized words joined by space
  posA: number; // wordIndex of first word in transcript A
  posB: number; // wordIndex of first word in transcript B
  timeA: number; // Timestamp in A
  timeB: number; // Timestamp in B
}

interface WordSpan {
  start: number; // wordIndex (inclusive)
  end: number; // wordIndex (exclusive)
}

interface AlignedSpan {
  spanA: WordSpan;
  spanB: WordSpan;
  // For matches: spanA.end - spanA.start === spanB.end - spanB.start
  // For gaps: lengths may differ
}

interface SpanScore {
  // Word counts
  totalWordsA: number;
  totalWordsB: number;

  // Span metrics
  spanCount: number; // Number of aligned spans
  matchedWords: number; // Sum of span lengths (no double-counting)
  matchedDurationA: number; // Sum of time spans in A (seconds)
  matchedDurationB: number; // Sum of time spans in B (seconds)
  coverageA: number; // matchedWords / totalWordsA
  coverageB: number; // matchedWords / totalWordsB

  // Gap metrics
  gapCount: number; // Regions between spans

  // Drift metrics
  avgDrift: number; // Mean |timeA - timeB| at span starts
  maxDrift: number; // Worst drift
}

// Export for potential testing
export {
  cuesToTimedWords,
  type NGramMatch,
  normalize,
  prenormalize,
  type SpanScore,
  type TimedWord,
};
