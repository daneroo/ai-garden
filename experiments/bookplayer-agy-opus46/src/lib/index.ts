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
    return true
  } finally {
    scanning = false
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
