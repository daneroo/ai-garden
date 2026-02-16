/**
 * Library index — in-memory manifest with scan lock and cache persistence.
 *
 * - Single active scan at a time (scan lock)
 * - Persists to .book-cache.json, restores on startup
 * - Revalidates in background after cache restore
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { getEnvConfig } from './env'
import { probeFile, withConcurrency } from './ffprobe'
import { scanLibrary } from './scanner'
import type { BookCache, BookRecord, LibraryManifest } from './types'

const CACHE_FILE = resolve(import.meta.dirname, '../../.book-cache.json')

let manifest: LibraryManifest | null = null
let scanning = false

/** Try to restore from persisted cache. */
function restoreCache(): LibraryManifest | null {
  try {
    const raw = readFileSync(CACHE_FILE, 'utf-8')
    const cache = JSON.parse(raw) as BookCache
    if (Array.isArray(cache.books)) {
      console.log(
        `[index] Restored ${cache.books.length} books from cache (${cache.scannedAt})`,
      )
      return {
        books: cache.books,
        scannedAt: cache.scannedAt,
        scanDurationMs: 0,
      }
    }
  } catch {
    // No cache or invalid — that's fine
  }
  return null
}

/** Persist manifest to cache file. */
function persistCache(m: LibraryManifest): void {
  try {
    const cache: BookCache = {
      version: 1,
      scannedAt: m.scannedAt,
      books: m.books,
    }
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8')
    console.log(`[index] Cache persisted to ${CACHE_FILE}`)
  } catch (err) {
    console.warn(`[index] Failed to persist cache: ${err}`)
  }
}

/** Perform a scan and update the manifest. Returns true if scan ran. */
function doScan(): boolean {
  if (scanning) {
    console.log('[index] Scan already in progress, skipping.')
    return false
  }
  scanning = true
  try {
    const config = getEnvConfig()
    manifest = scanLibrary(config.audiobooksRoot, config.vttDir)
    persistCache(manifest)

    // Background ffprobe enrichment (bounded concurrency, non-blocking)
    const books = manifest.books
    const root = config.audiobooksRoot
    void enrichMetadata(books, root)

    return true
  } finally {
    scanning = false
  }
}

/** Enrich book metadata with ffprobe (duration, bitrate, codec). */
async function enrichMetadata(
  books: Array<BookRecord>,
  root: string,
): Promise<void> {
  const CONCURRENCY = 4
  const needsProbe = books.filter((b) => b.metadata.duration === null)
  if (needsProbe.length === 0) return

  const start = performance.now()
  console.log(
    `[ffprobe] Probing ${needsProbe.length} books (concurrency=${CONCURRENCY})…`,
  )

  const results = await withConcurrency(needsProbe, CONCURRENCY, async (b) => {
    const filePath = resolve(root, b.m4bPath)
    return probeFile(filePath)
  })

  let enriched = 0
  for (let i = 0; i < needsProbe.length; i++) {
    const r = results[i]
    if (r.duration !== null) {
      needsProbe[i].metadata.duration = r.duration
      needsProbe[i].metadata.bitrate = r.bitrate
      needsProbe[i].metadata.codec = r.codec
      enriched++
    }
  }

  const elapsed = performance.now() - start
  console.log(
    `[ffprobe] Enriched ${enriched}/${needsProbe.length} books in ${elapsed.toFixed(
      0,
    )}ms`,
  )

  // Re-persist cache with enriched metadata
  if (enriched > 0 && manifest) {
    persistCache(manifest)
  }
}

/** Get the current library manifest. Initializes on first call. */
export function getLibrary(): LibraryManifest {
  if (manifest) return manifest

  // Try cache first
  manifest = restoreCache()
  if (manifest) {
    // Background revalidation
    queueMicrotask(() => doScan())
    return manifest
  }

  // No cache — synchronous first scan
  doScan()
  return manifest!
}

/** Force a re-scan. Returns the updated manifest. */
export function refreshLibrary(): LibraryManifest {
  doScan()
  return manifest!
}

/** Look up a single book by id. */
export function getBookById(bookId: string): BookRecord | undefined {
  const lib = getLibrary()
  return lib.books.find((b) => b.id === bookId)
}

/** Returns whether a scan is currently in progress. */
export function isScanInProgress(): boolean {
  return scanning
}
