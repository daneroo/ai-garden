import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

export interface Book {
  id: string
  title: string
  relPath: string
  audioFile: string | null
  hasCover: boolean
  textFile: string | null
  vttFile: string | null
}

const AUDIO_EXTS = ['.m4b', '.mp3', '.m4a']
const TEXT_EXTS = ['.epub', '.pdf']
const COVER_NAMES = ['cover.jpg', 'cover.png', 'folder.jpg']

async function scanDir(dirPath: string, root: string): Promise<Book[]> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile()).map((e) => e.name)
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name)

  const audioFile = files.find((f) => AUDIO_EXTS.some((ext) => f.endsWith(ext)))

  if (audioFile) {
    const coverFile = files.find((f) => COVER_NAMES.includes(f.toLowerCase()))
    const textFile = files.find((f) => TEXT_EXTS.some((ext) => f.endsWith(ext)))
    const relPath = dirPath.slice(root.length).replace(/^\//, '')
    return [
      {
        id: Buffer.from(dirPath).toString('base64url'),
        title: dirPath.split('/').pop() ?? dirPath,
        relPath,
        audioFile: audioFile ?? null,
        hasCover: !!coverFile,
        textFile: textFile ?? null,
        vttFile: null,
      },
    ]
  }

  // No audio file here — recurse into subdirectories (series folders)
  const nested = await Promise.all(
    dirs.map((d) => scanDir(join(dirPath, d), root)),
  )
  return nested.flat()
}

export async function scanLibrary(
  root: string,
  vttDir?: string,
): Promise<{ books: Book[]; root: string }> {
  const t0 = performance.now()
  console.log(`[scanner] scanning ${root}`)

  try {
    await stat(root)
  } catch {
    console.log(`[scanner] root not found: ${root}`)
    return { books: [], root }
  }

  const entries = await readdir(root, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  const results = await Promise.all(
    dirs.map((d) => scanDir(join(root, d), root)),
  )
  const books = results.flat().sort((a, b) => a.title.localeCompare(b.title))

  // Match VTT files from VTT_DIR by audio filename
  if (vttDir) {
    try {
      const vttFiles = new Set(
        (await readdir(vttDir)).filter((f) => f.endsWith('.vtt')),
      )
      for (const book of books) {
        if (book.audioFile) {
          const base = book.audioFile.replace(/\.[^.]+$/, '')
          const vttName = `${base}.vtt`
          if (vttFiles.has(vttName)) {
            book.vttFile = vttName
          }
        }
      }
      console.log(
        `[scanner] matched ${books.filter((b) => b.vttFile).length} VTT files from ${vttDir}`,
      )
    } catch {
      console.log(`[scanner] VTT dir not accessible: ${vttDir}`)
    }
  }

  const elapsed = (performance.now() - t0).toFixed(0)
  console.log(`[scanner] found ${books.length} books in ${elapsed}ms`)
  return { books, root }
}
