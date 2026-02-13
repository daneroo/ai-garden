import { useRef, useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { scanLibrary } from '../../lib/scanner'

const getBook = createServerFn({ method: 'GET' }).handler(async () => {
  const root = process.env.AUDIOBOOKS_ROOT ?? ''
  const vttDir = process.env.VTT_DIR || undefined
  return scanLibrary(root, vttDir)
})

export const Route = createFileRoute('/player/$id')({
  loader: ({ params }) =>
    getBook().then(({ books }) => {
      const book = books.find((b) => b.id === params.id)
      if (!book) throw new Error('Book not found')
      return book
    }),
  component: PlayerPage,
})

function PlayerPage() {
  const book = Route.useLoaderData()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const storageKey = `bookplayer:${book.id}`

  // Save progress every 5 seconds
  const lastSaveRef = useRef(0)
  const saveProgress = useCallback(
    (time: number) => {
      const now = Date.now()
      if (now - lastSaveRef.current < 5000) return
      lastSaveRef.current = now
      try {
        localStorage.setItem(storageKey, String(time))
      } catch {
        // ignore
      }
    },
    [storageKey],
  )

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Restore saved position
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const time = Number(saved)
        if (isFinite(time) && time > 0) {
          audio.currentTime = time
        }
      }
    } catch {
      // ignore
    }

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      saveProgress(audio.currentTime)
    }
    const onDurationChange = () => setDuration(audio.duration)
    // Pick up duration if already loaded before listener attached
    if (audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => {
      setPlaying(false)
      // Always save on pause
      try {
        localStorage.setItem(storageKey, String(audio.currentTime))
      } catch {
        // ignore
      }
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [storageKey, saveProgress])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) audio.pause()
    else audio.play()
  }, [playing])

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Number(e.target.value)
  }

  const skip = (seconds: number) => {
    const audio = audioRef.current
    if (audio) audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds))
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          skip(e.shiftKey ? -60 : -15)
          break
        case 'ArrowRight':
          skip(e.shiftKey ? 60 : 15)
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [togglePlay])

  const audioSrc = book.audioFile
    ? `/audiobooks/${encodeURI(book.relPath)}/${encodeURIComponent(book.audioFile)}`
    : undefined

  const epubSrc = book.textFile
    ? `/audiobooks/${encodeURI(book.relPath)}/${encodeURIComponent(book.textFile)}`
    : undefined

  const vttSrc = book.vttFile
    ? `/vtt/${encodeURIComponent(book.vttFile)}`
    : undefined

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
      <header className="border-b border-slate-700 px-6 py-3 flex items-center gap-4 shrink-0">
        <Link to="/" className="text-slate-400 hover:text-white">
          &larr; Library
        </Link>
        <h1 className="text-lg font-bold truncate">{book.title}</h1>
      </header>

      {/* Epub reader: fills available space above player */}
      <main className="flex-1 overflow-hidden px-4 py-4">
        <div className="mx-auto h-full max-w-4xl">
          {epubSrc ? (
            <EpubReader src={epubSrc} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No epub available for this book.
            </div>
          )}
        </div>
      </main>

      {/* VTT transcript: scrollable strip above audio controls */}
      {vttSrc && (
        <VttTranscript src={vttSrc} currentTime={currentTime} onSeek={(t) => {
          const audio = audioRef.current
          if (audio) audio.currentTime = t
        }} />
      )}

      {/* Audio player: compact bar at bottom */}
      {audioSrc && (
        <div className="shrink-0 border-t border-slate-700 bg-slate-800 px-4 py-2">
          <audio ref={audioRef} src={audioSrc} preload="metadata" />
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            {/* Small cover art */}
            {book.hasCover ? (
              <img
                src={`/audiobooks/${encodeURI(book.relPath)}/cover.jpg`}
                alt={book.title}
                className="w-10 h-10 object-cover rounded shadow"
              />
            ) : (
              <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-lg shrink-0">
                📖
              </div>
            )}

            {/* Transport controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => skip(-60)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                -1m
              </button>
              <button
                onClick={() => skip(-15)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                -15s
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm"
              >
                {playing ? '⏸' : '▶'}
              </button>
              <button
                onClick={() => skip(15)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                +15s
              </button>
              <button
                onClick={() => skip(60)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                +1m
              </button>
            </div>

            {/* Seek bar + time */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="text-xs text-slate-500 tabular-nums w-12 text-right shrink-0">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={seek}
                className="flex-1 accent-slate-400 h-1"
              />
              <span className="text-xs text-slate-500 tabular-nums w-12 shrink-0">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface VttCue {
  start: number
  end: number
  text: string
}

function parseVtt(raw: string): VttCue[] {
  const cues: VttCue[] = []
  const blocks = raw.split(/\n\n+/)
  for (const block of blocks) {
    const match = block.match(
      /(\d{2}):(\d{2}):(\d{2})[.,](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[.,](\d{3})/,
    )
    if (!match) continue
    const start =
      +match[1] * 3600 + +match[2] * 60 + +match[3] + +match[4] / 1000
    const end =
      +match[5] * 3600 + +match[6] * 60 + +match[7] + +match[8] / 1000
    const lines = block.split('\n')
    const timeIdx = lines.findIndex((l) => l.includes('-->'))
    const text = lines
      .slice(timeIdx + 1)
      .join(' ')
      .trim()
    if (text) cues.push({ start, end, text })
  }
  return cues
}

function VttTranscript({
  src,
  currentTime,
  onSeek,
}: {
  src: string
  currentTime: number
  onSeek: (time: number) => void
}) {
  const [cues, setCues] = useState<VttCue[]>([])
  const activeRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(src)
      .then((r) => r.text())
      .then((raw) => setCues(parseVtt(raw)))
      .catch(() => setCues([]))
  }, [src])

  // Auto-scroll to active cue
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentTime, cues])

  if (cues.length === 0) return null

  const activeIdx = cues.findIndex(
    (c) => currentTime >= c.start && currentTime < c.end,
  )

  return (
    <div
      ref={containerRef}
      className="shrink-0 border-t border-slate-700 bg-slate-850 max-h-28 overflow-y-auto px-4 py-2"
    >
      <div className="max-w-4xl mx-auto space-y-0.5">
        {cues.map((cue, i) => (
          <button
            key={i}
            ref={i === activeIdx ? activeRef : undefined}
            onClick={() => onSeek(cue.start)}
            className={`block w-full text-left text-xs px-2 py-0.5 rounded transition-colors ${
              i === activeIdx
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span className="text-slate-500 tabular-nums mr-2">
              {formatTime(cue.start)}
            </span>
            {cue.text}
          </button>
        ))}
      </div>
    </div>
  )
}

interface TocItem {
  label: string
  href: string
}

interface SearchResult {
  cfi: string
  excerpt: string
}

function EpubReader({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<import('epubjs').Rendition | null>(null)
  const bookRef = useRef<import('epubjs').Book | null>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [currentChapter, setCurrentChapter] = useState('')
  const [showToc, setShowToc] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const highlightCfiRef = useRef<string | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    async function init() {
      const ePub = (await import('epubjs')).default
      if (destroyed || !containerRef.current) return

      const book = ePub(src)
      bookRef.current = book
      const rendition = book.renderTo(containerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'auto',
        flow: 'paginated',
      })
      renditionRef.current = rendition

      book.loaded.navigation.then((nav) => {
        setToc(nav.toc.map((item) => ({ label: item.label, href: item.href })))
      })

      rendition.on('relocated', (location: { start: { href: string } }) => {
        setCurrentChapter(location.start.href)
      })

      rendition.display()
    }

    init()

    return () => {
      destroyed = true
      if (renditionRef.current) {
        renditionRef.current.destroy()
        renditionRef.current = null
      }
      bookRef.current = null
    }
  }, [src])

  const doSearch = useCallback(async (query: string) => {
    const book = bookRef.current
    if (!book || !query.trim()) {
      setSearchResults([])
      setSearchDone(false)
      return
    }
    setSearching(true)
    setSearchDone(false)
    try {
      await book.ready
      const results = await Promise.all(
        book.spine.spineItems.map((item: import('epubjs').Section) =>
          item
            .load(book.load.bind(book))
            .then(item.find.bind(item, query))
            .finally(item.unload.bind(item)),
        ),
      )
      setSearchResults(
        ([] as SearchResult[]).concat(...results).slice(0, 100),
      )
    } finally {
      setSearching(false)
      setSearchDone(true)
    }
  }, [])

  const goToCfi = (cfi: string) => {
    const rendition = renditionRef.current
    if (!rendition) return
    // Clear previous highlight
    if (highlightCfiRef.current) {
      rendition.annotations.remove(highlightCfiRef.current, 'highlight')
      highlightCfiRef.current = null
    }
    rendition.display(cfi).then(() => {
      rendition.annotations.highlight(cfi, {}, () => {}, '', {
        fill: 'rgba(255, 200, 0, 0.5)',
        'fill-opacity': '0.5',
        'mix-blend-mode': 'multiply',
      })
      highlightCfiRef.current = cfi
    })
    setShowSearch(false)
  }

  const prev = () => renditionRef.current?.prev()
  const next = () => renditionRef.current?.next()
  const goTo = (href: string) => {
    renditionRef.current?.display(href)
    setShowToc(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 flex items-center gap-2 relative">
        {toc.length > 0 && (
          <div className="relative">
            <button
              onClick={() => {
                setShowToc(!showToc)
                setShowSearch(false)
              }}
              className="px-3 py-1 bg-slate-800 rounded text-sm hover:bg-slate-700"
            >
              Chapters ({toc.length})
            </button>
            {showToc && (
              <div className="absolute top-full left-0 mt-1 w-80 max-h-64 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10">
                {toc.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => goTo(item.href)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-700 truncate ${
                      currentChapter.includes(item.href)
                        ? 'text-white bg-slate-700'
                        : 'text-slate-300'
                    }`}
                  >
                    {item.label.trim()}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => {
              setShowSearch(!showSearch)
              setShowToc(false)
            }}
            className="px-3 py-1 bg-slate-800 rounded text-sm hover:bg-slate-700"
          >
            Search
          </button>
          {showSearch && (
            <div className="absolute top-full left-0 mt-1 w-96 bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-10 p-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  doSearch(searchQuery)
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in book..."
                  className="flex-1 px-2 py-1 bg-slate-900 border border-slate-600 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-3 py-1 bg-slate-700 rounded text-sm hover:bg-slate-600 disabled:opacity-50"
                >
                  {searching ? '...' : 'Go'}
                </button>
              </form>
              {searchDone && searchResults.length === 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  No results found.
                </div>
              )}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-52 overflow-y-auto">
                  <div className="text-xs text-slate-500 mb-1">
                    {searchResults.length} result
                    {searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => goToCfi(r.cfi)}
                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-700 rounded text-slate-300 truncate"
                    >
                      {r.excerpt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 bg-white rounded-lg overflow-hidden"
      />
      <div className="flex justify-center gap-4 mt-3">
        <button
          onClick={prev}
          className="px-4 py-1 bg-slate-800 rounded text-sm hover:bg-slate-700"
        >
          &larr; Prev
        </button>
        <button
          onClick={next}
          className="px-4 py-1 bg-slate-800 rounded text-sm hover:bg-slate-700"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}
