export type AlignedWord = {
  word: string;
  index: number;
  matched: boolean;
};

export type AlignmentResult = {
  alignedCues: AlignedWord[];
  alignedText: AlignedWord[];
  matchingRate: number;
};

export function alignWords(
  cueWords: string[],
  textWords: string[],
  maxSkip: number
): AlignmentResult {
  const m = cueWords.length;
  const n = textWords.length;

  const alignedCues: AlignedWord[] = [];
  const alignedText: AlignedWord[] = [];
  let i = 0,
    j = 0;

  // Helper function to find the next match within a window
  function findNextMatch(i: number, j: number, window: number) {
    for (let offset = 1; offset <= window; offset++) {
      if (i + offset < m && cueWords[i + offset] === textWords[j]) {
        return { skipInCues: offset, skipInText: 0 };
      }
      if (j + offset < n && cueWords[i] === textWords[j + offset]) {
        return { skipInCues: 0, skipInText: offset };
      }
      if (
        i + offset < m &&
        j + offset < n &&
        cueWords[i + offset] === textWords[j + offset]
      ) {
        return { skipInCues: offset, skipInText: offset };
      }
    }
    return null;
  }

  while (i < m && j < n) {
    if (cueWords[i] === textWords[j]) {
      alignedCues.push({ word: cueWords[i], index: i, matched: true });
      alignedText.push({ word: textWords[j], index: j, matched: true });
      i++;
      j++;
    } else {
      const match = findNextMatch(i, j, maxSkip);
      if (match) {
        // Backfill insertions or deletions
        for (let k = 0; k < match.skipInCues; k++) {
          alignedCues.push({
            word: cueWords[i + k],
            index: i + k,
            matched: false,
          });
          alignedText.push({ word: "", index: -1, matched: false });
        }
        for (let k = 0; k < match.skipInText; k++) {
          alignedCues.push({ word: "", index: -1, matched: false });
          alignedText.push({
            word: textWords[j + k],
            index: j + k,
            matched: false,
          });
        }
        i += match.skipInCues;
        j += match.skipInText;
      } else {
        throw new Error(`Insertions/deletions exceed threshold of ${maxSkip}`);
      }
    }
  }

  // Handle remaining words
  while (i < m) {
    alignedCues.push({ word: cueWords[i], index: i, matched: false });
    alignedText.push({ word: "", index: -1, matched: false });
    i++;
  }
  while (j < n) {
    alignedCues.push({ word: "", index: -1, matched: false });
    alignedText.push({ word: textWords[j], index: j, matched: false });
    j++;
  }

  // Calculate matched count
  const matchedCount = alignedCues.filter((word) => word.matched).length;

  // Calculate matching rate
  const matchingRate = matchedCount / Math.max(m, n);

  return { alignedCues, alignedText, matchingRate };
}

// If this module is the main module, then call the main function
if (import.meta.main) {
  // Example usage:
  const cues = ["this", "is", "a", "sentence"];
  const text = ["this", "is", "another", "sentence"];
  const maxSkip = 3;

  const result = alignWords(cues, text, maxSkip);
  console.log("Aligned Cues:", result.alignedCues);
  console.log("Aligned Text:", result.alignedText);
  console.log("Matching Rate:", result.matchingRate);
}
