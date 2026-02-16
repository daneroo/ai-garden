/**
 * Core types for the BookPlayer library scanner and indexer.
 */

/** Canonical book record — an audiobook directory with m4b + cover. */
export interface BookRecord {
  /** Stable short ID derived from sha1(m4b basename) */
  id: string
  /** Original m4b filename without extension */
  basename: string
  /** Relative path from AUDIOBOOKS_ROOT to the book directory */
  dirPath: string
  /** Relative path to the m4b file */
  m4bPath: string
  /** Relative path to cover image (cover.jpg or cover.png) */
  coverPath: string
  /** Relative path to epub file, if present */
  epubPath: string | null
  /** Whether a matching VTT transcript exists */
  hasVtt: boolean
  /** Metadata extracted from m4b or metadata.json */
  metadata: BookMetadata
  /** File fingerprint for cache invalidation */
  fingerprint: FileFingerprint
}

/** Extracted or derived metadata fields. */
export interface BookMetadata {
  title: string
  author: string | null
  duration: number | null
  bitrate: number | null
  codec: string | null
  fileSize: number
}

/** File fingerprint for cache invalidation. */
export interface FileFingerprint {
  relativePath: string
  mtimeMs: number
  size: number
}

/** In-memory library manifest. */
export interface LibraryManifest {
  books: Array<BookRecord>
  scannedAt: string
  scanDurationMs: number
}

/** Persisted cache format. */
export interface BookCache {
  version: 1
  scannedAt: string
  books: Array<BookRecord>
}
