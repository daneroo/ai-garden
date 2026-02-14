import {
  getPairById,
  loadLibraryIndex,
  type LibraryPair,
} from '@/lib/library.server'

export class RouteDataError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export interface PairAssetUrls {
  audio: string
  epub: string
  cover: string | null
  vtt: string | null
}

export interface PublicLibraryPair {
  id: string
  title: string
  author: string | null
  hasEpub: boolean
  hasVtt: boolean
  totalAudioDuration: string | null
  lastProgress: string | null
  assets: PairAssetUrls
}

export function assertValidPairId(pairId: string): string {
  if (
    pairId.trim().length === 0 ||
    pairId.includes('/') ||
    pairId.includes('\\') ||
    pairId.includes('\0')
  ) {
    throw new RouteDataError(
      400,
      'INVALID_PAIR_ID',
      'pairId must be a non-empty basename and must not contain path separators.',
    )
  }
  return pairId
}

export function buildPairAssetUrls(
  pairId: string,
  options?: { hasCover?: boolean; hasVtt?: boolean },
): PairAssetUrls {
  const encodedId = encodeURIComponent(pairId)
  return {
    audio: `/api/assets/${encodedId}?kind=audio`,
    epub: `/api/assets/${encodedId}?kind=epub`,
    cover:
      options?.hasCover === false
        ? null
        : `/api/assets/${encodedId}?kind=cover`,
    vtt: options?.hasVtt === false ? null : `/api/assets/${encodedId}?kind=vtt`,
  }
}

function toPublicPair(pair: LibraryPair): PublicLibraryPair {
  return {
    id: pair.id,
    title: pair.title,
    author: pair.author,
    hasEpub: pair.hasEpub,
    hasVtt: pair.hasVtt,
    totalAudioDuration: pair.totalAudioDuration,
    lastProgress: pair.lastProgress,
    assets: buildPairAssetUrls(pair.id, {
      hasCover: !!pair.coverPath,
      hasVtt: pair.hasVtt,
    }),
  }
}

export async function getPairsDirectoryData() {
  const index = await loadLibraryIndex()

  return {
    scannedAt: index.scannedAt,
    audioRoot: index.audioRoot,
    vttDir: index.vttDir,
    pairs: index.pairs.map(toPublicPair),
  }
}

export async function getPairDetailData(
  pairId: string,
): Promise<PublicLibraryPair> {
  const validPairId = assertValidPairId(pairId)
  const pair = await getPairById(validPairId)

  if (!pair) {
    throw new RouteDataError(
      404,
      'PAIR_NOT_FOUND',
      `No pair was found for id "${validPairId}".`,
    )
  }

  return toPublicPair(pair)
}

export async function getPlayerPageData(pairId: string) {
  const [index, pair] = await Promise.all([
    loadLibraryIndex(),
    getPairDetailData(pairId),
  ])

  return {
    pair,
    scannedAt: index.scannedAt,
  }
}
