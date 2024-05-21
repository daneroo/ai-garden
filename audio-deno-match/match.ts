import { AlignedMatch, AlignmentResult, alignWords } from "./align.ts";
import { type VTTCue } from "./vtt.ts";

function wordSplit(text: string) {
  return text.split(/\s+/);
}

function linesToWords(lines: string[]): string[] {
  return lines.map(wordSplit).flat();
}

type MultipleAlignment = {
  cueWords: string[];
  textWords: string[];
  alignmentResults: AlignmentResult[];
};
export function matchWordSequences(
  cues: VTTCue[],
  textRanges: TextRange[],
  textContent: string,
  options: { normalize: boolean; verbose: boolean } = {
    normalize: false,
    verbose: false,
  }
): MultipleAlignment {
  const { normalize, verbose } = options;
  // map all cues (possibly normalized) to an array of strings, then split into words
  const cueWords = linesToWords(
    cues.map((cue) => (normalize ? normalizeText(cue.text) : cue.text))
  );
  const maxWords = 180;
  console.log(`- cueWords: ${cueWords.length} from ${cues.length} cues`);
  if (verbose) {
    console.log(`  ... ${cueWords.slice(0, maxWords).join(", ")}`);
  }

  const textWords = linesToWords([textContent]);
  console.log(
    `- textWords: ${textWords.length} from ${textRanges.length} ranges`
  );
  if (verbose) {
    console.log(`  ... ${textWords.slice(0, maxWords).join(", ")}`);
  }
  Deno.writeTextFileSync("output/cuewords.txt", cueWords.join(" "));
  Deno.writeTextFileSync("output/textwords.txt", textWords.join(" "));

  // find a starting point for the alignment
  console.log(`- Starting matchWordSequences`);
  const minWordsForStart = 8;
  let initialCueStartIndex = 0;
  let initialTextStartIndex = 0;
  const alignmentResults: AlignmentResult[] = [];
  const start = Date.now();
  while (initialCueStartIndex < cueWords.length - minWordsForStart) {
    const start = Date.now();
    const { textStartIndex, cueStartIndex } = findConsecutiveWordMatches(
      initialCueStartIndex,
      initialTextStartIndex,
      cueWords,
      textWords,
      minWordsForStart
    );
    if (textStartIndex < 0) {
      // console.error(
      //   `- Could not find a starting match for ${minWordsForStart} words`
      // );
      break;
    }
    const elapsed = Date.now() - start;
    if (elapsed < 0) {
      console.log(
        `  - match: |words|:${minWordsForStart} wordIndexes - cue:${cueStartIndex} text:${textStartIndex}  in ${elapsed}ms`
      );
    }
    const maxSkip = 4;
    const alignmentResult = alignWords(
      cueWords,
      textWords,
      maxSkip,
      cueStartIndex,
      textStartIndex
    );
    const { alignedMatches } = alignmentResult;

    // prettyPrint(alignedMatches, cueWords, textWords);
    // TODO: assert the last alignedMatch is a 'match', actually there is a bug, just find the last match
    if (alignedMatches[alignedMatches.length - 1].type !== "match") {
      console.error(
        `\n- Last alignment is not a match: ${
          alignedMatches[alignedMatches.length - 1].type
        }\n`
      );
    }
    const lastMatch = alignedMatches[alignedMatches.length - 1];
    // just an assertion
    if (lastMatch.type !== "match") {
      console.error(`- Last alignment match: `, lastMatch);
      throw new Error(`- Last alignment is not a match: ${lastMatch.type}`);
    }
    initialCueStartIndex = lastMatch.cueWordIndex + 1;
    initialTextStartIndex = lastMatch.textWordIndex + 1;
    alignmentResults.push(alignmentResult);
  }
  const elapsed = Date.now() - start;
  console.log(
    `- (matchWordSequences) alignments: ${alignmentResults.length} in ${elapsed}ms`
  );

  return { cueWords, textWords, alignmentResults };
  // now do alignWords
}

