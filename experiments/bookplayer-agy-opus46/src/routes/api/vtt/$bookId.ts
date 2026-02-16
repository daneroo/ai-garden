/**
 * VTT transcript endpoint: GET /api/vtt/$bookId
 */
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { createFileRoute } from '@tanstack/react-router'

import { getEnvConfig } from '../../../lib/env'
import { serveFile, validateBookId } from '../../../server/media'

export const Route = createFileRoute('/api/vtt/$bookId')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const result = validateBookId(params.bookId)
        if ('error' in result) return result.error

        if (!result.book.hasVtt) {
          return new Response('No transcript available for this book', {
            status: 404,
          })
        }

        const { vttDir } = getEnvConfig()
        const vttPath = join(vttDir, `${result.book.basename}.vtt`)

        if (!existsSync(vttPath)) {
          return new Response('VTT file not found', { status: 404 })
        }

        return serveFile(vttPath)
      },
    },
  },
})
