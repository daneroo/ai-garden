import { basename } from "node:path";
import type { TocEntry, Toc } from "./types.ts";

/**
 * Displays the table of contents in a hierarchical format
 * @param toc - The table of contents to display
 * @param level - The current indentation level (default: 0)
 */
export function showTOC(toc: Toc, level = 0) {
  // {
  //   "id": "8a3b7da4-92e6-45e8-b523-8b018dc12000",
  //   "href": "Text/part0030.html",
  //   "label": "\r\n        COPYRIGHT\r\n      ",
  //   "children": [],
  //   "playOrder": "1",
  //   "textContent": "...",
  //   "warning": "section not found"
  // }
  const indent = " ".repeat(level * 2);
  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
    // if item has textContent, print it
    if (item.textContent) {
      const cleanedContent = item.textContent
        .replace(/\s+/g, " ") // Replace multiple spaces with a single space
        .replace(/\n+/g, "\n") // Replace multiple newlines with a single newline
        .trim(); // Remove leading and trailing whitespace

      console.log(
        `${indent}    ${cleanedContent.slice(0, 80)}${
          cleanedContent.length > 50 ? "..." : ""
        }`
      );
    }
    if (item.warning) {
      console.log(`${indent} ** ${item.warning}`);
    }
    if (item.children) {
      showTOC(item.children, level + 1);
    }
  });
}

/**
 * Displays a summary of the table of contents in a markdown table format
 * @param toc - The table of contents to summarize
 * @param bookPath - Path of the book being processed
 * @param showHeader - Whether to display the table header
 */
export function showSummary(
  toc: Toc,
  bookPath: string,
  showHeader: boolean
): void {
  if (showHeader) {
    console.log("\n| Status | Warnings | Entries | Title |");
    console.log("|--------|---------:|--------:|-------|");
  }
  try {
    const warnings = flattenWarnings(toc);
    const ok = warnings.length === 0;
    const count = countTOC(toc);
    console.log(
      `| ${ok ? "✓" : "✗"} | ${warnings.length.toString().padStart(5)} | ${count
        .toString()
        .padStart(5)} | ${basename(bookPath)} |`
    );
    for (const warning of warnings) {
      // console.log(`- warning: ${warning}`);
      console.log(`|   |       |       | ${warning} |`);
    }
  } catch (error) {
    console.log(
      `| ✗ | ${"-1".padStart(5)} | ${"-1".padStart(5)} | ${basename(
        bookPath
      )} |`
    );
  }
}

/**
 * Collects and flattens all warning messages from the table of contents into a single array
 * @param toc - The table of contents to process
 * @returns Array of warning messages
 */
function flattenWarnings(toc: Toc): string[] {
  const warnings: string[] = [];
  toc.forEach((item) => {
    if (item.warning) {
      warnings.push(item.warning);
    }
    if (item.children) {
      const subWarnings = flattenWarnings(item.children);
      warnings.push(...subWarnings);
    }
  });
  return warnings;
}

/**
 * Counts all entries in the table of contents, including children
 * @param toc - The table of contents to count
 * @returns Total number of entries
 */
function countTOC(toc: Toc): number {
  let count = toc.length;
  toc.forEach((item) => {
    if (item.children) {
      count += countTOC(item.children);
    }
  });
  return count;
}

/**
 * Compares two table of contents and displays their differences
 * Needs much work, and not sure it is worth diving into epubjs vs lingo differences
 * @param tocLingo - First table of contents to compare
 * @param tocEpubjs - Second table of contents to compare
 * @param bookPath - Path of the book being compared
 * @param showHeader - Whether to display the table header
 */
