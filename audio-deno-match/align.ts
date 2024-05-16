export type AlignedMatch = {
  indexA: number; // Index into cueWords, -1 for words only in textWords
  indexB: number; // Index into textWords, -1 for words only in cueWords
  type: "insertion" | "substitution" | "match";
};

export type AlignmentResult = {
  alignedMatches: AlignedMatch[];
  matchingRate: number;
};

export function alignWords(
  cueWords: string[],
  textWords: string[],
  maxSkip: number
): AlignmentResult {
  const m = cueWords.length;
  const n = textWords.length;

  const alignedMatches: AlignedMatch[] = [];
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
      alignedMatches.push({ indexA: i, indexB: j, type: "match" });
      i++;
      j++;
    } else {
      const match = findNextMatch(i, j, maxSkip);
      if (!match) {
        throw new Error(
          `findNextMatch exceeded window threshold of ${maxSkip}`
        );
      }
      if (match.skipInCues === 0 || match.skipInText === 0) {
        // Handle insertions
        for (let k = 0; k < match.skipInCues; k++) {
          alignedMatches.push({
            indexA: i + k,
            indexB: -1,
            type: "insertion",
          });
        }
        for (let k = 0; k < match.skipInText; k++) {
          alignedMatches.push({
            indexA: -1,
            indexB: j + k,
            type: "insertion",
          });
        }
        i += match.skipInCues;
        j += match.skipInText;
      } else {
        // Single word difference (substitution)
        alignedMatches.push({
          indexA: i,
          indexB: j,
          type: "substitution",
        });
        i++;
        j++;
      }
    }
  }

  // Handle remaining words symmetrically
  while (i < m) {
    alignedMatches.push({
      indexA: i,
      indexB: -1,
      type: "insertion",
    });
    i++;
  }
  while (j < n) {
    alignedMatches.push({
      indexA: -1,
      indexB: j,
      type: "insertion",
    });
    j++;
  }

  // Calculate matched count
  const matchedCount = alignedMatches.filter(
    (match) => match.type === "match"
  ).length;

  // Calculate matching rate
  const matchingRate = matchedCount / Math.max(m, n);

  return { alignedMatches, matchingRate };
}

function green(str: string): string {
  return `\x1b[32m${str}\x1b[0m`; // Green color
}

function blue(str: string): string {
  return `\x1b[34m${str}\x1b[0m`; // Blue color
}

function red(str: string): string {
  return `\x1b[31m${str}\x1b[0m`; // Red color
}

export function prettyPrint(
  alignedMatches: AlignedMatch[],
  cueWords: string[],
  textWords: string[]
): void {
  let cueLine = "";
  let textLine = "";

  const upDownArrow = green("↕"); // Green "↕" symbol
  const upArrow = blue("↑"); // Blue "↑" symbol
  const downArrow = blue("↓"); // Blue "↑" symbol
  // so we add the same number of control chars for str length alignment
  const emptyPad = blue(""); // Blue "" symbol

  alignedMatches.forEach((match) => {
    const { indexA, indexB, type } = match;

    const cueWord = indexA !== -1 ? cueWords[indexA] : "";
    const textWord = indexB !== -1 ? textWords[indexB] : "";

    switch (type) {
      case "match":
        cueLine += cueWord;
        textLine += textWord;
        break;
      case "substitution":
        cueLine += upDownArrow + green(cueWord);
        textLine += upDownArrow + green(textWord);
        break;
      case "insertion":
        if (indexA === -1) {
          cueLine += downArrow;
          // textLine += emptyPad + textWord;
          textLine += red(textWord);
        } else {
          // cueLine += emptyPad + cueWord;
          cueLine += red(cueWord);
          textLine += upArrow;
        }
        break;
    }
    // Calculate padding to align symbols
    const maxLength = Math.max(cueLine.length, cueLine.length);
    // +1 is for space between words; but the joined string is trimmed to remove the last space
    cueLine = cueLine.padEnd(maxLength + 1, " ");
    textLine = textLine.padEnd(maxLength + 1, " ");
    if (textLine.length > 80) {
      if (textLine === cueLine) {
        console.log("same: ", cueLine.trim());
      } else {
        console.log("cue:  ", cueLine.trim());
        console.log("text: ", textLine.trim());
      }
      console.log("");
      cueLine = "";
      textLine = "";
    }
  });

  console.log("cue:  ", cueLine.trim());
  console.log("text: ", textLine.trim());
}

// If this module is the main module, then call the main function
if (import.meta.main) {
  // Example usage:
  const cueWords = ["this", "is", "a", "sentence"];
  const textWords = [
    "this",
    "is",
    "another",
    "sentence",
    "which",
    "is",
    "longer",
  ];
  const maxSkip = 3;

  const { alignedMatches, matchingRate } = alignWords(
    cueWords,
    textWords,
    maxSkip
  );
  console.log("Aligned Matches:", alignedMatches);
  console.log("Matching Rate:", matchingRate);
  prettyPrint(alignedMatches, cueWords, textWords);
}
