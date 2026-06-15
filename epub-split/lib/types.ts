/**
 * Represents a single entry in the manifest
 */
export interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
  mediaOverlay?: string;
  fallback?: string[];
}

/**
 * Represents the manifest of the EPUB file
 */
export type Manifest = Record<string, ManifestItem>;

export interface SpineItem {
  idref: string;
  href: string;
  linear: boolean;
  properties: string[];
}

export type Spine = SpineItem[];

/**
 * Represents a single node in the table of contents tree
 */
export interface TocEntry {
  /** Unique identifier for the TOC entry */
  id: string;
  /** Resource path or reference */
  href: string;
  /** Display text of the TOC entry */
  label: string;
  /** Reading order sequence, when available */
  playOrder?: string;
  /** Raw text content of the entry (from epubjs) */
  textContent?: string;
  /** Warning message if any issues occurred during parsing */
  warning?: string;
  /** Child nodes in the TOC tree */
  children?: TocEntry[];
}

/**
 * Table of contents represented as a tree of entries
 * Each entry can have nested children, forming a hierarchical structure
 */
export type Toc = TocEntry[];

export interface Metadata {
  title: string;
  creator: string;
  description: string;
  pubdate: string;
  publisher: string;
  identifier: string;
  language: string;
  rights: string;
  modifiedDate: string;
  layout: string;
  orientation: string;
  flow: string;
  viewport: string;
  mediaActiveClass: string;
  spread: string;
  direction: string;
}

/**
 * Result from parsing an EPUB file
 */
export interface ParserResult {
  /** Name of the parser used */
  parser: string;
  /** Book-specific parser failure captured so corpus processing can continue */
  failure?: ParseFailure;
  /** Package metadata exposed by both parsers */
  metadata: Metadata;
  /** manifest */
  manifest: Manifest;
  /** Ordered reading sequence from the package spine */
  spine: Spine;
  /** Table of contents */
  toc: Toc;
  /** NOT-WANTED (for now, maybe never) */
  // guide: Guide;
  // rootDir: string;
  // opfPath: string;
  // ncxPath?: string;
  // navPath?: string;
  // stylesheets: string[];
  // fonts: string[];

  // These should be combined into a ValidationMessage general type!
  /** Array of fatal issues - no content will be extracted */
  errors: string[];
  /** Array of non-fatal issues - content will be extracted */
  warnings: string[];
}

export interface ParseFailure {
  stage: "parse";
  category: string;
  message: string;
}

/**
 * Options for parsing an EPUB file
 */
export interface ParseOptions {
  /** Verbosity level for logging */
  verbosity?: number;
}

export interface ComparisonWarning {
  // could also have a severity, like info,warn,error?
  type:
    | "manifest.length" // Manifest length mismatch
    | "manifest.missing.key" // Manifest entry missing
    | "manifest.id.mismatch" // Manifest entry id mismatch
    | "manifest.href.mismatch" // Manifest entry href mismatch
    | "manifest.mediaType.mismatch" // Manifest entry mediaType mismatch
    | "spine.length" // Spine length mismatch
    | "spine.idref.mismatch" // Ordered spine idref mismatch
    | "spine.href.mismatch" // Ordered spine href mismatch
    | "spine.linear.mismatch" // Ordered spine linearity mismatch
    | "spine.properties.mismatch" // Ordered spine properties mismatch
    | "parse.failure" // One parser failed for this book
    | "toc.presence" // One or both TOCs are empty
    | "toc.length" // Ordered sibling count mismatch
    | "toc.id.mismatch" // Ordered TOC id mismatch
    | "toc.href.mismatch" // Ordered TOC href mismatch
    | "toc.label.mismatch" // Ordered TOC label mismatch
    | "metadata.field.mismatch"; // Strict metadata field mismatch
  message: string;
}
