import { createFileRoute } from '@tanstack/react-router'
import { asErrorResponse, okJson } from '@/lib/api-response.server'
import { getPairDetailData } from '@/lib/route-data.server'

export const Route = createFileRoute('/api/pairs/$pairId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        try {
          const data = await getPairDetailData(params.pairId)
          return okJson(data)
        } catch (error) {
          return asErrorResponse(error)
        }
      },
    },
  },
})
