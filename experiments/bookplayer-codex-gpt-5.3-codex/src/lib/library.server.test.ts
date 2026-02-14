import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  clearLibraryIndexCache,
  createLibraryIndexFromRoots,
} from '@/lib/library.server'

const tempDirs: string[] = []

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  clearLibraryIndexCache()
  await Promise.all(
    tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  )
})

describe('createLibraryIndexFromRoots', () => {
  it('includes only strict .m4b + .epub matches and skips hidden directories', async () => {
    const audioRoot = await makeTempDir('bookplayer-audio-')
    const vttRoot = await makeTempDir('bookplayer-vtt-')

    await mkdir(join(audioRoot, '.hidden'))
    await mkdir(join(audioRoot, 'matched'))
    await mkdir(join(audioRoot, 'unmatched-audio'))
    await mkdir(join(audioRoot, 'series', 'book-two'), { recursive: true })

    await writeFile(join(audioRoot, '.hidden', 'Ghost.m4b'), '')
    await writeFile(join(audioRoot, '.hidden', 'Ghost.epub'), '')

    await writeFile(join(audioRoot, 'matched', 'Book One.m4b'), '')
    await writeFile(join(audioRoot, 'matched', 'Book One.epub'), '')
    await writeFile(join(audioRoot, 'matched', 'cover.jpg'), '')

    await writeFile(join(audioRoot, 'unmatched-audio', 'Only Audio.m4b'), '')

    await writeFile(join(audioRoot, 'series', 'book-two', 'Book Two.m4b'), '')
    await writeFile(join(audioRoot, 'series', 'book-two', 'Book Two.epub'), '')

    await writeFile(join(vttRoot, 'Book One.vtt'), 'WEBVTT')

    const index = await createLibraryIndexFromRoots(audioRoot, vttRoot)
    const ids = index.pairs.map((pair) => pair.id)

    expect(ids).toEqual(['Book One', 'Book Two'])
    expect(index.pairs[0]?.hasVtt).toBe(true)
    expect(index.pairs[1]?.hasVtt).toBe(false)
    expect(index.pairs[0]?.coverPath).toContain('cover.jpg')
  })

  it('pairs by folder even when m4b and epub basenames differ', async () => {
    const audioRoot = await makeTempDir('bookplayer-audio-')
    const vttRoot = await makeTempDir('bookplayer-vtt-')

    await mkdir(join(audioRoot, 'mismatch'))
    await writeFile(join(audioRoot, 'mismatch', 'Audio Name.m4b'), '')
    await writeFile(join(audioRoot, 'mismatch', 'Text Name.epub'), '')

    const index = await createLibraryIndexFromRoots(audioRoot, vttRoot)

    expect(index.pairs).toHaveLength(1)
    expect(index.pairs[0]?.id).toBe('Audio Name')
    expect(index.pairs[0]?.hasEpub).toBe(true)
  })
})
