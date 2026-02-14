import { constants, createReadStream } from 'node:fs'
import { access, readFile, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import { Readable } from 'node:stream'
import type { LibraryPair } from '@/lib/library.server'
import { RouteDataError } from '@/lib/route-data.server'

export type AssetKind = 'audio' | 'epub' | 'cover' | 'vtt'

interface ByteRange {
  start: number
  end: number
}

function inferContentType(filePath: string): string {
  const ext = extname(filePath).toLowerCase()
  switch (ext) {
    case '.m4b':
    case '.m4a':
      return 'audio/mp4'
    case '.epub':
      return 'application/epub+zip'
    case '.vtt':
      return 'text/vtt; charset=utf-8'
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    default:
      return 'application/octet-stream'
  }
}

function parseSingleRange(rangeHeader: string, totalSize: number): ByteRange {
  const trimmed = rangeHeader.trim()
  if (!trimmed.startsWith('bytes=')) {
    throw new RouteDataError(
      416,
      'INVALID_RANGE',
      'Range header must start with "bytes=".',
    )
  }

  const [startPart, endPart] = trimmed.replace('bytes=', '').split('-', 2)
  const hasStart = startPart.length > 0
  const hasEnd = endPart.length > 0

  if (!hasStart && !hasEnd) {
    throw new RouteDataError(
      416,
      'INVALID_RANGE',
      'Range header must provide a start or end byte.',
    )
  }

  if (!hasStart) {
    const suffixLength = Number.parseInt(endPart, 10)
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) {
      throw new RouteDataError(416, 'INVALID_RANGE', 'Invalid suffix range.')
    }
    const start = Math.max(totalSize - suffixLength, 0)
    return { start, end: totalSize - 1 }
  }

  const start = Number.parseInt(startPart, 10)
  const end = hasEnd ? Number.parseInt(endPart, 10) : totalSize - 1

  if (!Number.isFinite(start) || start < 0) {
    throw new RouteDataError(416, 'INVALID_RANGE', 'Invalid range start.')
  }
  if (!Number.isFinite(end) || end < start) {
    throw new RouteDataError(416, 'INVALID_RANGE', 'Invalid range end.')
  }
  if (start >= totalSize) {
    throw new RouteDataError(
      416,
      'INVALID_RANGE',
      'Range start exceeds file size.',
    )
  }

  return { start, end: Math.min(end, totalSize - 1) }
}

export function resolveAssetPath(
  pair: LibraryPair,
  kind: AssetKind,
): string | null {
  switch (kind) {
    case 'audio':
      return pair.audioPath
    case 'epub':
      return pair.epubPath
    case 'cover':
      return pair.coverPath
    case 'vtt':
      return pair.vttPath
    default:
      return null
  }
}

export async function buildAssetResponse(
  request: Request,
  filePath: string,
  options?: { allowRange?: boolean },
): Promise<Response> {
  let info
  try {
    info = await stat(filePath)
  } catch {
    throw new RouteDataError(
      404,
      'ASSET_NOT_FOUND',
      `Asset not found: ${filePath}`,
    )
  }

  if (!info.isFile()) {
    throw new RouteDataError(
      404,
      'ASSET_NOT_FOUND',
      `Asset path is not a file: ${filePath}`,
    )
  }

  try {
    await access(filePath, constants.R_OK)
  } catch {
    throw new RouteDataError(
      403,
      'ASSET_UNREADABLE',
      `Asset is not readable: ${filePath}`,
    )
  }

  const contentType = inferContentType(filePath)
  const allowRange = options?.allowRange ?? false
  const rangeHeader = request.headers.get('range')

  if (allowRange && rangeHeader) {
    const range = parseSingleRange(rangeHeader, info.size)
    const stream = createReadStream(filePath, {
      start: range.start,
      end: range.end,
    })
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      status: 206,
      headers: {
        'content-type': contentType,
        'content-length': String(range.end - range.start + 1),
        'accept-ranges': 'bytes',
        'content-range': `bytes ${range.start}-${range.end}/${info.size}`,
        'cache-control': 'no-store',
      },
    })
  }

  if (!allowRange) {
    // Nitro + Bun can report content-length mismatches for streamed EPUB responses.
    // Returning a buffered body avoids truncated stream behavior for reader assets.
    const bytes = await readFile(filePath)
    return new Response(bytes, {
      status: 200,
      headers: {
        'content-type': contentType,
        'cache-control': 'no-store',
      },
    })
  }

  const stream = createReadStream(filePath)
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    status: 200,
    headers: {
      'content-type': contentType,
      'accept-ranges': 'bytes',
      'cache-control': 'no-store',
    },
  })
}
