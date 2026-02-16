import { createFileRoute } from '@tanstack/react-router'
import { BookOpenText } from 'lucide-react'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-700 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <BookOpenText className="h-6 w-6 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight">BookPlayer</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-slate-400">
          Library directory will appear here once the scanner is wired up.
        </p>
      </main>
    </div>
  )
}
