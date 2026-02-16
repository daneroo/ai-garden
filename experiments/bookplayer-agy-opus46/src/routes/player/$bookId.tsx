import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeft, BookOpenText } from 'lucide-react'

export const Route = createFileRoute('/player/$bookId')({
  component: PlayerPage,
})

function PlayerPage() {
  const { bookId } = Route.useParams()

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-700 px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <BookOpenText className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-medium">BookPlayer</span>
          <span className="text-xs text-slate-500">({bookId})</span>
        </div>
      </header>

      {/* Reader area */}
      <div className="flex-1 overflow-hidden bg-slate-800 p-4">
        <p className="text-slate-400">EPUB reader will render here.</p>
      </div>

      {/* Transcript strip */}
      <div className="h-24 shrink-0 overflow-y-auto border-t border-slate-700 bg-slate-850 p-2">
        <p className="text-xs text-slate-500">Transcript strip placeholder.</p>
      </div>

      {/* Player controls */}
      <div className="shrink-0 border-t border-slate-700 bg-slate-800 px-4 py-3">
        <p className="text-sm text-slate-400">Audio player controls here.</p>
      </div>
    </div>
  )
}