// get the end indices of the previous alignment (current alignment is index)
function getPrevWordIndices(
  alignments: AlignmentResult[],
  index: number
): { lastCueWordIndex: number; lastTextWordIndex: number } {
  if (index < 0 || index > alignments.length) {
    throw new Error(
      `- getPrevWordIndices: index out of range: ${index}/${alignments.length}`
    );
  }
  return index === 0
    ? { lastCueWordIndex: 0, lastTextWordIndex: 0 }
    : {
        lastCueWordIndex: alignments[index - 1].endCueWordIndex,
        lastTextWordIndex: alignments[index - 1].endTextWordIndex,
      };
}
function multipleAlignmentMetrics(multipleAlignment: MultipleAlignment) {
  const { cueWords, textWords, alignmentResults } = multipleAlignment;

  let totalMatchedWords = 0;
  let totalSkippedCueWords = 0;
  let totalSkippedTextWords = 0;
  alignmentResults.map((alignment, index, alignments) => {
    const { alignedMatches, startCueWordIndex, startTextWordIndex } = alignment;
    const { lastCueWordIndex, lastTextWordIndex } = getPrevWordIndices(
      alignments,
      index
    );
    const skippedCueWords = startCueWordIndex - lastCueWordIndex;
    const skippedTextWords = startTextWordIndex - lastTextWordIndex;

    const matchedWords = alignedMatches.filter(
      (match) => match.type === "match"
    ).length;
    totalMatchedWords += matchedWords;
    totalSkippedCueWords += skippedCueWords;
    totalSkippedTextWords += skippedTextWords;
  });
  const { lastCueWordIndex, lastTextWordIndex } = getPrevWordIndices(
    alignmentResults,
    alignmentResults.length
  );
  totalSkippedCueWords += cueWords.length - lastCueWordIndex;
  totalSkippedTextWords += textWords.length - lastTextWordIndex;
  const cueMatchRate = totalMatchedWords / cueWords.length;
  console.log(
    `  - Cue Match Rate: ${(cueMatchRate * 100).toFixed(
      2
    )} Total matchedWords: ${totalMatchedWords} skippedCueWords: ${totalSkippedCueWords} skippedTextWords: ${totalSkippedTextWords}`
  );
  return {
    totalMatchedWords,
    totalSkippedCueWords,
    totalSkippedTextWords,
    cueMatchRate,
  };
}

