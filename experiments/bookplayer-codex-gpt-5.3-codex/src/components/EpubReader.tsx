import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface TocEntry {
  href?: string
  label?: string
  subitems?: TocEntry[]
}

interface FlatTocEntry {
  href: string
  label: string
}

interface EpubReaderProps {
  epubUrl: string
  initialCfi: string | null
  onLocationChange: (cfi: string) => void
}

interface EpubNavigation {
  toc?: TocEntry[]
}

interface EpubLocation {
  start?: {
    cfi?: string
  }
}

interface EpubSearchMatch {
  cfi?: string
  excerpt?: string
}

interface EpubSection {
  load?: (
    loader: (...args: unknown[]) => Promise<unknown>,
  ) => Promise<void> | void
  unload?: () => void
  find?: (query: string) => EpubSearchMatch[] | Promise<EpubSearchMatch[]>
}

interface EpubRendition {
  prev: () => void
  next: () => void
  destroy: () => void
  display: (target?: string) => Promise<void>
  on: (event: 'relocated', listener: (location: EpubLocation) => void) => void
  resize?: (width?: number | string, height?: number | string) => void
  flow?: (flow: 'paginated' | 'scrolled') => void
  spread?: (spread: 'none' | 'always' | 'auto', min?: number) => boolean
  annotations?: {
    highlight?: (
      cfi: string,
      data?: Record<string, unknown>,
      callback?: (() => void) | undefined,
      className?: string,
      styles?: Record<string, string>,
    ) => void
    remove?: (cfi: string, type?: string) => void
  }
}

interface EpubBook {
  destroy?: () => void
  load?: (...args: unknown[]) => Promise<unknown>
  renderTo: (
    element: HTMLElement,
    options: {
      width: string
      height: string
      flow?: 'paginated' | 'scrolled'
      spread?: 'none' | 'always' | 'auto'
      manager?: 'default' | 'continuous'
    },
  ) => EpubRendition
  loaded: {
    navigation: Promise<EpubNavigation>
  }
  spine?: {
    spineItems?: EpubSection[]
  }
}

interface EpubTextSearchResult {
  cfi: string
  excerpt: string
}

type EpubFactory = (input: string | ArrayBuffer) => EpubBook

interface EpubCfiInstance {
  range?: boolean
  start?: {
    steps?: unknown[]
    terminal?: unknown
  }
  end?: unknown
  path?: {
    steps?: unknown[]
    terminal?: unknown
  }
  toString: () => string
}

type EpubCfiConstructor = new (input?: string) => EpubCfiInstance

function getEpubFactory(mod: unknown): EpubFactory {
  if (typeof mod === 'function') {
    return mod as EpubFactory
  }

  if (
    typeof mod === 'object' &&
    mod !== null &&
    'default' in mod &&
    typeof (mod as { default: unknown }).default === 'function'
  ) {
    return (mod as { default: EpubFactory }).default
  }

  throw new Error('Invalid epubjs module export.')
}

function flattenToc(
  items: TocEntry[],
  output: FlatTocEntry[] = [],
): FlatTocEntry[] {
  for (const item of items) {
    if (item.href && item.label) {
      output.push({ href: item.href, label: item.label })
    }
    if (item.subitems?.length) {
      flattenToc(item.subitems, output)
    }
  }
  return output
}

