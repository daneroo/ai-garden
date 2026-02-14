import { Link } from '@tanstack/react-router'

export default function Header() {
  return (
    <header className="flex items-center border-b border-slate-800 bg-slate-900 px-4 py-3 text-slate-100">
      <Link
        to="/"
        className="rounded border border-slate-700 bg-slate-800 px-3 py-1 text-sm transition-colors hover:bg-slate-700"
      >
        Library
      </Link>
      <h1 className="ml-3 truncate text-sm font-medium">BookPlayer</h1>
    </header>
  )
}
