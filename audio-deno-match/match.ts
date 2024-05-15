import { alignWords } from "./align.ts";
import { type VTTCue } from "./vtt.ts";

function wordSplit(text: string) {
  return text.split(/\s+/);
}

function linesToWords(lines: string[]): string[] {
  return lines.map(wordSplit).flat();
}

export function matchWordSequences(
  cues: VTTCue[],
  textRanges: TextRange[],
  textContent: string,
  options: { normalize: boolean; verbose: boolean } = {
    normalize: false,
    verbose: false,
  }
) {
  const { normalize, verbose } = options;
  // map all cues (possibly normalized) to an array of strings, then split into words
  const cueWords = linesToWords(
    cues.map((cue) => (normalize ? normalizeText(cue.text) : cue.text))
  );
  const maxWords = 180;
  console.log(`- cueWords: ${cueWords.length} from ${cues.length} cues`);
  console.log(`  ... ${cueWords.slice(0, maxWords).join(", ")}`);

  const textWords = linesToWords([textContent]);
  console.log(
    `- textWords: ${textWords.length} from ${textRanges.length} ranges`
  );
  console.log(`  ... ${textWords.slice(0, maxWords).join(", ")}`);

  const maxSkip = 3;
  const { alignedCues, alignedText } = alignWords(cueWords, textWords, maxSkip);
  console.log("Aligned Cues:", alignedCues);
  console.log("Aligned Text:", alignedText);
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
  // matchTypeCounts.total = cues.length - matchTypeCounts.unmatched;
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
