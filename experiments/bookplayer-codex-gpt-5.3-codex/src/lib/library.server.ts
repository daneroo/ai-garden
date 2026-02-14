import { constants } from 'node:fs'
import { access, readdir, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'

const COVER_FILES = new Set(['cover.jpg', 'cover.jpeg', 'cover.png'])

export interface LibraryPair {
  id: string
  title: string
  author: string | null
  audioPath: string
  epubPath: string
  coverPath: string | null
  vttPath: string | null
  hasEpub: true
  hasVtt: boolean
  totalAudioDuration: string | null
  lastProgress: string | null
}

export interface LibraryIndex {
  audioRoot: string
  vttDir: string
  scannedAt: string
  pairs: LibraryPair[]
}

let cachedIndex: LibraryIndex | null = null

function readRequiredEnv(name: 'AUDIOBOOKS_ROOT' | 'VTT_DIR'): string {
  const value = process.env[name]
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable ${name}`)
  }
  return value.trim()
}

async function assertReadableDirectory(
  envName: 'AUDIOBOOKS_ROOT' | 'VTT_DIR',
  directoryPath: string,
) {
  let info
  try {
    info = await stat(directoryPath)
  } catch {
    throw new Error(`${envName} does not exist: ${directoryPath}`)
  }

  if (!info.isDirectory()) {
    throw new Error(`${envName} is not a directory: ${directoryPath}`)
  }

  try {
    await access(directoryPath, constants.R_OK)
  } catch {
    throw new Error(`${envName} is not readable: ${directoryPath}`)
  }
}

function isHidden(entryName: string): boolean {
  return entryName.startsWith('.')
}

function toTitle(rawName: string): string {
  return rawName.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
}

async function collectVttNames(vttDir: string): Promise<Set<string>> {
  const entries = await readdir(vttDir, { withFileTypes: true })
  const names = entries
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.vtt'),
    )
    .map((entry) => entry.name)
  return new Set(names)
}

async function scanStrictPairs(
  audioRoot: string,
  vttDir: string,
  vttNames: Set<string>,
): Promise<LibraryPair[]> {
  const queue: string[] = [audioRoot]
  const pairs: LibraryPair[] = []

  while (queue.length > 0) {
    const currentDir = queue.pop()
    if (!currentDir) {
      continue
    }

    let entries
    try {
      entries = await readdir(currentDir, { withFileTypes: true })
    } catch {
      console.warn(`[scanner] skipping unreadable directory: ${currentDir}`)
      continue
    }

    const files: string[] = []
    for (const entry of entries) {
      if (isHidden(entry.name)) {
        continue
      }

      if (entry.isDirectory()) {
        queue.push(join(currentDir, entry.name))
        continue
      }

      if (entry.isFile()) {
        files.push(entry.name)
      }
    }

    const m4bFiles = files
      .filter((name) => name.toLowerCase().endsWith('.m4b'))
      .sort()
    const epubFiles = files
      .filter((name) => name.toLowerCase().endsWith('.epub'))
      .sort()

    if (m4bFiles.length === 0 || epubFiles.length === 0) {
      continue
    }

    const audioFile = m4bFiles[0]
    const epubFile = epubFiles[0]
    const pairId = basename(audioFile, '.m4b')
    const epubBase = basename(epubFile, '.epub')

    if (pairId !== epubBase) {
      console.warn(
        `[scanner] basename mismatch in ${currentDir}: ${audioFile} vs ${epubFile}`,
      )
    }

    let coverPath: string | null = null
    for (const fileName of files) {
      if (COVER_FILES.has(fileName.toLowerCase())) {
        coverPath = join(currentDir, fileName)
        break
      }
    }

    const vttFileName = `${pairId}.vtt`
    const hasVtt = vttNames.has(vttFileName)

    pairs.push({
      id: pairId,
      title: toTitle(pairId),
      author: null,
      audioPath: join(currentDir, audioFile),
      epubPath: join(currentDir, epubFile),
      coverPath,
      vttPath: hasVtt ? join(vttDir, vttFileName) : null,
      hasEpub: true,
      hasVtt,
      totalAudioDuration: null,
      lastProgress: null,
    })
  }

  return pairs.sort((a, b) => a.title.localeCompare(b.title))
}

export async function createLibraryIndexFromRoots(
  audioRoot: string,
  vttDir: string,
): Promise<LibraryIndex> {
  await assertReadableDirectory('AUDIOBOOKS_ROOT', audioRoot)
  await assertReadableDirectory('VTT_DIR', vttDir)

  const vttNames = await collectVttNames(vttDir)
  const pairs = await scanStrictPairs(audioRoot, vttDir, vttNames)

  return {
    audioRoot,
    vttDir,
    scannedAt: new Date().toISOString(),
    pairs,
  }
}

export async function loadLibraryIndex(options?: {
  force?: boolean
}): Promise<LibraryIndex> {
  if (cachedIndex && !options?.force) {
    return cachedIndex
  }

  const audioRoot = readRequiredEnv('AUDIOBOOKS_ROOT')
  const vttDir = readRequiredEnv('VTT_DIR')
  cachedIndex = await createLibraryIndexFromRoots(audioRoot, vttDir)

  return cachedIndex
}

export async function refreshLibraryIndex(): Promise<LibraryIndex> {
  return loadLibraryIndex({ force: true })
}

export async function getPairById(pairId: string): Promise<LibraryPair | null> {
  const index = await loadLibraryIndex()
  return index.pairs.find((pair) => pair.id === pairId) ?? null
}

export function clearLibraryIndexCache() {
  cachedIndex = null
}
