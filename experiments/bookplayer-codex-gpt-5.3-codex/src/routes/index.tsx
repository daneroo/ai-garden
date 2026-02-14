import { useMemo, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { BookOpenText, CircleCheck, RefreshCw } from 'lucide-react'
import { refreshLibraryIndex } from '@/lib/library.server'
import { getPairsDirectoryData } from '@/lib/route-data.server'

const PAGE_SIZE = 12

const getLibraryIndex = createServerFn({ method: 'GET' }).handler(async () => {
  return getPairsDirectoryData()
})

const rescanLibrary = createServerFn({ method: 'POST' }).handler(async () => {
  return refreshLibraryIndex()
})

export const Route = createFileRoute('/')({
  loader: async () => getLibraryIndex(),
  pendingComponent: () => (
    <PageState
      title="Scanning library..."
      message="Building a runtime index from AUDIOBOOKS_ROOT and VTT_DIR."
    />
  ),
  errorComponent: ({ error }) => (
    <PageState
      title="Library scan failed"
      message={error?.message ?? 'Unable to scan the configured library roots.'}
    />
  ),
  component: LandingPage,
})

function PageState({ title, message }: { title: string; message: string }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-8 text-center shadow-[0_20px_60px_-30px_rgba(2,6,23,0.85)]">
        <h1 className="font-display text-3xl text-slate-100">{title}</h1>
        <p className="mt-3 text-slate-300">{message}</p>
      </section>
    </main>
  )
}

function LandingPage() {
  const { pairs, scannedAt, audioRoot, vttDir } = Route.useLoaderData()
  const [search, setSearch] = useState('')
  const [requireEpub, setRequireEpub] = useState(true)
  const [requireVtt, setRequireVtt] = useState(true)
  const [page, setPage] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return pairs.filter((pair) => {
      if (requireEpub && !pair.hasEpub) {
        return false
      }
      if (requireVtt && !pair.hasVtt) {
        return false
      }
      if (!query) {
        return true
      }
      return (
        pair.title.toLowerCase().includes(query) ||
        pair.id.toLowerCase().includes(query) ||
        (pair.author ?? '').toLowerCase().includes(query)
      )
    })
  }, [pairs, search, requireEpub, requireVtt])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const clampedPage = Math.min(page, pageCount - 1)
  const visiblePairs = filtered.slice(
    clampedPage * PAGE_SIZE,
    (clampedPage + 1) * PAGE_SIZE,
  )

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <header className="rounded-3xl border border-slate-700/80 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.16),transparent_52%),linear-gradient(150deg,rgba(15,23,42,0.94),rgba(30,41,59,0.82))] p-6 shadow-[0_22px_55px_-30px_rgba(15,23,42,0.95)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
              Local-first Library
            </p>
            <h1 className="mt-1 flex items-center gap-2 font-display text-3xl text-slate-100">
              <BookOpenText className="h-7 w-7 text-amber-300" />
              BookPlayer
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Scanned at {new Date(scannedAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true)
              await rescanLibrary()
              window.location.reload()
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-500/80 bg-slate-700/60 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-600/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            Rescan
          </button>
        </div>
        <div className="mt-4 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
          <p>
            AUDIOBOOKS_ROOT:
            <code className="ml-2 rounded bg-slate-900/80 px-2 py-1 text-slate-200">
              {audioRoot}
            </code>
          </p>
          <p>
            VTT_DIR:
            <code className="ml-2 rounded bg-slate-900/80 px-2 py-1 text-slate-200">
              {vttDir}
            </code>
          </p>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-900/70 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder="Search title, pair id, or author..."
            className="min-w-[240px] flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-amber-300"
          />
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={requireEpub}
              onChange={(event) => {
                setRequireEpub(event.target.checked)
                setPage(0)
              }}
              className="accent-amber-300"
            />
            EPUB
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-slate-800 px-3 py-1 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={requireVtt}
              onChange={(event) => {
                setRequireVtt(event.target.checked)
                setPage(0)
              }}
              className="accent-amber-300"
            />
            VTT
          </label>
        </div>
      </section>

      {filtered.length === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-slate-600 bg-slate-900/50 p-10 text-center">
          <h2 className="font-display text-2xl text-slate-200">
            No matches found
          </h2>
          <p className="mt-3 text-slate-400">
            Ensure each book folder has at least one <code>.m4b</code> and one{' '}
            <code>.epub</code>, then click Rescan.
          </p>
        </section>
      ) : (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-900/70">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700 text-sm">
              <thead className="bg-slate-800/70 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Last progress</th>
                  <th className="px-4 py-3 font-medium">Assets</th>
                  <th className="px-4 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {visiblePairs.map((pair) => (
                  <tr
                    key={pair.id}
                    className="bg-slate-900/35 transition-colors hover:bg-slate-800/45"
                  >
                    <td className="px-4 py-3 font-medium">{pair.title}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {pair.author ?? 'Unknown'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-300">
                      {pair.totalAudioDuration ?? 'Pending metadata'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-400">
                      {pair.lastProgress ?? 'No progress yet'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <AssetBadge label="M4B" tone="solid" />
                        <AssetBadge label="EPUB" tone="solid" />
                        {pair.hasVtt ? (
                          <AssetBadge label="VTT" tone="solid" />
                        ) : (
                          <AssetBadge label="VTT" tone="muted" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/player/$pairId"
                        params={{ pairId: pair.id }}
                        className="inline-flex items-center gap-2 rounded-lg border border-amber-300/50 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-300/20"
                      >
                        <CircleCheck className="h-4 w-4" />
                        Open Player
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t border-slate-700/80 px-4 py-3 text-sm text-slate-300">
            <p>{filtered.length} matched pairs</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(0, value - 1))}
                disabled={clampedPage === 0}
                className="rounded-lg border border-slate-600 px-3 py-1.5 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <span className="tabular-nums">
                Page {clampedPage + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((value) => Math.min(pageCount - 1, value + 1))
                }
                disabled={clampedPage >= pageCount - 1}
                className="rounded-lg border border-slate-600 px-3 py-1.5 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </footer>
        </section>
      )}
    </div>
  )
}

function AssetBadge({
  label,
  tone,
}: {
  label: 'M4B' | 'EPUB' | 'VTT'
  tone: 'solid' | 'muted'
}) {
  if (tone === 'muted') {
    return (
      <span className="rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-500">
        {label}
      </span>
    )
  }

  return (
    <span className="rounded-full border border-slate-500 bg-slate-800 px-2 py-0.5 text-xs text-slate-200">
      {label}
    </span>
  )
}
