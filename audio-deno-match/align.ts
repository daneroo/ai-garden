export type AlignedMatch = {
  indexA: number; // Index into cueWords, -1 for words only in textWords
  indexB: number; // Index into textWords, -1 for words only in cueWords
  type: "insertion" | "substitution" | "match";
};

export type AlignmentResult = {
  alignedMatches: AlignedMatch[];
};

export function alignWords(
  cueWords: string[],
  textWords: string[],
  maxSkip: number,
  cueStartIndex: number = 0,
  textStartIndex: number = 0
): AlignmentResult {
  const m = cueWords.length;
  const n = textWords.length;

  const alignedMatches: AlignedMatch[] = [];
  let i = cueStartIndex,
    j = textStartIndex;

  // Helper function to find the next match within a window
  function findNextMatch(i: number, j: number, window: number) {
    // console.debug(`## findNextMatch: i=${i}, j=${j}, window=${window}`);
    // console.debug(
    //   `   cueWords[i,..]=${cueWords.slice(i, i + window).join(",")}`
    // );
    // console.debug(
    //   `   textWords[j.,,]=${textWords.slice(j, j + window).join(",")}`
    // );
    // Iterate over all pairs of offsets within the given window
    for (let offsetCues = 1; offsetCues <= window; offsetCues++) {
      for (let offsetText = 1; offsetText <= window; offsetText++) {
        if (
          i + offsetCues < m &&
          j + offsetText < n &&
          cueWords[i + offsetCues] === textWords[j + offsetText]
        ) {
          // console.debug(
          //   `.. findNextMatch: offsetCues=${offsetCues}, offsetText=${offsetText} matched: ${
          //     cueWords[i + offsetCues]
          //   } === ${textWords[j + offsetText]}`
          // );
          return { skipInCues: offsetCues, skipInText: offsetText };
        }
      }
    }
    return null;
  }

  while (i < m && j < n) {
    // console.debug(`## alignWords: i=${i}, j=${j}`);
    // console.debug(`.. cueWords[${i},..]=${cueWords.slice(i, i + maxSkip + 1)}`);
    // console.debug(
    //   `.. textWords[${j},..]=${textWords.slice(j, j + maxSkip + 1)}`
    // );
    if (cueWords[i] === textWords[j]) {
      alignedMatches.push({ indexA: i, indexB: j, type: "match" });
      i++;
      j++;
    } else {
      const match = findNextMatch(i, j, maxSkip);
      if (!match) {
        // throw new Error(
        //   `findNextMatch exceeded window threshold of ${maxSkip} at i=${i}, j=${j}`
        // );
        console.log(
          `findNextMatch exceeded window threshold of ${maxSkip} at i=${i}, j=${j}`
        );
        return { alignedMatches };
      }
      if (match.skipInCues === 1 && match.skipInText === 1) {
        // Single word difference (substitution)
        alignedMatches.push({
          indexA: i,
          indexB: j,
          type: "substitution",
        });
        i++;
        j++;
      } else {
        // otherwise treat as insertions on both sides
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

  return { alignedMatches };
}

export function alignedMatchingRate(alignedMatches: AlignedMatch[]): number {
  const matchedCount = alignedMatches.filter(
    (match) => match.type === "match"
  ).length;
  return matchedCount / alignedMatches.length;
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
  // const emptyPad = blue(""); // Blue "" symbol

  function outputAndReset() {
    if (textLine === cueLine) {
      console.log(`same: |${cueLine.trim()}|`);
    } else {
      console.log(`cue:  |${cueLine.trim()}|`);
      console.log(`text: |${textLine.trim()}|`);
    }
    console.log("");
    cueLine = "";
    textLine = "";
  }

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
    const maxLength = Math.max(cueLine.length, textLine.length);
    // +1 is for space between words; but the joined string is trimmed to remove the last space
    cueLine = cueLine.padEnd(maxLength + 1, " ");
    textLine = textLine.padEnd(maxLength + 1, " ");
    if (textLine.length > 80) {
      outputAndReset();
    }
  });
  outputAndReset();
  const matchingRate = alignedMatchingRate(alignedMatches);
  const matchedCount = alignedMatches.filter(
    (match) => match.type === "match"
  ).length;
  console.log(
    `Matching Rate: ${matchingRate} matches: ${matchedCount} of (${cueWords.length}, ${textWords.length})`
  );
}

// If this module is the main module, then call the main
// node.js: if (import.meta.url === `file://${process.argv[1]}`) {
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

  const { alignedMatches } = alignWords(cueWords, textWords, maxSkip);
  // console.log("Aligned Matches:", alignedMatches);
  prettyPrint(alignedMatches, cueWords, textWords);
}
