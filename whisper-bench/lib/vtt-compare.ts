/**
 * VTT-VTT Comparison - Compare two VTT transcript files
 *
 * Single self-contained experimental module for comparing transcripts
 * from different Whisper engines/models/modes.
 *
 * Run: bun run lib/vtt-compare.ts
 */

import { readVtt, type VttCue, vttTimeToSeconds } from "./vtt.ts";

// Global verbose flag for diagnostics
const verbose = false;

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
  const pathA = "data/output/hobbit.whispercpp.vtt";
  const pathB = "data/output/hobbit.whisperkit.vtt";

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

  // Phase 2: TODO
  console.log("\n--- Phase 2: Build N-gram Indices ---\n");
  console.log("(not yet implemented)\n");

  // Phase 3: TODO
  console.log("--- Phase 3: Find Unique Anchors ---\n");
  console.log("(not yet implemented)\n");

  // Phase 4: TODO
  console.log("--- Phase 4: Score ---\n");
  console.log("(not yet implemented)\n");
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
      if (verbose) {
        console.error(
          `  cueIndex: ${cueIndex} - EMPTY CUE: ${cue.startTime} --> ${cue.endTime} "${cue.text}"`
        );
      }
      continue;
    }

    // Split to words
    const rawWords = cleanText.split(/\s+/).filter((w) => w.length > 0);
    if (rawWords.length === 0) {
      if (verbose) {
        console.error(
          `  cueIndex: ${cueIndex} - NO RAW WORDS: ${cue.startTime} --> ${cue.endTime} "${cue.text}"`
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

// TODO: Implement buildNgramIndex()

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 3: Find Unique Anchors
// ═══════════════════════════════════════════════════════════════════════════

// TODO: Implement findUniqueAnchors()

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 4: Score
// ═══════════════════════════════════════════════════════════════════════════

// TODO: Implement score()

// ═══════════════════════════════════════════════════════════════════════════
// OUTPUT HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function printSampleWords(words: TimedWord[], count: number): void {
  const sample = words.slice(0, count);
  for (const w of sample) {
    console.log(
      `  [${w.wordIndex}] ${w.time.toFixed(2)}s: "${w.word}" → "${
        w.normalized
      }"`
    );
  }
  if (words.length > count) {
    console.log(`  ... and ${words.length - count} more`);
  }
  console.log();
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
