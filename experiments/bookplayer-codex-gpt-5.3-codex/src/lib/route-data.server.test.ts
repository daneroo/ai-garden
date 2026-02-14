import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { clearLibraryIndexCache } from '@/lib/library.server'
import {
  getPairDetailData,
  getPairsDirectoryData,
  getPlayerPageData,
  RouteDataError,
} from '@/lib/route-data.server'

let audioRoot = ''
let vttRoot = ''
let previousAudioRoot: string | undefined
let previousVttRoot: string | undefined

async function setupFixtures() {
  audioRoot = await mkdtemp(join(tmpdir(), 'bookplayer-audio-'))
  vttRoot = await mkdtemp(join(tmpdir(), 'bookplayer-vtt-'))

  await mkdir(join(audioRoot, 'book-one'))
  await writeFile(join(audioRoot, 'book-one', 'Book One.m4b'), '')
  await writeFile(join(audioRoot, 'book-one', 'Book One.epub'), '')
  await writeFile(join(vttRoot, 'Book One.vtt'), 'WEBVTT')
}

beforeEach(async () => {
  previousAudioRoot = process.env.AUDIOBOOKS_ROOT
  previousVttRoot = process.env.VTT_DIR
  await setupFixtures()
  process.env.AUDIOBOOKS_ROOT = audioRoot
  process.env.VTT_DIR = vttRoot
  clearLibraryIndexCache()
})

afterEach(async () => {
  clearLibraryIndexCache()
  process.env.AUDIOBOOKS_ROOT = previousAudioRoot
  process.env.VTT_DIR = previousVttRoot
  await Promise.all([
    rm(audioRoot, { recursive: true, force: true }),
    rm(vttRoot, { recursive: true, force: true }),
  ])
})

describe('route data helpers', () => {
  it('returns directory data with client-usable asset URLs', async () => {
    const data = await getPairsDirectoryData()
    expect(data.pairs).toHaveLength(1)
    expect(data.pairs[0]?.assets.audio).toBe(
      '/api/assets/Book%20One?kind=audio',
    )
    expect(data.pairs[0]?.assets.epub).toBe('/api/assets/Book%20One?kind=epub')
    expect(data.pairs[0]?.assets.vtt).toBe('/api/assets/Book%20One?kind=vtt')
  })

  it('returns player page data for a valid pair id', async () => {
    const data = await getPlayerPageData('Book One')
    expect(data.pair.id).toBe('Book One')
    expect(typeof data.scannedAt).toBe('string')
  })

  it('throws structured errors for invalid and unknown pair ids', async () => {
    await expect(getPairDetailData('../oops')).rejects.toMatchObject({
      code: 'INVALID_PAIR_ID',
      status: 400,
    } satisfies Pick<RouteDataError, 'code' | 'status'>)

    await expect(getPairDetailData('Missing Book')).rejects.toMatchObject({
      code: 'PAIR_NOT_FOUND',
      status: 404,
    } satisfies Pick<RouteDataError, 'code' | 'status'>)
  })
})
