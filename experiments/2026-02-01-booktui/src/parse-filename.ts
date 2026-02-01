import { basename, extname } from "node:path";

export interface ParsedBook {
  author: string;
  series: string | null;
  number: string | null;
  title: string;
}

/**
 * Parse audiobook filenames following the pattern:
 *   Author - Series NN - Title.ext
 *   Author - Series - NN Title.ext
 *
 * Examples:
 *   "Steven Erikson - Malazan - 10 The Crippled God.m4b"
 *   "Iain M. Banks - Culture 09 - Surface Detail.m4b"
 *   "Brandon Sanderson - Mistborn 01 - The Final Empire.m4b"
 *   "Terry Pratchett - Discworld.m4b"
 */
export function parseBookFilename(relativePath: string): ParsedBook {
  const name = basename(relativePath, extname(relativePath));
  const parts = name.split(" - ").map((s) => s.trim());

  if (parts.length === 1) {
    return { author: parts[0]!, series: null, number: null, title: parts[0]! };
  }

  const author = parts[0]!;

  if (parts.length === 2) {
    // "Author - Title" or "Author - Series NN"
    const parsed = extractNumber(parts[1]!);
    if (parsed.number) {
      return {
        author,
        series: parsed.text || null,
        number: parsed.number,
        title: parsed.text || parts[1]!,
      };
    }
    return { author, series: null, number: null, title: parts[1]! };
  }

  // 3+ parts: "Author - Series [NN] - [NN] Title"
  const middle = parts[1]!;
  const rest = parts.slice(2).join(" - ");

  const middleParsed = extractNumber(middle);
  const restParsed = extractNumber(rest);

  if (middleParsed.number) {
    // "Author - Series NN - Title"
    return { author, series: middleParsed.text || null, number: middleParsed.number, title: rest };
  }

  if (restParsed.number) {
    // "Author - Series - NN Title"
    return { author, series: middle, number: restParsed.number, title: restParsed.text || rest };
  }

  // No number found, treat middle as series and rest as title
  return { author, series: middle, number: null, title: rest };
}

/** Extract a leading or trailing number from a string */
function extractNumber(s: string): { text: string; number: string | null } {
  // Trailing number: "Culture 09"
  const trailingMatch = s.match(/^(.+?)\s+(\d{1,3})$/);
  if (trailingMatch) {
    return { text: trailingMatch[1]!, number: trailingMatch[2]! };
  }

  // Leading number: "10 The Crippled God"
  const leadingMatch = s.match(/^(\d{1,3})\s+(.+)$/);
  if (leadingMatch) {
    return { text: leadingMatch[2]!, number: leadingMatch[1]! };
  }

  // Just a number: "10"
  if (/^\d{1,3}$/.test(s)) {
    return { text: "", number: s };
  }

  return { text: s, number: null };
}
