/**
 * Library scanner — recursively discovers canonical audiobook records.
 *
 * A canonical book directory contains:
 *   - required: exactly one .m4b file
 *   - required: cover.jpg or cover.png
 *   - optional: .epub file
 *
 * VTT transcripts are matched by m4b basename from VTT_DIR.
 */
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { basename, extname, join, relative } from 'node:path'

import type {
  BookMetadata,
  BookRecord,
  FileFingerprint,
  LibraryManifest,
} from './types'

/** Generate a stable 12-char hex ID from the m4b basename. */
function makeBookId(m4bBasename: string): string {
  const normalized = m4bBasename.toLowerCase().trim()
  return createHash('sha1').update(normalized).digest('hex').slice(0, 12)
}

/** Recursively find all book directories under root. */
function scanDirectory(
  root: string,
  dirPath: string,
  vttDir: string,
  books: Array<BookRecord>,
  warnings: Array<string>,
): void {
  let entries
  try {
    entries = readdirSync(dirPath, { withFileTypes: true })
  } catch (err) {
    warnings.push(`[scanner] Cannot read directory: ${dirPath} — ${err}`)
    return
  }

  // Skip hidden directories
  const visibleEntries = entries.filter((e) => !e.name.startsWith('.'))

  // Collect files by type
  const m4bFiles: Array<string> = []
  const epubFiles: Array<string> = []
  let coverPath: string | null = null
  const subdirs: Array<string> = []

  for (const entry of visibleEntries) {
    const fullPath = join(dirPath, entry.name)
    if (entry.isDirectory()) {
      subdirs.push(fullPath)
      continue
    }
    if (!entry.isFile()) continue

    const ext = extname(entry.name).toLowerCase()
    if (ext === '.m4b') {
      m4bFiles.push(entry.name)
    } else if (ext === '.epub') {
      epubFiles.push(entry.name)
    } else if (entry.name === 'cover.jpg' && !coverPath) {
      coverPath = entry.name
    } else if (entry.name === 'cover.png' && !coverPath) {
      coverPath = entry.name
    }
  }

  // Prefer cover.jpg over cover.png
  const hasJpg = visibleEntries.some((e) => e.name === 'cover.jpg')
  if (hasJpg) coverPath = 'cover.jpg'

  // If this directory has exactly one m4b + a cover, it's a canonical book
  if (m4bFiles.length === 1 && coverPath) {
    const m4bName = m4bFiles[0]
    const m4bBasename = basename(m4bName, extname(m4bName))
    const relDir = relative(root, dirPath)
    const relM4b = join(relDir, m4bName)
    const relCover = join(relDir, coverPath)

    // EPUB (optional)
    let epubRelPath: string | null = null
    if (epubFiles.length > 0) {
      epubRelPath = join(relDir, epubFiles[0])
      // Basename mismatch warning
      const epubBasename = basename(epubFiles[0], extname(epubFiles[0]))
      if (epubBasename !== m4bBasename) {
        warnings.push(
          `[scanner] Basename mismatch in ${relDir}: m4b="${m4bBasename}" epub="${epubBasename}"`,
        )
      }
    }

    // VTT check
    const vttPath = join(vttDir, `${m4bBasename}.vtt`)
    const hasVtt = existsSync(vttPath)

    // File fingerprint from m4b
    const m4bFullPath = join(dirPath, m4bName)
    let fingerprint: FileFingerprint
    let fileSize = 0
    try {
      const stat = statSync(m4bFullPath)
      fileSize = stat.size
      fingerprint = {
        relativePath: relM4b,
        mtimeMs: stat.mtimeMs,
        size: stat.size,
      }
    } catch {
      fingerprint = { relativePath: relM4b, mtimeMs: 0, size: 0 }
    }

    const metadata: BookMetadata = {
      title: m4bBasename,
      author: null,
      duration: null,
      bitrate: null,
      codec: null,
      fileSize,
    }

    books.push({
      id: makeBookId(m4bBasename),
      basename: m4bBasename,
      dirPath: relDir,
      m4bPath: relM4b,
      coverPath: relCover,
      epubPath: epubRelPath,
      hasVtt,
      metadata,
      fingerprint,
    })
  }

  // Recurse into subdirectories
  for (const subdir of subdirs) {
    scanDirectory(root, subdir, vttDir, books, warnings)
  }
}

/** Scan the audiobook root and return a library manifest. */
export function scanLibrary(
  audiobooksRoot: string,
  vttDir: string,
): LibraryManifest {
  const start = performance.now()
  const books: Array<BookRecord> = []
  const warnings: Array<string> = []

  console.log(`[scanner] Scanning ${audiobooksRoot} ...`)
  scanDirectory(audiobooksRoot, audiobooksRoot, vttDir, books, warnings)

  const elapsed = performance.now() - start

  // Log warnings
  for (const w of warnings) {
    console.warn(w)
  }

  // Sort by title for stable ordering
  books.sort((a, b) => a.basename.localeCompare(b.basename))

  console.log(
    `[scanner] Found ${books.length} books in ${elapsed.toFixed(0)}ms`,
  )

  return {
    books,
    scannedAt: new Date().toISOString(),
    scanDurationMs: Math.round(elapsed),
  }
}
