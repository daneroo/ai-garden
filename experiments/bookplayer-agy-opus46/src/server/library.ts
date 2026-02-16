/**
 * Server functions for book library access.
 */
import { createServerFn } from '@tanstack/react-start'

import { getBookById, getLibrary, refreshLibrary } from '../lib/index'

/** Fetch the full library listing (lightweight — no binary assets). */
export const fetchLibrary = createServerFn({ method: 'GET' }).handler(() => {
  const lib = getLibrary()
  return {
    books: lib.books.map((b) => ({
      id: b.id,
      basename: b.basename,
      title: b.metadata.title,
      author: b.metadata.author,
      duration: b.metadata.duration,
      fileSize: b.metadata.fileSize,
      hasEpub: b.epubPath !== null,
      hasVtt: b.hasVtt,
    })),
    scannedAt: lib.scannedAt,
    scanDurationMs: lib.scanDurationMs,
  }
})

/** Fetch details for a single book by id. */
export const fetchBook = createServerFn({ method: 'GET' })
  .inputValidator((bookId: string) => {
    if (
      !bookId ||
      typeof bookId !== 'string' ||
      !/^[a-f0-9]{12}$/.test(bookId)
    ) {
      throw new Error('Invalid bookId')
    }
    return bookId
  })
  .handler(({ data: bookId }) => {
    const book = getBookById(bookId)
    if (!book) {
      throw new Error(`Book not found: ${bookId}`)
    }
    return {
      id: book.id,
      basename: book.basename,
      title: book.metadata.title,
      author: book.metadata.author,
      duration: book.metadata.duration,
      fileSize: book.metadata.fileSize,
      hasEpub: book.epubPath !== null,
      hasVtt: book.hasVtt,
    }
  })

/** Trigger a library re-scan. */
export const triggerRescan = createServerFn({ method: 'POST' }).handler(() => {
  const lib = refreshLibrary()
  return {
    bookCount: lib.books.length,
    scannedAt: lib.scannedAt,
    scanDurationMs: lib.scanDurationMs,
  }
})
