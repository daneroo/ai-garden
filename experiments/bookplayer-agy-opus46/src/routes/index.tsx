import { Link, createFileRoute } from '@tanstack/react-router'
import { BookOpenText } from 'lucide-react'

import { fetchLibrary } from '../server/library'

export const Route = createFileRoute('/')({
  loader: () => fetchLibrary(),
  component: HomePage,
})

function HomePage() {
  const { books, scannedAt, scanDurationMs } = Route.useLoaderData()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <BookOpenText className="h-6 w-6 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight">BookPlayer</h1>
          <span className="ml-auto text-xs text-slate-500">
            {books.length} books · scanned in {scanDurationMs}ms
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {books.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg text-slate-400">No audiobooks found.</p>
            <p className="mt-2 text-sm text-slate-500">
              Check that AUDIOBOOKS_ROOT points to a directory with .m4b +
              cover.jpg book folders.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <Link
                key={book.id}
                to="/player/$bookId"
                params={{ bookId: book.id }}
                className="group rounded-lg border border-slate-700 bg-slate-800 p-4 transition-colors hover:border-cyan-500/50"
              >
                <h2 className="font-semibold text-white group-hover:text-cyan-400">
                  {book.title}
                </h2>
                {book.author && (
                  <p className="mt-1 text-sm text-slate-400">{book.author}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    M4B
                  </span>
                  {book.hasEpub && (
                    <span className="rounded bg-cyan-900/50 px-2 py-0.5 text-xs text-cyan-400">
                      EPUB
                    </span>
                  )}
                  {book.hasVtt && (
                    <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-xs text-emerald-400">
                      VTT
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 px-6 py-4 text-center text-xs text-slate-600">
        Last scan: {new Date(scannedAt).toLocaleString()}
      </footer>
    </div>
  )
}