export function viewMultipleAlignments(multipleAlignment: MultipleAlignment) {
  const { cueWords, textWords, alignmentResults } = multipleAlignment;
  console.log(
    `- (viewMultipleAlignments) alignments: ${alignmentResults.length}`
  );
  const {
    totalMatchedWords,
    totalSkippedCueWords,
    totalSkippedTextWords,
    cueMatchRate,
  } = multipleAlignmentMetrics(multipleAlignment);
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Alignments</title>

  <style>
  .aligned-container {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    margin: 0 1em;
  }

  .aligned-match {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin: 0 0.2em;
  }

  .match {
    color: black;
  }

  .substitution {
    color: green;
  }

  .insertion {
    color: blue;
  }

  .cue-word, .text-word {
    margin: 2px 0;
  }
</style>

  </head>
<body>
  <h1>Alignments</h1>
  <p>cueWords: ${cueWords.length}</p>
  <p>textWords: ${textWords.length}</p>
  <p>alignments: ${alignmentResults.length}</p>
  <p>totalMatchedWords: ${totalMatchedWords}</p>
  <p>totalSkippedCueWords: ${totalSkippedCueWords}</p>
  <p>totalSkippedTextWords: ${totalSkippedTextWords}</p>
  <p>cueMatchRate: ${(cueMatchRate * 100).toFixed(2)}%</p>
  <hr>
  ${alignmentResults
    .map((alignment, index) => {
      const { alignedMatches } = alignment;
      return `<div>
      <h2>Skip before ${index + 1} of ${alignmentResults.length}</h2>
      ${skipBetweenAlignmentsToHTML(
        alignmentResults,
        index,
        cueWords,
        textWords
      )}
      <h2>Alignment ${index + 1} of ${alignmentResults.length}</h2>
      ${alignmentsToHTML(alignedMatches, cueWords, textWords)}
    </div>`;
    })
    .join("\n")}
    <h2>Skip after ${alignmentResults.length} of ${alignmentResults.length}</h2>
    ${skipBetweenAlignmentsToHTML(
      alignmentResults,
      alignmentResults.length,
      cueWords,
      textWords
    )}
  </body>
</html>`;
  Deno.writeTextFileSync("output/align.html", html);
}

export function skipBetweenAlignmentsToHTML(
  alignments: AlignmentResult[],
  index: number,
  cueWords: string[],
  textWords: string[]
) {
  if (index === alignments.length) {
    // After the Last alignment
    const { lastCueWordIndex, lastTextWordIndex } = getPrevWordIndices(
      alignments,
      index
    );
    const skippedCueWords = cueWords.length - lastCueWordIndex;
    const skippedTextWords = textWords.length - lastTextWordIndex;
    return `
    <div class="skip-container">
      <p>Skipped ${skippedCueWords} cue words</p>
      <p>${cueWords.slice(lastCueWordIndex + 1).join(" ")}</p>
      <p>Skipped ${skippedTextWords} text words</p>
      <p>${textWords.slice(lastTextWordIndex + 1).join(" ")}</p>
    </div>
  `;
  }
  const { startCueWordIndex, startTextWordIndex } = alignments[index];
  const { lastCueWordIndex, lastTextWordIndex } = getPrevWordIndices(
    alignments,
    index
  );
  const skippedCueWords = startCueWordIndex - lastCueWordIndex;
  const skippedTextWords = startTextWordIndex - lastTextWordIndex;

  return `
    <div class="skip-container">
      <p>Skipped ${skippedCueWords} cue words</p>
      <p>${cueWords
        .slice(lastCueWordIndex + 1, startCueWordIndex)
        .join(" ")}</p>
      <p>Skipped ${skippedTextWords} text words</p>
      <p>${textWords
        .slice(lastTextWordIndex + 1, startTextWordIndex)
        .join(" ")}</p>
    </div>
  `;
}
export function alignmentsToHTML(
  alignedMatches: AlignedMatch[],
  cueWords: string[],
  textWords: string[]
): string {
  return `
    <div class="aligned-container">
      ${alignedMatches
        .map((match) => {
          const { cueWordIndex, textWordIndex, type } = match;
          const cueWord = cueWordIndex !== -1 ? cueWords[cueWordIndex] : "";
          const textWord = textWordIndex !== -1 ? textWords[textWordIndex] : "";

          switch (type) {
            case "match":
              return `<div class="aligned-match match">${cueWord}</div>`;
            case "substitution":
              return `
                <div class="aligned-match substitution">
                  <div class="cue-word">${cueWord}</div>
                  <div class="text-word">${textWord}</div>
                </div>`;
            case "insertion":
              if (cueWordIndex === -1) {
                return `
                  <div class="aligned-match insertion">
                    <div class="cue-word">&nbsp;</div>
                    <div class="text-word">${textWord}</div>
                  </div>`;
              } else {
                return `
                  <div class="aligned-match insertion">
                    <div class="cue-word">${cueWord}</div>
                    <div class="text-word">&nbsp;</div>
                  </div>`;
              }
            default:
              return "";
          }
        })
        .join("")}
    </div>
  `;
}

function findConsecutiveWordMatches(
  initialCueStartIndex: number,
  initialTextStartIndex: number,
  cueWords: string[],
  textWords: string[],
  minWordsForStart: number
) {
  const cueLength = cueWords.length;
  const textLength = textWords.length;

  // Iterate over each starting index in cueWords
  for (
    let cueStartIndex = initialCueStartIndex;
    cueStartIndex <= cueLength - minWordsForStart;
    cueStartIndex++
  ) {
    // Iterate over each starting index in textWords
    for (
      let textStartIndex = initialTextStartIndex;
      textStartIndex <= textLength - minWordsForStart;
      textStartIndex++
    ) {
      let match = true;

      // Check for consecutive matches
      for (let offset = 0; offset < minWordsForStart; offset++) {
        if (
          cueWords[cueStartIndex + offset] !==
          textWords[textStartIndex + offset]
        ) {
          match = false;
          break;
        }
      }

      // If a match is found, return the indices
      if (match) {
        // now let's confirm that the words match (cueWords and textWords)
        const cc = cueWords
          .slice(cueStartIndex, cueStartIndex + minWordsForStart)
          .join(" ");

        const tt = textWords
          .slice(textStartIndex, textStartIndex + minWordsForStart)
          .join(" ");

        if (cc !== tt) {
          console.log(`- (arr) Mismatch: cueWords[..] !== textWords[..]`);
          console.log(
            `  ..  cueWords[${cueStartIndex},...,+${minWordsForStart}]: ${cc}`
          );
          console.log(
            `  .. textWords[${textStartIndex},...,+${minWordsForStart}]: ${tt}`
          );
        }

        return { cueStartIndex, textStartIndex };
      }
    }
  }

  // No match found
  return { textStartIndex: -1, cueStartIndex: -1 };
}

export function matchCuesToTextRanges(
  cues: VTTCue[],
  textRanges: TextRange[],
  textContent: string,
  options: { normalize: boolean; verbose: boolean } = {
    normalize: false,
    verbose: false,
  }
) {
  const { normalize, verbose } = options;
  let cueMatches = 0;
  for (const cue of cues) {
    if (verbose) {
      console.log(`Looking for: ${cue.text}`);
    }
    const needle = normalize ? normalizeText(cue.text) : cue.text;
    // TODO(daneroo): get a position, not just a boolean
    if (!textRanges) {
      console.error("TODO match ranges");
      continue;
    }
    const found = matchText(needle, textContent);
    if (found) {
      cueMatches++;
      continue;
    }
  }
  const cueMatchRate = ((cueMatches / cues.length) * 100.0).toFixed(2);
  console.log(
    `- metric (matchCuesToTextRanges) cue match rate (normalize:${normalize}): ${cueMatchRate}% (${cueMatches}/${cues.length})`
  );
}

function matchText(needle: string, haystack: string) {
  return haystack.includes(needle);
}

export function normalizeText(text: string) {
  // Normalize text: convert to lowercase, remove non-word characters, collapse spaces
  return text
    .toLowerCase()
    .replace(/[\W_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Meant to be used with haystack.slice(start, end)
export type TextRange = {
  start: number; // inclusive
  end: number; // exclusive
};

// This returns an array of TextRange objects, one for each textNode, such that
// 1- textContent.slice(reverseMap[i].start, reverseMap[i].end) === textNodes[i]
// 2- textContent.slice(reverseMap[i-1].end, reverseMap[i].start) is all whitespace
export function createTextRanges(
  textContent: string,
  textNodes: string[]
): TextRange[] {
  // unnormalized text matching
  const normalizedText = textContent; //normalizeText(textContent);
  let charIndex = 0; // This will keep track of the current position in the normalized text.
  const reverseMap: TextRange[] = [];

  for (const textNode of textNodes) {
    const text = textNode; //normalizeText(textNode);
    const length = text.length;
    // skip empty text nodes
    if (length > 0) {
      // this is to account for the top level text content, vs joined inner text content and empty space nodes
      const charIndexInOuter = normalizedText.indexOf(text, charIndex);
      if (charIndexInOuter < 0) {
        console.error(`Could not match in outer: ${text}`);
      } else {
        // console.log(`.. off by ${charIndexInOuter - charIndex} chars`);
        charIndex = charIndexInOuter;
      }

      reverseMap.push({
        start: charIndex,
        end: charIndex + length,
      });
    }
    charIndex += length; // Update the current position by the length of the text node.
  }

  return reverseMap;
}

function nPad(num: number, length: number = 7) {
  return num.toString().padStart(length, "0");
}

// for every TextRange entry in reverseMap, validate that
// 1- textContent.slice(start, end) === textNodes[i]
// 2- textContent.slice(reverseMap[i-1].end, start) is all whitespace
export function validateTextRanges(
  reverseMap: TextRange[],
  textContent: string,
  textNodes: string[],
  verbose: boolean = false
): boolean {
  if (reverseMap.length !== textNodes.length) {
    console.error(
      `ReverseMap length (${reverseMap.length}) does not match textNodes length (${textNodes.length})`
    );
    return false;
  }
  let allOk = true;
  if (verbose) {
    console.log(`- Validating ${reverseMap.length} TextRanges`);
  }
  for (let i = 0; i < reverseMap.length; i++) {
    const { start, end } = reverseMap[i];
    const len = end - start;
    const text = textContent.slice(start, end);

    // Validations
    // 1. text should match textNodes[i]
    const mapIndexMatchesTextNodes = text === textNodes[i];
    // 2. text between previous entry and current should be all whitespace (skip i=0)
    const textBetween =
      i === 0 ? "" : textContent.slice(reverseMap[i - 1].end, start);
    const textBetweenIsWhitespace = /^[\s]*$/.test(textBetween);

    const ok = mapIndexMatchesTextNodes && textBetweenIsWhitespace;
    if (!ok) {
      allOk = false;
    }

    // Output
    if (verbose) {
      const okMark = ok ? "✓" : "✗";
      // prettier-ignore
      console.log(` - ${okMark} text[${nPad(start)}..${nPad(end)})  l:${nPad(len,3)} text: |${text}|`);
      if (!mapIndexMatchesTextNodes) {
        // prettier-ignore
        console.log(`   ${okMark} != textNode[${i}] l:${nPad(textNodes[i].length,3)} text: |${textNodes[i]}|`);
      }
      if (!textBetweenIsWhitespace) {
        // prettier-ignore
        console.log(`   - ${okMark} textBetween l:${nPad(textBetween.length,3)} text: |${JSON.stringify(textBetween)}|`);
      }
    }
  }
  return allOk;
}
