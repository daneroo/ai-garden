/**
 * Shared utilities for media serving endpoints.
 *
 * - Path traversal protection
 * - BookId validation
 * - Content-type mapping
 * - Range request handling
 */
import { createReadStream, statSync } from 'node:fs'
import { extname, normalize, resolve } from 'node:path'

import { getBookById } from '../lib/index'
import type { BookRecord } from '../lib/types'

const BOOK_ID_RE = /^[a-f0-9]{12}$/

/** Validate a bookId param; returns 400 Response on failure. */
export function validateBookId(
  bookId: string,
): { book: BookRecord } | { error: Response } {
  if (!bookId || !BOOK_ID_RE.test(bookId)) {
    return {
      error: new Response('Invalid bookId', { status: 400 }),
    }
  }
  const book = getBookById(bookId)
  if (!book) {
    return {
      error: new Response('Book not found', { status: 404 }),
    }
  }
  return { book }
}

/** Resolve a relative path against a root, with traversal guard. */
export function safePath(root: string, relativePath: string): string | null {
  const resolved = resolve(root, normalize(relativePath))
  if (!resolved.startsWith(root)) return null
  return resolved
}

/** Map file extensions to MIME types. */
const MIME_TYPES: Record<string, string> = {
  '.m4b': 'audio/mp4',
  '.m4a': 'audio/mp4',
  '.mp4': 'audio/mp4',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.epub': 'application/epub+zip',
  '.vtt': 'text/vtt; charset=utf-8',
}

export function getMimeType(filePath: string): string {
  return (
    MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
  )
}

/**
 * Serve a static file with appropriate headers.
 * Returns 200 for the full file.
 */
export function serveFile(absolutePath: string): Response {
  const start = performance.now()
  try {
    const stat = statSync(absolutePath)
    const mime = getMimeType(absolutePath)
    const stream = createReadStream(absolutePath)
    const elapsed = (performance.now() - start).toFixed(1)

    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
        'Server-Timing': `file;dur=${elapsed}`,
      },
    })
  } catch {
    return new Response('File not found', { status: 404 })
  }
}

/**
 * Serve a file with HTTP Range support (206 Partial Content).
 * Falls back to full 200 if no Range header present.
 */
export function serveFileWithRange(
  absolutePath: string,
  request: Request,
): Response {
  const timingStart = performance.now()
  let stat
  try {
    stat = statSync(absolutePath)
  } catch {
    return new Response('File not found', { status: 404 })
  }

  const mime = getMimeType(absolutePath)
  const rangeHeader = request.headers.get('range')

  if (!rangeHeader) {
    // Full response
    const stream = createReadStream(absolutePath)
    const elapsed = (performance.now() - timingStart).toFixed(1)
    return new Response(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Length': String(stat.size),
        'Cache-Control': 'public, max-age=86400',
        'Accept-Ranges': 'bytes',
        'Server-Timing': `file;dur=${elapsed}`,
      },
    })
  }

  // Parse Range header: bytes=start-end
  const match = /bytes=(\d+)-(\d*)/.exec(rangeHeader)
  if (!match) {
    return new Response('Invalid Range', {
      status: 416,
      headers: { 'Content-Range': `bytes */${stat.size}` },
    })
  }

  const start = parseInt(match[1], 10)
  const end = match[2] ? parseInt(match[2], 10) : stat.size - 1

  if (start >= stat.size || end >= stat.size || start > end) {
    return new Response('Range Not Satisfiable', {
      status: 416,
      headers: { 'Content-Range': `bytes */${stat.size}` },
    })
  }

  const contentLength = end - start + 1
  const stream = createReadStream(absolutePath, { start, end })
  const elapsed = (performance.now() - timingStart).toFixed(1)

  return new Response(stream as unknown as ReadableStream, {
    status: 206,
    headers: {
      'Content-Type': mime,
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Content-Length': String(contentLength),
      'Cache-Control': 'public, max-age=86400',
      'Accept-Ranges': 'bytes',
      'Server-Timing': `file;dur=${elapsed}`,
    },
  })
}