export function compareToc(
  tocLingo: Toc,
  tocEpubjs: Toc,
  bookPath: string,
  showHeader: boolean
): void {
  // the recursive comparison of fields: id, href, label is sketchy
  // and not sure it is worth diving into epubjs vs lingo differences
  const SHOW_DETAILS = false;
  if (showHeader) {
    console.log(`\n## Comparing parsers\n`);
    if (SHOW_DETAILS) {
      console.log(`including field comparisons: id, href, label`);
    } else {
      console.log(`Only comparing TOC total counts`);
    }
    console.log("\n| Status | Lingo | Epubjs | Book |");
    console.log("|--------|-------|-------|------|");
  }

  // First row: total counts
  const totalMatch = tocLingo.length === tocEpubjs.length;
  console.log(
    `| ${checkOrXmark(totalMatch)} | ${tocLingo.length
      .toString()
      .padStart(5)} | ${tocEpubjs.length.toString().padStart(5)} | ${basename(
      bookPath
    )} |`
  );

  if (!SHOW_DETAILS) return;

  // showResultDetail is a helper function to display the result of a comparison
  // | ✓ |      |     | label's match |
  // | ✗ |      |     | label's differ |
  function showResultDetail(matchBoolean: boolean, label: string): void {
    console.log(
      `| ${checkOrXmark(matchBoolean)} | ${"".padStart(5)} | ${"".padStart(
        5
      )} | ${label}'s ${matchBoolean ? "match" : "differ"} |`
    );
  }
  // Compare IDs - does not work - ebubjs and lingo have different ids
  // console.debug("compareToc: comparing ids");
  const idMatch = tocLingo.every((entry, i) =>
    compareEntries(entry, tocEpubjs[i], (a, b) => {
      if (a.id !== b.id) {
        console.debug(`| ✗ |       |       |   a.id:${a.id} b.id:${b.id} |`);
      }
      return a.id === b.id;
    })
  );
  showResultDetail(idMatch, "id");

  // Compare hrefs
  // console.debug("compareToc: comparing hrefs");
  const hrefMatch = tocLingo.every((entry, i) =>
    compareEntries(entry, tocEpubjs[i], (a, b) => {
      // remove any epub: prefix from hrefs
      const aHref = a.href.replace(/^epub:/, "");
      const bHref = b.href.replace(/^epub:/, "");
      if (aHref !== bHref) {
        console.debug(
          `| ✗ |       |       |   a.href:${aHref} b.href:${bHref} |`
        );
      }
      return aHref === bHref;
    })
  );
  showResultDetail(hrefMatch, "href");

  // Compare labels
  // console.debug("compareToc: comparing labels");
  const labelMatch = tocLingo.every((entry, i) =>
    compareEntries(entry, tocEpubjs[i], (a, b) => {
      if (a.label.trim() !== b.label.trim()) {
        console.debug(
          `| ✗ |       |       |   a.label:${a.label} b.label:${b.label}`
        );
      }
      return a.label.trim() === b.label.trim();
    })
  );
  showResultDetail(labelMatch, "label");
}

/**
 * Compares two TOC entries recursively
 * @param a - First TOC entry
 * @param b - Second TOC entry
 * @param compare - Comparison function
 * @returns Whether the entries and their children match
 */
function compareEntries(
  a: TocEntry,
  b: TocEntry,
  compare: (a: TocEntry, b: TocEntry) => boolean
): boolean {
  if (!a || !b) {
    console.debug(
      `| ✗ |       |       |   !!a:${!!a} !!b:${!!b} a:${a} b:${b}`
    );
    return false;
  }
  if (!compare(a, b)) return false;
  if ((a.children?.length ?? 0) !== (b.children?.length ?? 0)) {
    console.debug(
      `compareEntries: a.children?.length:${a.children?.length} b.children?.length:${b.children?.length}`
    );
    return false;
  }
  if (!a.children || !b.children) return true;
  return a.children.every((childA, i) =>
    compareEntries(childA, b.children![i], compare)
  );
}

/**
 * Returns a checkmark or xmark based on a boolean value
 * @param value - The value to check
 * @returns "✓" or "✗"
 */
function checkOrXmark(value: boolean): string {
  return value ? "✓" : "✗";
}
