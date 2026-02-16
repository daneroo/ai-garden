import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpenText, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { fetchLibrary } from '../server/library'

const BOOKS_PER_PAGE = 24

export const Route = createFileRoute('/')({
  loader: () => fetchLibrary(),
  component: HomePage,
})

interface BookSummary {
  id: string
  basename: string
  title: string
  author: string | null
  duration: number | null
  fileSize: number
  hasEpub: boolean
  hasVtt: boolean
}

function HomePage() {
  const { books, scannedAt, scanDurationMs } = Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [filterEpub, setFilterEpub] = useState(false)
  const [filterVtt, setFilterVtt] = useState(false)
  const [page, setPage] = useState(0)

  // Filter + search
  const filtered = useMemo(() => {
    let result: Array<BookSummary> = books
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q),
      )
    }
    if (filterEpub) result = result.filter((b) => b.hasEpub)
    if (filterVtt) result = result.filter((b) => b.hasVtt)
    return result
  }, [books, search, filterEpub, filterVtt])

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filtered.length / BOOKS_PER_PAGE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = filtered.slice(
    safePage * BOOKS_PER_PAGE,
    (safePage + 1) * BOOKS_PER_PAGE,
  )

  // Counts for badges
  const epubCount = books.filter((b) => b.hasEpub).length
  const vttCount = books.filter((b) => b.hasVtt).length

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <BookOpenText className="h-6 w-6 text-cyan-400 shrink-0" />
          <h1 className="text-xl font-bold tracking-tight">BookPlayer</h1>
          <span className="ml-auto text-xs text-slate-500 tabular-nums">
            {filtered.length}/{books.length} books · {scanDurationMs}ms
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        {/* Search + Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="search-input"
              type="text"
              placeholder="Search by title or author…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-cyan-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setPage(0)
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter toggles */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFilterEpub(!filterEpub)
                setPage(0)
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filterEpub
                  ? 'bg-cyan-600 text-white'
                  : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              EPUB ({epubCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterVtt(!filterVtt)
                setPage(0)
              }}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                filterVtt
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-700 bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              VTT ({vttCount})
            </button>
          </div>
        </div>

        {/* Book Grid */}
        {paged.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-slate-400">
              {books.length === 0
                ? 'No audiobooks found.'
                : 'No books match your filters.'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {books.length === 0
                ? 'Check that AUDIOBOOKS_ROOT points to a directory with .m4b + cover.jpg book folders.'
                : 'Try adjusting your search or clearing filters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {paged.map((book) => (
              <Link
                key={book.id}
                to="/player/$bookId"
                params={{ bookId: book.id }}
                className="group overflow-hidden rounded-lg border border-slate-700 bg-slate-800 transition-colors hover:border-cyan-500/50"
              >
                {/* Cover image */}
                <div className="aspect-square overflow-hidden bg-slate-700">
                  <img
                    src={`/api/cover/${book.id}`}
                    alt={book.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <h2 className="line-clamp-2 text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {book.title}
                  </h2>
                  {book.author && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
                      {book.author}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                      M4B
                    </span>
                    {book.hasEpub && (
                      <span className="rounded bg-cyan-900/50 px-1.5 py-0.5 text-[10px] text-cyan-400">
                        EPUB
                      </span>
                    )}
                    {book.hasVtt && (
                      <span className="rounded bg-emerald-900/50 px-1.5 py-0.5 text-[10px] text-emerald-400">
                        VTT
                      </span>
                    )}
                    {book.fileSize > 0 && (
                      <span className="ml-auto text-[10px] text-slate-500 tabular-nums">
                        {formatSize(book.fileSize)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:text-white disabled:opacity-40"
            >
              Prev
            </button>
            <span className="text-sm text-slate-500 tabular-nums">
              {safePage + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:text-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-600">
        Last scan: {new Date(scannedAt).toLocaleString()}
      </footer>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}
