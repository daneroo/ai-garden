/**
 * EPUB file endpoint: GET /api/epub/$bookId
 */
import { createFileRoute } from '@tanstack/react-router'

import { getEnvConfig } from '../../../lib/env'
import { safePath, serveFile, validateBookId } from '../../../server/media'

export const Route = createFileRoute('/api/epub/$bookId')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const result = validateBookId(params.bookId)
        if ('error' in result) return result.error

        if (!result.book.epubPath) {
          return new Response('No EPUB available for this book', {
            status: 404,
          })
        }

        const { audiobooksRoot } = getEnvConfig()
        const absPath = safePath(audiobooksRoot, result.book.epubPath)
        if (!absPath) {
          return new Response('Forbidden', { status: 403 })
        }
        return serveFile(absPath)
      },
    },
  },
})
