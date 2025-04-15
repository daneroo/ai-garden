/**
 * Represents a single entry in the table of contents
 */
export interface TocEntry {
  /** Unique identifier for the TOC entry */
  id: string;
  /** Resource path or reference */
  href: string;
  /** Display text of the TOC entry */
  label: string;
  /** Reading order sequence (from lingo-reader) */
  playOrder?: string;
  /** Raw text content of the entry (from epubjs) */
  textContent?: string;
  /** Warning message if any issues occurred during parsing */
  warning?: string;
  /** Nested sub-entries */
  children?: TocEntry[];
}

/**
 * Table of contents as an array of entries
 */
export type Toc = TocEntry[];

/**
 * Result from parsing an EPUB file
 */
export interface ParserResult {
  /** Name of the parser used ('lingo' or 'epubjs') */
  parser: string;
  /** Table of contents */
  toc: Toc;
  /** Array of fatal issues - no content will be extracted */
  errors: string[];
  /** Array of non-fatal issues - content will be extracted */
  warnings: string[];
}

/**
 * Options for parsing an EPUB file
 */
export interface ParseOptions {
  /** Verbosity level for logging */
  verbosity?: number;
}
