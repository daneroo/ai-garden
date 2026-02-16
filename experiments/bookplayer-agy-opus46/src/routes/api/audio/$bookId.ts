/**
 * Audio streaming endpoint: GET /api/audio/$bookId
 * Supports HTTP Range requests for seek.
 */
import { createFileRoute } from '@tanstack/react-router'

import { getEnvConfig } from '../../../lib/env'
import {
  safePath,
  serveFileWithRange,
  validateBookId,
} from '../../../server/media'

export const Route = createFileRoute('/api/audio/$bookId')({
  server: {
    handlers: {
      GET: ({ params, request }) => {
        const result = validateBookId(params.bookId)
        if ('error' in result) return result.error

        const { audiobooksRoot } = getEnvConfig()
        const absPath = safePath(audiobooksRoot, result.book.m4bPath)
        if (!absPath) {
          return new Response('Forbidden', { status: 403 })
        }
        return serveFileWithRange(absPath, request)
      },
    },
  },
})