function normalizeExcerpt(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

async function searchSection(
  section: EpubSection,
  query: string,
  loader: ((...args: unknown[]) => Promise<unknown>) | null,
): Promise<EpubTextSearchResult[]> {
  try {
    if (loader && section.load) {
      await section.load(loader)
    }

    if (!section.find) {
      return []
    }

    const matches = await Promise.resolve(section.find(query))
    return matches.flatMap((match) => {
      if (typeof match.cfi !== 'string' || match.cfi.length === 0) {
        return []
      }

      return [
        {
          cfi: match.cfi,
          excerpt: normalizeExcerpt(match.excerpt ?? query),
        },
      ]
    })
  } catch {
    return []
  } finally {
    section.unload?.()
  }
}

export function EpubReader({
  epubUrl,
  initialCfi,
  onLocationChange,
}: EpubReaderProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<EpubRendition | null>(null)
  const bookRef = useRef<EpubBook | null>(null)
  const cfiConstructorRef = useRef<EpubCfiConstructor | null>(null)
  const initialCfiRef = useRef<string | null>(initialCfi)
  const highlightedCfiRef = useRef<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [toc, setToc] = useState<FlatTocEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<EpubTextSearchResult[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [activeResultCfi, setActiveResultCfi] = useState<string | null>(null)
  const [showSearchPanel, setShowSearchPanel] = useState(false)

  const tocOptions = useMemo(() => toc, [toc])
  const MAX_SEARCH_RESULTS = 60

  const normalizeNavigationCfi = useCallback((rawCfi: string): string => {
    const Constructor = cfiConstructorRef.current
    if (!Constructor) {
      return rawCfi
    }

    try {
      const parsed = new Constructor(rawCfi)
      if (!parsed.range || !parsed.start) {
        return rawCfi
      }

      parsed.path = {
        steps: [...(parsed.path?.steps ?? []), ...(parsed.start.steps ?? [])],
        terminal: parsed.start.terminal ?? parsed.path?.terminal,
      }
      parsed.start = undefined
      parsed.end = undefined
      parsed.range = false
      return parsed.toString()
    } catch {
      return rawCfi
    }
  }, [])

  const displayAtCfi = useCallback(
    async (cfi: string) => {
      const rendition = renditionRef.current
      if (!rendition) {
        return
      }

      const targetCfi = normalizeNavigationCfi(cfi)
      const attempts = [targetCfi]

      try {
        let navigated = false
        for (const attempt of attempts) {
          try {
            await rendition.display(attempt)
            navigated = true
            break
          } catch {
            // Try the next candidate.
          }
        }

        if (!navigated) {
          throw new Error('No display target succeeded.')
        }

        // epub.js occasionally lands on the section but not the exact in-section
        // target on the first pass; replaying the resolved CFI snaps to the term.
        try {
          await rendition.display(targetCfi)
        } catch {
          // Keep the first successful navigation.
        }

        if (highlightedCfiRef.current) {
          rendition.annotations?.remove?.(
            highlightedCfiRef.current,
            'highlight',
          )
        }

        let highlighted = false
        for (const attempt of [cfi, targetCfi]) {
          try {
            rendition.annotations?.highlight?.(
              attempt,
              {},
              undefined,
              'epub-search-highlight',
              {
                fill: 'rgba(250, 204, 21, 0.72)',
                'fill-opacity': '0.72',
                stroke: 'rgba(180, 83, 9, 0.95)',
                'stroke-width': '1.25',
                'mix-blend-mode': 'normal',
              },
            )
            highlightedCfiRef.current = attempt
            highlighted = true
            break
          } catch {
            // Keep trying with fallback cfi.
          }
        }

        if (!highlighted) {
          highlightedCfiRef.current = null
        }

        setActiveResultCfi(cfi)
        setSearchError(null)
      } catch (error) {
        setSearchError(
          error instanceof Error
            ? `Unable to navigate to match: ${error.message}`
            : 'Unable to navigate to match.',
        )
      }
    },
    [normalizeNavigationCfi],
  )

  const runTextSearch = useCallback(async () => {
    const query = searchQuery.trim()
    if (query.length < 2) {
      setSearchError('Enter at least 2 characters.')
      setSearchResults([])
      setShowSearchPanel(false)
      return
    }

    const book = bookRef.current
    if (!book) {
      setSearchError('EPUB is not ready yet.')
      setSearchResults([])
      setShowSearchPanel(false)
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setActiveResultCfi(null)

    try {
      const sections = book.spine?.spineItems ?? []
      const loader =
        typeof book.load === 'function'
          ? (book.load.bind(book) as (...args: unknown[]) => Promise<unknown>)
          : null

      const sectionResults = await Promise.all(
        sections.map((section) => searchSection(section, query, loader)),
      )

      const deduped: EpubTextSearchResult[] = []
      const seen = new Set<string>()
      for (const result of sectionResults.flat()) {
        if (
          !result ||
          typeof result.cfi !== 'string' ||
          result.cfi.length === 0
        ) {
          continue
        }
        if (seen.has(result.cfi)) {
          continue
        }
        seen.add(result.cfi)
        deduped.push(result)
        if (deduped.length >= MAX_SEARCH_RESULTS) {
          break
        }
      }

      setSearchResults(deduped)
      if (deduped.length === 0) {
        setSearchError('No matches in EPUB content.')
        setShowSearchPanel(false)
      } else {
        setShowSearchPanel(true)
        await displayAtCfi(deduped[0].cfi)
      }
    } catch (error) {
      setSearchResults([])
      setShowSearchPanel(false)
      setSearchError(
        error instanceof Error
          ? `Search failed: ${error.message}`
          : 'Search failed.',
      )
    } finally {
      setIsSearching(false)
    }
  }, [MAX_SEARCH_RESULTS, displayAtCfi, searchQuery])

  useEffect(() => {
    initialCfiRef.current = initialCfi
  }, [epubUrl, initialCfi])

  useEffect(() => {
    let isDisposed = false

    const load = async () => {
      try {
        setIsLoading(true)
        setLoadError(null)
        setToc([])
        setSearchResults([])
        setSearchError(null)
        setActiveResultCfi(null)
        setShowSearchPanel(false)

        const mod: unknown = await import('epubjs')
        const createBook = getEpubFactory(mod)
        if (
          typeof mod === 'object' &&
          mod !== null &&
          'EpubCFI' in mod &&
          typeof (mod as { EpubCFI?: unknown }).EpubCFI === 'function'
        ) {
          cfiConstructorRef.current = (
            mod as { EpubCFI: EpubCfiConstructor }
          ).EpubCFI
        } else {
          cfiConstructorRef.current = null
        }

        const epubResponse = await fetch(epubUrl)
        if (!epubResponse.ok) {
          throw new Error(`EPUB request failed with ${epubResponse.status}`)
        }
        const archive = await epubResponse.arrayBuffer()

        const book = createBook(archive)
        bookRef.current = book

        if (!mountRef.current) {
          return
        }

        const rendition = book.renderTo(mountRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          manager: 'default',
        })
        renditionRef.current = rendition
        rendition.flow?.('paginated')
        rendition.spread?.('none')

        rendition.on('relocated', (location) => {
          const cfi = location?.start?.cfi
          if (typeof cfi === 'string' && cfi.length > 0) {
            onLocationChange(cfi)
          }
        })

        const navigation = await book.loaded.navigation
        const tocEntries = navigation?.toc ?? []
        if (!isDisposed) {
          setToc(flattenToc(tocEntries))
        }

        if (initialCfiRef.current) {
          void rendition
            .display(initialCfiRef.current)
            .catch(() => rendition.display(undefined))
        } else {
          void rendition.display(undefined)
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load EPUB.'
        if (!isDisposed) {
          setLoadError(message)
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isDisposed = true
      if (renditionRef.current) {
        if (highlightedCfiRef.current) {
          renditionRef.current.annotations?.remove?.(
            highlightedCfiRef.current,
            'highlight',
          )
        }
        renditionRef.current.destroy()
        renditionRef.current = null
      }
      if (bookRef.current) {
        bookRef.current.destroy?.()
        bookRef.current = null
      }
    }
  }, [epubUrl, onLocationChange])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-slate-800 bg-slate-950/95 px-2 py-1 text-[11px]">
        <button
          type="button"
          onClick={() => renditionRef.current?.prev()}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-200 transition-colors hover:bg-slate-800"
        >
          Prev
        </button>
        <button
          type="button"
          onClick={() => renditionRef.current?.next()}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-slate-200 transition-colors hover:bg-slate-800"
        >
          Next
        </button>

        {tocOptions.length > 0 ? (
          <select
            onChange={(event) =>
              renditionRef.current?.display(event.currentTarget.value)
            }
            className="w-40 min-w-0 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200"
            defaultValue=""
          >
            <option value="" disabled>
              Chapter
            </option>
            {tocOptions.map((entry) => (
              <option key={`${entry.href}:${entry.label}`} value={entry.href}>
                {entry.label}
              </option>
            ))}
          </select>
        ) : null}

        <form
          className="ml-auto flex min-w-0 flex-1 items-center gap-1 sm:max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault()
            void runTextSearch()
          }}
        >
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.currentTarget.value)
              setSearchError(null)
            }}
            placeholder="Search EPUB text (e.g. Dizzy)"
            className="min-w-0 flex-1 rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-100 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-100 transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            {isSearching ? 'Searching' : 'Search'}
          </button>
          {searchResults.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowSearchPanel((value) => !value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200 transition-colors hover:bg-slate-800"
            >
              {showSearchPanel ? 'Hide' : 'Matches'} {searchResults.length}
            </button>
          ) : null}
        </form>
      </div>

      <div className="reader-viewport relative min-h-0 flex-1 overflow-hidden bg-white">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-sm text-slate-600">
            Loading EPUB...
          </div>
        ) : null}

        {loadError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 px-4 text-center text-sm text-rose-600">
            EPUB unavailable: {loadError}
          </div>
        ) : null}

        {searchError ? (
          <p className="absolute left-2 top-2 z-20 rounded border border-rose-300/40 bg-rose-950/90 px-2 py-1 text-[11px] text-rose-100">
            {searchError}
          </p>
        ) : null}

        {searchResults.length > 0 && showSearchPanel ? (
          <aside className="absolute inset-x-2 top-2 z-20 rounded border border-slate-700 bg-slate-950/95 p-2 shadow-xl sm:inset-x-auto sm:right-2 sm:w-96">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-300">
              <p>{searchResults.length} matches</p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSearchResults([])
                    setActiveResultCfi(null)
                    setShowSearchPanel(false)
                  }}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-200 hover:bg-slate-800"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setShowSearchPanel(false)}
                  className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[11px] text-slate-200 hover:bg-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="max-h-[34dvh] space-y-1 overflow-y-auto pr-0.5">
              {searchResults.map((result) => (
                <button
                  key={result.cfi}
                  type="button"
                  onClick={() => {
                    void displayAtCfi(result.cfi)
                  }}
                  className={`block w-full truncate rounded border px-2 py-1 text-left text-[11px] ${
                    activeResultCfi === result.cfi
                      ? 'border-amber-300 bg-amber-300/20 text-amber-100'
                      : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-amber-300/50'
                  }`}
                  title={result.excerpt}
                >
                  {result.excerpt}
                </button>
              ))}
            </div>
          </aside>
        ) : null}

        <div className="reader-clip absolute inset-0">
          <div ref={mountRef} className="epub-reader-frame absolute inset-0" />
        </div>
      </div>
    </div>
  )
}
