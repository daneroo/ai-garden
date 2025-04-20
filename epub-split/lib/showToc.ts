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
  const SHOW_CONTENT = false; // should match augmentEntriesAndChildren/shouldGetContent=true
  const indent = " ".repeat(level * 2);
  toc.forEach((item) => {
    // print the indented title of the item *trimmed* (remove leading and trailing whitespace)
    console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
    // if item has textContent, print it
    if (SHOW_CONTENT && item.textContent) {
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
  } catch (_error) {
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
