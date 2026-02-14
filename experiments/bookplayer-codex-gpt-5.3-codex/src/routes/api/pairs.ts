import { createFileRoute } from '@tanstack/react-router'
import { asErrorResponse, okJson } from '@/lib/api-response.server'
import { getPairsDirectoryData } from '@/lib/route-data.server'

export const Route = createFileRoute('/api/pairs')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await getPairsDirectoryData()
          return okJson(data)
        } catch (error) {
          return asErrorResponse(error)
        }
      },
    },
  },
})
