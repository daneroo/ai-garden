import { createFileRoute } from '@tanstack/react-router'
import { asErrorResponse, errorJson } from '@/lib/api-response.server'
import {
  buildAssetResponse,
  type AssetKind,
  resolveAssetPath,
} from '@/lib/media.server'
import { getPairById } from '@/lib/library.server'
import { assertValidPairId, RouteDataError } from '@/lib/route-data.server'

const ASSET_KINDS: AssetKind[] = ['audio', 'epub', 'cover', 'vtt']

function parseAssetKind(request: Request): AssetKind {
  const url = new URL(request.url)
  const rawKind = url.searchParams.get('kind')

  if (!rawKind || !ASSET_KINDS.includes(rawKind as AssetKind)) {
    throw new RouteDataError(
      400,
      'INVALID_ASSET_KIND',
      'Query parameter "kind" must be one of: audio, epub, cover, vtt.',
    )
  }

  return rawKind as AssetKind
}

export const Route = createFileRoute('/api/assets/$pairId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const pairId = assertValidPairId(params.pairId)
          const kind = parseAssetKind(request)
          const pair = await getPairById(pairId)

          if (!pair) {
            return errorJson(
              'PAIR_NOT_FOUND',
              `No pair was found for id "${pairId}".`,
              404,
            )
          }

          const assetPath = resolveAssetPath(pair, kind)
          if (!assetPath) {
            return errorJson(
              'ASSET_UNAVAILABLE',
              `No ${kind} asset is available for pair "${pairId}".`,
              404,
            )
          }

          return await buildAssetResponse(request, assetPath, {
            allowRange: kind === 'audio',
          })
        } catch (error) {
          return asErrorResponse(error)
        }
      },
    },
  },
})
