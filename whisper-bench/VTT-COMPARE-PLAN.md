# VTT-VTT Comparison Algorithm Design

> **Location**: `whisper-bench/lib/vtt-compare.ts` (single self-contained file)
> **Dependencies**: Only `lib/vtt.ts` for parsing

## Problem Statement

Compare two VTT transcript files to score their similarity.

### Sources of Variation

| Factor               | Examples                                            |
| -------------------- | --------------------------------------------------- |
| Runner engine        | whisper-cpp, whisperkit                             |
| Word timestamps mode | `--max-len`, `--split-on-word`, `--word-timestamps` |
| Model                | tiny, base, small, medium, large-v3                 |
| Non-determinism      | Two runs may produce slightly different output      |

---

## VTT Format Differences

**whisper-cpp:**

```vtt
00:00:10.600 --> 00:00:15.500
 read by Andy Serkis.
```

**whisperkit:**

```vtt
00:10.079 --> 00:12.159
<|10.08|> read by Andy Serkis.<|12.16|>
```

---

## Data Structures

### TimedWord

```txt
interface TimedWord {
  word: string; // After prenormalize (tags stripped)
  normalized: string; // Lowercase, no punctuation
  time: number; // Seconds (interpolated within cue)
  cueIndex: number; // Source cue for traceability
  wordIndex: number; // Global word index (unique identifier)
}
```

> The `(time, cueIndex)` pair provides traceability back to source. The
> `wordIndex` is the position in the flattened word sequence.

### NGramMatch

```typescript
interface NGramMatch {
  hash: string; // Normalized words joined by space
  posA: number; // wordIndex of first word in transcript A
  posB: number; // wordIndex of first word in transcript B
  timeA: number; // Timestamp in A
  timeB: number; // Timestamp in B
}
```

---

## Algorithm Overview (4 Phases)

```txt
┌─────────────┐     ┌─────────────┐
│   VTT A     │     │   VTT B     │
└──────┬──────┘     └──────┬──────┘
       │                   │
       ▼                   ▼
┌─────────────────────────────────┐
│  Phase 1: VttCue[] → TimedWord[]│
│  • prenormalize (strip <|X|>)   │
│  • filter empty cues            │
│  • split to words               │
│  • normalize each word          │
│  • interpolate timestamps       │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Phase 2: Build N-gram Indices  │
│  (count occurrences in each)    │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Phase 3: Find Unique Anchors   │
│  (filtered unique n-grams)      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│  Phase 4: Score                 │
│  (metrics & coverage)           │
└─────────────────────────────────┘
```

### Phase 3 Logic

- **Uniqueness**: Identify n-grams appearing exactly once in _both_ transcripts.
- **Drift Filter**: Reject matches where `|timeA - timeB| > MAX_DRIFT_THRESHOLD`
  (default: 10s).
- **Monotonicity**: Advisory only; detects matches that violate time sequence
  ordering but does not reject them.

### Phase 4 Metrics

- **Anchor Density**: % of words "pinned" by anchors.
- **Temporal Drift**: Average and max time difference.
- **Coverage**: Estimate of text covered by anchors.

### Phase 1 Functions

```txt
// Strip <|XX.XX|> tags from whisperkit output
function prenormalize(text: string): string;

// Lowercase, remove punctuation
function normalize(word: string): string;

// Main conversion: cues → words with timing
function cuesToTimedWords(cues: VttCue[]): TimedWord[];
```

### Phase 1 Pipeline

```txt
Raw:   "<|10.08|> read by Andy Serkis.<|12.16|>"
       ↓ prenormalize
Clean: "read by Andy Serkis."
       ↓ split + filter empty
Words: ["read", "by", "Andy", "Serkis."]
       ↓ normalize each
Norm:  ["read", "by", "andy", "serkis"]
       ↓ interpolate time + assign wordIndex
TimedWords: [{word:"read", normalized:"read", time:10.08, cueIndex:0, wordIndex:0}, ...]
```

---

## Scoring

```txt
interface ComparisonScore {
  anchorCount: number; // Matched unique n-grams
  anchorDensity: number; // anchors / total words
  avgTemporalDrift: number; // Mean |timeA - timeB| at anchors
  maxTemporalDrift: number; // Worst drift
  coverage: number; // % of words covered by anchors
  overallScore: number; // 0-100 composite
}
```

---

## Design Decisions

| Decision           | Choice                    | Rationale                      |
| ------------------ | ------------------------- | ------------------------------ |
| Code location      | Single `vtt-compare.ts`   | Isolated experiment            |
| Empty cues         | Filter out during Phase 1 | Some VTT cues are empty        |
| Temporal filtering | Part of scoring           | Simpler first pass             |
| Prenormalization   | Strip `<\|XX.XX\|>` tags  | Unify engine formats           |
| N-gram size        | n=4 (parameterizable)     | Balance uniqueness vs coverage |

## Resolved Decisions

| Question                      | Resolution                                             |
| ----------------------------- | ------------------------------------------------------ |
| Compound words ("well-being") | Skip for now, add TODO comment in normalize()          |
| Output format                 | Console only, keep reporting isolated for easy changes |

---

## Code Structure

**Calling code precedes called code:**

```txt
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
  // Phase 1, 2, 3, 4...
}

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 1: VttCue[] → TimedWord[]
// ═══════════════════════════════════════════════════════════════════════════

function cuesToTimedWords(cues: VttCue[]): TimedWord[] { ... }
function prenormalize(text: string): string { ... }
function normalize(word: string): string { ... }

// ═══════════════════════════════════════════════════════════════════════════
// PHASE 2: N-gram Indexing
// ═══════════════════════════════════════════════════════════════════════════

// ...

// ═══════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════

interface TimedWord { ... }
interface NGramMatch { ... }
interface ComparisonScore { ... }
```

---

## Validation

### Phase 1-2: Tokenization and N-gram Indexing

Working as expected. Cues are correctly parsed, words are normalized, and n-gram
indices are built with accurate occurrence counts.

**N-gram deduplication validated**: With n=6, 153 n-grams (out of 90,966) appear
more than once in transcript A. These duplicates are legitimate repeated
elements: audiobook metadata (title/author at start and end), song lyrics
("under the mountain dark and tall"), catchphrases ("yes yes yes yes yes yes"),
and common narrative phrases. The `showNGramIndex()` function can display all
duplicates when `VERBOSITY_DUPLICATE_NGRAMS=true`.

### Phase 3: Anchor Matching

Validated with `n=6` and `MAX_DRIFT_THRESHOLD=10s`:

- **Uniqueness filter**: Correctly identifies n-grams appearing exactly once in
  both transcripts.
- **Drift threshold (10s)**: Rejects false matches where the same phrase appears
  at different times in the narrative (e.g., repeated song lyrics, common
  phrases in different scenes). Manual inspection confirmed these rejections are
  legitimate.
- **Monotonicity check**: Advisory only. Reports violations but does not reject
  anchors. Some time-ordering violations occur due to minor timestamp
  interpolation differences.

**Example validated rejection** (n=6):

```txt
REJECTED: "as soon as the door was" drift:69.93s > 10s
  A context: ...dark green hood [as soon as the door was] opened he pushed inside...
  B context: ...scarlet hood [as soon as the door was] open just as if hed been...
```

This phrase appears when different dwarves arrive at Bilbo's door ~70 seconds
apart — a legitimate false match correctly filtered out.

### Phase 4: Scoring

Metrics computed correctly. With n=6 on whisperkit-tiny vs whisperkit-small:

- Anchor count: ~67,000
- Anchor density: ~76%
- Average drift: ~0.26s
- Coverage: 100%
