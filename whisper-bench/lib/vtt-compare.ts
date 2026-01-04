/**
 * VTT-VTT Comparison - Compare two VTT transcript files
 *
 * Single self-contained experimental module for comparing transcripts
 * from different Whisper engines/models/modes.
 *
 * Run: deno run -A lib/vtt-compare.ts
 */

import { readVtt, type VttCue, vttTimeToSeconds } from "./vtt.ts";

// Global verbose flag for diagnostics
const verbose = true;
const VERBOSITY_EMPTY_CUES = false;
const VERBOSITY_DUPLICATE_NGRAMS = false;
const VERBOSITY_REJECTED_ANCHORS = false;
const VERBOSITY_MATCHED_ANCHORS = false;

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
  const pathA = "data/output/hobbit.whisperkit-tiny.en-wN.vtt";
  const pathB = "data/output/hobbit.whisperkit-small.en-wN.vtt";

  console.log("=== VTT-VTT Comparison ===\n");

  // Load VTT files
  console.log(`Loading: ${pathA}`);
  const cuesA = await readVtt(pathA);
  console.log(`  → ${cuesA.length} cues\n`);

  console.log(`Loading: ${pathB}`);
  const cuesB = await readVtt(pathB);
  console.log(`  → ${cuesB.length} cues\n`);

  // Phase 1: Convert to TimedWords
  console.log("--- Phase 1: Tokenize to Words ---\n");

  const wordsA = cuesToTimedWords(cuesA);
  console.log(`Transcript A: ${wordsA.length} words`);
  printSampleWords(wordsA, 10);

  const wordsB = cuesToTimedWords(cuesB);
  console.log(`Transcript B: ${wordsB.length} words`);
  printSampleWords(wordsB, 10);

  // Phase 2: Build n-gram indices
  console.log("\n--- Phase 2: Build N-gram Indices ---\n");

  const n = 6; // n-gram size
  const indexA = buildNgramIndex(wordsA, n);
  const indexB = buildNgramIndex(wordsB, n);

  console.log(`N-gram size: ${n}`);

  showNGramIndex("A", indexA);
  showNGramIndex("B", indexB);

  // Phase 3: Find unique anchors
  console.log("\n--- Phase 3: Find Unique Anchors ---\n");

  const anchors = findUniqueAnchors(indexA, indexB, wordsA, wordsB);
  showUniqueAnchors(anchors);

  // Phase 4: Score
  console.log("\n--- Phase 4: Score ---\n");

  const score = computeScore(anchors, wordsA.length, wordsB.length);
  console.log(`Anchor count:      ${score.anchorCount}`);
  console.log(`Anchor density:    ${(score.anchorDensity * 100).toFixed(2)}%`);
  console.log(`Avg temporal drift: ${score.avgTemporalDrift.toFixed(3)}s`);
  console.log(`Max temporal drift: ${score.maxTemporalDrift.toFixed(3)}s`);
  console.log(`Coverage:          ${(score.coverage * 100).toFixed(2)}%`);

  // Find and show the max drift anchor
  if (anchors.length > 0) {
    let maxDriftAnchor = anchors[0];
    for (const anchor of anchors) {
      const drift = Math.abs(anchor.timeA - anchor.timeB);
      if (drift > Math.abs(maxDriftAnchor.timeA - maxDriftAnchor.timeB)) {
        maxDriftAnchor = anchor;
      }
    }
    const maxDrift = Math.abs(maxDriftAnchor.timeA - maxDriftAnchor.timeB);
    console.log(`\nMax drift anchor: "${maxDriftAnchor.hash}"`);
    console.log(
      `  in A: pos:${maxDriftAnchor.posA} time:${
        maxDriftAnchor.timeA.toFixed(
          2,
        )
      }s`,
    );
    console.log(
      `  in B: pos:${maxDriftAnchor.posB} time:${
        maxDriftAnchor.timeB.toFixed(
          2,
        )
      }s`,
    );
    console.log(`  drift: ${maxDrift.toFixed(2)}s`);
  }

  console.log(`\nOverall score:     ${score.overallScore.toFixed(1)}/100`);
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: VttCue[] → TimedWord[]
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
// PHASE 2: N-gram Indexing
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
// PHASE 3: Find Unique Anchors
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
  const MAX_DRIFT_THRESHOLD = 10; // seconds - reject anchors with larger drift
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

  // Sort anchors by position in A - but could be another criteria
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
  const violations = checkMonotonicity(anchors);
  const hasViolations = violations.posA > 0 ||
    violations.posB > 0 ||
    violations.timeA > 0 ||
    violations.timeB > 0;
  if (hasViolations) {
    console.log(`\nMonotonicity violations:`);
    console.log(`  posA:  ${violations.posA} violations`);
    console.log(`  posB:  ${violations.posB} violations`);
    console.log(`  timeA: ${violations.timeA} violations`);
    console.log(`  timeB: ${violations.timeB} violations`);
  }
}

