import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'

interface TocItem {
  label: string
  href: string
}

interface SearchResult {
  cfi: string
  excerpt: string
}

interface EpubReaderProps {
  bookId: string
  epubUrl: string
}

/** CFI persistence helpers keyed by bookId */
function saveCfi(bookId: string, cfi: string) {
  try {
    localStorage.setItem(`bookplayer-cfi-${bookId}`, cfi)
  } catch {
    /* quota exceeded — ignore */
  }
}
function loadCfi(bookId: string): string | null {
  try {
    return localStorage.getItem(`bookplayer-cfi-${bookId}`)
  } catch {
    return null
  }
}

export default function EpubReader({ bookId, epubUrl }: EpubReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  // epubjs types are incomplete — use Record for the weakly-typed API surface
  const bookRef = useRef<Record<string, any>>(null)
  const renditionRef = useRef<Record<string, any>>(null)

  const [toc, setToc] = useState<Array<TocItem>>([])
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Search state
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<SearchResult>>([])
  const [searching, setSearching] = useState(false)
  const activeHighlightRef = useRef<string | null>(null)

  // Initialize epubjs
  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    const init = async () => {
      try {
        const { default: ePub } = await import('epubjs')
        if (destroyed) return

        const book = ePub(epubUrl, { openAs: 'epub' })
        bookRef.current = book

        const rendition = book.renderTo(containerRef.current!, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          snap: true,
          spread: 'auto',
        })
        renditionRef.current = rendition

        // Apply dark-mode theme to rendered content
        rendition.themes.default({
          body: {
            color: '#e2e8f0 !important',
            background: 'transparent !important',
          },
          'a, a:link, a:visited': { color: '#22d3ee !important' },
          'h1,h2,h3,h4,h5,h6': { color: '#f1f5f9 !important' },
        })

        // Display at saved CFI or start
        const savedCfi = loadCfi(bookId)
        await rendition.display(savedCfi || undefined)

        // Persist location on relocate
        rendition.on('relocated', (location: { start: { cfi: string } }) => {
          saveCfi(bookId, location.start.cfi)
        })

        // Load TOC
        const nav = await book.loaded.navigation
        const tocEntries = (
          nav as { toc?: Array<{ label: string; href: string }> }
        ).toc
        if (tocEntries) {
          setToc(
            tocEntries.map((c) => ({
              label: c.label.trim(),
              href: c.href,
            })),
          )
        }

        setReady(true)
      } catch (err) {
        if (!destroyed) {
          setError(err instanceof Error ? err.message : 'Failed to load EPUB')
        }
      }
    }

    void init()

    return () => {
      destroyed = true
      if (bookRef.current) {
        try {
          bookRef.current.destroy()
        } catch {
          /* ignore */
        }
        bookRef.current = null
        renditionRef.current = null
      }
    }
  }, [bookId, epubUrl])

  // Resize handler — update rendition when container changes size
  useEffect(() => {
    if (!containerRef.current || !renditionRef.current) return

    const ro = new ResizeObserver(() => {
      renditionRef.current?.resize?.()
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [ready])

  const goNext = useCallback(() => renditionRef.current?.next(), [])
  const goPrev = useCallback(() => renditionRef.current?.prev(), [])
  const goToHref = useCallback((href: string) => {
    renditionRef.current?.display(href)
  }, [])

  // Search handler
  const doSearch = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      const query = searchQuery.trim()
      if (!query || !bookRef.current) return

      setSearching(true)
      setSearchResults([])

      try {
        const book = bookRef.current
        const results: Array<SearchResult> = []
        const MAX_RESULTS = 100

        // Iterate spine sections
        const spine = book.spine
        for (let i = 0; i < spine.length && results.length < MAX_RESULTS; i++) {
          const section = spine.get(i)
          if (!section) continue
          try {
            await section.load(book.load.bind(book))
            const found = section.find(query)
            if (Array.isArray(found)) {
              for (const f of found) {
                if (results.length >= MAX_RESULTS) break
                results.push({ cfi: f.cfi, excerpt: f.excerpt || query })
              }
            }
            section.unload()
          } catch {
            /* skip malformed sections */
          }
        }

        setSearchResults(results)
      } catch {
        /* search error — show empty */
      } finally {
        setSearching(false)
      }
    },
    [searchQuery],
  )

  const goToSearchResult = useCallback((cfi: string) => {
    const rendition = renditionRef.current
    if (!rendition) return

    // Remove previous highlight
    if (activeHighlightRef.current) {
      try {
        rendition.annotations.remove(activeHighlightRef.current, 'highlight')
      } catch {
        /* ignore */
      }
    }

    // Normalize range CFI to start-point if needed
    let displayCfi = cfi
    if (cfi.includes(',')) {
      // Range CFI: epubcfi(/6/4!/4/1:0,/6/4!/4/1:5) → take the base + start
      const base = cfi.split(',')[0]
      if (base) displayCfi = base + ')'
    }

    rendition.display(displayCfi)

    // Highlight
    try {
      rendition.annotations.highlight(cfi, {}, () => {}, 'hl', {
        fill: 'rgba(34,211,238,0.3)',
      })
      activeHighlightRef.current = cfi
    } catch {
      /* ignore annotation errors */
    }
  }, [])

  // Memoize TOC select options
  const tocOptions = useMemo(
    () =>
      toc.map((item, i) => (
        <option key={i} value={item.href}>
          {item.label}
        </option>
      )),
    [toc],
  )

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Unable to load EPUB</p>
          <p className="text-xs text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* EPUB toolbar: TOC + nav + search */}
      <div className="flex items-center gap-2 border-b border-slate-700 bg-slate-800/80 px-3 py-1.5 shrink-0">
        {/* TOC dropdown */}
        {toc.length > 0 && (
          <select
            className="max-w-[200px] truncate rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 outline-none"
            onChange={(e) => goToHref(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Chapters…
            </option>
            {tocOptions}
          </select>
        )}

        {/* Prev / Next */}
        <button
          type="button"
          onClick={goPrev}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goNext}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="flex-1" />

        {/* Search toggle */}
        <button
          type="button"
          onClick={() => setSearchOpen((o) => !o)}
          className={`p-1 transition-colors ${searchOpen ? 'text-cyan-400' : 'text-slate-400 hover:text-white'}`}
          title="Search EPUB"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Search panel */}
      {searchOpen && (
        <div className="shrink-0 border-b border-slate-700 bg-slate-900/80 p-2 max-h-48 overflow-y-auto">
          <form onSubmit={doSearch} className="flex gap-2 mb-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search book text…"
              className="flex-1 rounded bg-slate-700 px-2 py-1 text-xs text-slate-200 outline-none placeholder:text-slate-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded bg-cyan-700 px-2 py-1 text-xs text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              {searching ? '…' : 'Go'}
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false)
                setSearchResults([])
                setSearchQuery('')
              }}
              className="text-slate-500 hover:text-white p-1"
            >
              <X className="h-3 w-3" />
            </button>
          </form>
          {searchResults.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[10px] text-slate-500 mb-1">
                {searchResults.length}
                {searchResults.length >= 100 ? '+' : ''} results
              </p>
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToSearchResult(r.cfi)}
                  className="block w-full text-left rounded px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-700 truncate"
                >
                  {r.excerpt}
                </button>
              ))}
            </div>
          )}
          {!searching && searchQuery && searchResults.length === 0 && (
            <p className="text-xs text-slate-500 px-2">No results found</p>
          )}
        </div>
      )}

      {/* EPUB render container — bounded, clipped */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        style={{ contain: 'strict' }}
      />

      {/* Loading overlay */}
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
          <p className="text-sm text-slate-400 animate-pulse">Loading EPUB…</p>
        </div>
      )}
    </div>
  )
}
