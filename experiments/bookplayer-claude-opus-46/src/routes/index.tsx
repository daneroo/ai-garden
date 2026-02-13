import { useState, useMemo } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { scanLibrary, type Book } from '../lib/scanner'

const getLibrary = createServerFn({ method: 'GET' }).handler(async () => {
  const root = process.env.AUDIOBOOKS_ROOT ?? ''
  const vttDir = process.env.VTT_DIR || undefined
  return scanLibrary(root, vttDir)
})

export const Route = createFileRoute('/')({
  loader: () => getLibrary(),
  component: HomePage,
})

const PAGE_SIZE = 24

function HomePage() {
  const { books, root } = Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [hasEpub, setHasEpub] = useState(true)
  const [hasVtt, setHasVtt] = useState(true)

  const filtered = useMemo(() => {
    let result = books
    if (hasEpub) result = result.filter((b) => b.textFile)
    if (hasVtt) result = result.filter((b) => b.vttFile)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((b) => b.title.toLowerCase().includes(q))
    }
    return result
  }, [books, search, hasEpub, hasVtt])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageBooks = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BookPlayer</h1>
        <span className="text-sm text-slate-500">{filtered.length} books</span>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {books.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-4">No audiobooks found.</p>
            <p className="text-slate-500 text-sm">
              {root ? (
                <>
                  Scanned <code className="text-slate-300">{root}</code> but
                  found no audio files.
                </>
              ) : (
                <>
                  Set{' '}
                  <code className="text-slate-300 bg-slate-800 px-2 py-1 rounded">
                    AUDIOBOOKS_ROOT
                  </code>{' '}
                  in your .env file.
                </>
              )}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <input
                type="text"
                placeholder="Search books..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                className="w-full max-w-md px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-slate-400"
              />
              <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasEpub}
                  onChange={(e) => {
                    setHasEpub(e.target.checked)
                    setPage(0)
                  }}
                  className="accent-slate-400"
                />
                EPUB
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasVtt}
                  onChange={(e) => {
                    setHasVtt(e.target.checked)
                    setPage(0)
                  }}
                  className="accent-slate-400"
                />
                VTT
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {pageBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 bg-slate-800 rounded disabled:opacity-30"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-400">
                  {page + 1} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 bg-slate-800 rounded disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function BookCard({ book }: { book: Book }) {
  return (
    <Link
      to="/player/$id"
      params={{ id: book.id }}
      className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors block"
    >
      {book.hasCover ? (
        <img
          src={`/audiobooks/${encodeURI(book.relPath)}/cover.jpg`}
          alt={book.title}
          loading="lazy"
          className="w-full aspect-square object-cover"
        />
      ) : (
        <div className="w-full aspect-square bg-slate-700 flex items-center justify-center text-4xl">
          📖
        </div>
      )}
      <div className="p-3">
        <p className="text-sm font-medium truncate" title={book.title}>
          {book.title}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {[
            book.audioFile?.split('.').pop()?.toUpperCase(),
            book.textFile ? 'EPUB' : null,
            book.vttFile ? 'VTT' : null,
          ]
            .filter(Boolean)
            .join(' + ')}
        </p>
      </div>
    </Link>
  )
}