/**
 * Check monotonicity of all 4 fields.
 * Returns count of violations for each field.
 */
function checkMonotonicity(anchors: NGramMatch[]): {
  posA: number;
  posB: number;
  timeA: number;
  timeB: number;
} {
  let posA = 0;
  let posB = 0;
  let timeA = 0;
  let timeB = 0;

  for (let i = 1; i < anchors.length; i++) {
    if (anchors[i].posA < anchors[i - 1].posA) posA++;
    if (anchors[i].posB < anchors[i - 1].posB) posB++;
    if (anchors[i].timeA < anchors[i - 1].timeA) timeA++;
    if (anchors[i].timeB < anchors[i - 1].timeB) timeB++;
  }

  return { posA, posB, timeA, timeB };
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: Score
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compute comparison score from anchors.
 */
function computeScore(
  anchors: NGramMatch[],
  wordsA: number,
  wordsB: number,
): ComparisonScore {
  const anchorCount = anchors.length;
  const avgWords = (wordsA + wordsB) / 2;

  // Anchor density: anchors per word (how many words are "pinned")
  // Each anchor covers n words, but we count the starting word
  const anchorDensity = anchorCount / avgWords;

  // Temporal drift statistics
  let totalDrift = 0;
  let maxDrift = 0;
  for (const anchor of anchors) {
    const drift = Math.abs(anchor.timeA - anchor.timeB);
    totalDrift += drift;
    if (drift > maxDrift) maxDrift = drift;
  }
  const avgTemporalDrift = anchorCount > 0 ? totalDrift / anchorCount : 0;
  const maxTemporalDrift = maxDrift;

  // Coverage: rough estimate of how much of the text is covered by anchors
  // If we have many anchors distributed throughout, coverage is high
  const coverage = Math.min(1.0, anchorCount / (avgWords / 4)); // Rough: 1 anchor per 4 words = 100%

  // Overall score: weighted combination (0-100)
  // Higher is better: more anchors, lower drift, higher coverage
  const densityScore = Math.min(100, anchorDensity * 100 * 1.5); // Weight density
  const driftPenalty = Math.min(50, avgTemporalDrift * 5); // Penalize drift
  const coverageBonus = coverage * 30;
  const overallScore = Math.max(
    0,
    Math.min(100, densityScore - driftPenalty + coverageBonus),
  );

  return {
    anchorCount,
    anchorDensity,
    avgTemporalDrift,
    maxTemporalDrift,
    coverage,
    overallScore,
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

interface ComparisonScore {
  anchorCount: number; // Matched unique n-grams
  anchorDensity: number; // anchors / total words
  avgTemporalDrift: number; // Mean |timeA - timeB| at anchors
  maxTemporalDrift: number; // Worst drift
  coverage: number; // % of words covered by anchors
  overallScore: number; // 0-100 composite
}

// Export for potential testing
export {
  type ComparisonScore,
  cuesToTimedWords,
  type NGramMatch,
  normalize,
  prenormalize,
  type TimedWord,
};
