/**
 * Cover image endpoint: GET /api/cover/$bookId
 */
import { createFileRoute } from '@tanstack/react-router'

import { getEnvConfig } from '../../../lib/env'
import { safePath, serveFile, validateBookId } from '../../../server/media'

export const Route = createFileRoute('/api/cover/$bookId')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const result = validateBookId(params.bookId)
        if ('error' in result) return result.error

        const { audiobooksRoot } = getEnvConfig()
        const absPath = safePath(audiobooksRoot, result.book.coverPath)
        if (!absPath) {
          return new Response('Forbidden', { status: 403 })
        }
        return serveFile(absPath)
      },
    },
  },
})
