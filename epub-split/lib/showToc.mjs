import { basename } from "node:path";
/**
 * @typedef {import("./types.mjs").TocEntry} TocEntry
 * @typedef {import("./types.mjs").Toc} Toc
 */

/**
 * Displays the table of contents in a hierarchical format
 * @param {Toc} toc - The table of contents to display
 * @param {number} level - The current indentation level (default: 0)
 */
export function showTOC(toc, level = 0) {
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
 * @param {Toc} toc - The table of contents to summarize
 * @param {string} bookPath - Path of the book being processed
 * @returns {void}
 */
export function showSummary(toc, bookPath) {
  try {
    const warnings = validate(toc);
    const ok = warnings.length === 0;
    console.log(
      `| ${ok ? "✓" : "✗"} | ${warnings.length
        .toString()
        .padStart(5)} | ${basename(bookPath)} |`
    );
  } catch (error) {
    console.log(`| ✗ | ${"-1".padStart(5)} | ${basename(bookPath)} |`);
  }
}

/**
 * Collects all warning messages from the table of contents
 * @param {Toc} toc - The table of contents to validate
 * @param {number} level - The current indentation level (default: 0)
 * @returns {string[]} Array of warning messages
 */
function validate(toc, level = 0) {
  const warnings = [];
  toc.forEach((item) => {
    if (item.warning) {
      // console.log(`${indent}- ${item.label.trim()} (${item?.href})`);
      // console.log(`${indent} ** ${item.warning}`);
      warnings.push(item.warning);
    }
    if (item.subitems) {
      const subWarnings = validate(item.subitems, level + 1);
      warnings.push(...subWarnings);
    }
  });
  return warnings;
}

/**
 * Compares two table of contents and displays their differences
 * @param {Toc} a - First table of contents to compare
 * @param {Toc} b - Second table of contents to compare
 * @param {string} bookPath - Path of the book being compared
 * @returns {void}
 */
export function compareToc(a, b, bookPath) {
  // TODO: Implement comparison logic and display differences
  const status = a.length === b.length ? "✓" : "✗";
  console.log(
    `| ${status} | ${a.length.toString().padStart(5)} | ${b.length
      .toString()
      .padStart(5)} | ${basename(bookPath)} |`
  );
}
