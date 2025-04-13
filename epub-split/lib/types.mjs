/**
 * @typedef {Object} TocEntry
 * @property {string} id - Unique identifier for the TOC entry
 * @property {string} href - Resource path or reference
 * @property {string} label - Display text of the TOC entry
 * @property {string} [playOrder] - Reading order sequence (from lingo-reader)
 * @property {string} [textContent] - Raw text content of the entry (from epubjs)
 * @property {string} [warning] - Warning message if any issues occurred during parsing
 * @property {TocEntry[]} [children] - Nested sub-entries
 */

/**
 * @typedef {TocEntry[]} Toc
 */

/**
 * @typedef {Object} ParserResult
 * @property {string} parser - Name of the parser used ('lingo' or 'epubjs')
 * @property {Toc} toc - Table of contents
 * @property {string[]} errors - array of fatal issues - no content will be extracted
 * @property {string[]} warnings - array of non-fatal issues - content will be extracted
 */

// Export as ES module without exporting any values
export {};
