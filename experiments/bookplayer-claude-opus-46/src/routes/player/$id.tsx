import { useRef, useState, useEffect, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { scanLibrary } from '../../lib/scanner'

const getBook = createServerFn({ method: 'GET' }).handler(async () => {
  const root = process.env.AUDIOBOOKS_ROOT ?? ''
  return scanLibrary(root)
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

  const skipBack = () => {
    const audio = audioRef.current
    if (audio) audio.currentTime = Math.max(0, audio.currentTime - 30)
  }

  const skipForward = () => {
    const audio = audioRef.current
    if (audio) audio.currentTime = Math.min(duration, audio.currentTime + 30)
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
          skipBack()
          break
        case 'ArrowRight':
          skipForward()
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="border-b border-slate-700 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-slate-400 hover:text-white">
          &larr; Library
        </Link>
        <h1 className="text-xl font-bold truncate">{book.title}</h1>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 py-8 gap-8">
        {/* Left: cover + audio controls */}
        <div className="flex flex-col items-center lg:w-80 shrink-0">
          {book.hasCover ? (
            <img
              src={`/audiobooks/${encodeURI(book.relPath)}/cover.jpg`}
              alt={book.title}
              className="w-48 h-48 object-cover rounded-lg shadow-lg"
            />
          ) : (
            <div className="w-48 h-48 bg-slate-700 rounded-lg flex items-center justify-center text-5xl">
              📖
            </div>
          )}
          <h2 className="text-lg font-semibold mt-4 text-center">
            {book.title}
          </h2>

          {audioSrc && (
            <div className="w-full mt-6">
              <audio ref={audioRef} src={audioSrc} preload="metadata" />

              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={seek}
                className="w-full accent-slate-400"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-center gap-6 mt-3">
                <button
                  onClick={skipBack}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  -30s
                </button>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-xl"
                >
                  {playing ? '⏸' : '▶'}
                </button>
                <button
                  onClick={skipForward}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  +30s
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: epub reader */}
        <div className="flex-1 min-h-[500px]">
          {epubSrc ? (
            <EpubReader src={epubSrc} />
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              No epub available for this book.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

interface TocItem {
  label: string
  href: string
}

function EpubReader({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<import('epubjs').Rendition | null>(null)
  const [toc, setToc] = useState<TocItem[]>([])
  const [currentChapter, setCurrentChapter] = useState('')
  const [showToc, setShowToc] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    async function init() {
      const ePub = (await import('epubjs')).default
      if (destroyed || !containerRef.current) return

      const book = ePub(src)
      const rendition = book.renderTo(containerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
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
    }
  }, [src])

  const prev = () => renditionRef.current?.prev()
  const next = () => renditionRef.current?.next()
  const goTo = (href: string) => {
    renditionRef.current?.display(href)
    setShowToc(false)
  }

  return (
    <div className="flex flex-col h-full">
      {toc.length > 0 && (
        <div className="mb-2 relative">
          <button
            onClick={() => setShowToc(!showToc)}
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
