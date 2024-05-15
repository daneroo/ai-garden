export function alignWords(
  cueWords: string[],
  textWords: string[],
  maxSkip: number
): { alignedCues: string[]; alignedText: string[] } {
  const m = cueWords.length;
  const n = textWords.length;

  const alignedCues = [];
  const alignedText = [];
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
      alignedCues.push(cueWords[i]);
      alignedText.push(textWords[j]);
      i++;
      j++;
    } else {
      const match = findNextMatch(i, j, maxSkip);
      if (match) {
        // Backfill insertions or deletions
        for (let k = 0; k < match.skipInCues; k++) {
          alignedCues.push(cueWords[i + k]);
          alignedText.push("");
        }
        for (let k = 0; k < match.skipInText; k++) {
          alignedCues.push("");
          alignedText.push(textWords[j + k]);
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
    alignedCues.push(cueWords[i]);
    alignedText.push("");
    i++;
  }
  while (j < n) {
    alignedCues.push("");
    alignedText.push(textWords[j]);
    j++;
  }

  return { alignedCues, alignedText };
}

// If this module is the main module, then call the main function
if (import.meta.main) {
  // Example usage:
  const cues = ["this", "is", "a", "sentence"];
  const text = ["this", "is", "another", "sentence"];
  const maxSkip = 1;

  const { alignedCues, alignedText } = alignWords(cues, text, maxSkip);
  console.log("Aligned Cues:", alignedCues);
  console.log("Aligned Text:", alignedText);
}
