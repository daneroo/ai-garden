import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import {
  BookOpenText,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { getBooksFn, scanLibraryFn } from "../server/functions";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async () => {
    return await getBooksFn();
  },
});

type SortField = "title" | "author" | "duration" | "date";

function Index() {
  const initialBooks = Route.useLoaderData();
  const router = useRouter();
  const [isScanning, setIsScanning] = useState(false);

  // Local state for filtering/sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortAsc, setSortAsc] = useState(true);

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await scanLibraryFn();
      router.invalidate();
    } finally {
      setIsScanning(false);
    }
  };

  const filteredBooks = useMemo(() => {
    let result = [...initialBooks];

    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.author && b.author.toLowerCase().includes(q)),
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: string | number;
      let valB: string | number;

      switch (sortField) {
        case "title":
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
          break;
        case "author":
          valA = (a.author || "").toLowerCase();
          valB = (b.author || "").toLowerCase();
          break;
        case "duration":
          valA = a.duration;
          valB = b.duration;
          break;
        default:
          valA = a.title;
          valB = b.title;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [initialBooks, searchQuery, sortField, sortAsc]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpenText className="w-8 h-8 md:w-10 md:h-10 text-slate-100" />
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
              BookPlayer
            </h1>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <RefreshCw
              className={`w-4 h-4 ${isScanning ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`}
            />
            {isScanning ? "Scanning..." : "Scan Library"}
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="duration">Duration</option>
            </select>

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="p-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-colors"
              aria-label="Toggle sort order"
            >
              {sortAsc ? (
                <SortAsc className="w-5 h-5" />
              ) : (
                <SortDesc className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Empty State */}
        {initialBooks.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-12 text-center max-w-2xl mx-auto mt-12">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpenText className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">
              Library is empty
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              Configure your{" "}
              <code className="bg-slate-900 px-1.5 py-0.5 rounded text-xs font-mono">
                AUDIOBOOKS_ROOT
              </code>{" "}
              environment variable and click Scan to index your books.
            </p>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 transition-all"
            >
              {isScanning ? "Scanning..." : "Scan Now"}
            </button>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No books match your search.
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Link
                to="/player/$bookId"
                params={{ bookId: book.id }}
                key={book.id}
                className="group bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-900/20 transition-all duration-300 block"
              >
                <div className="flex sm:flex-col h-full">
                  {/* Cover */}
                  <div className="w-24 sm:w-full sm:h-48 md:h-56 bg-slate-900 flex-shrink-0 relative overflow-hidden">
                    {book.coverPath ? (
                      <img
                        src={`/api/media/cover/${book.id}`}
                        alt={`Cover for ${book.title}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-800">
                        <BookOpenText className="w-8 h-8 opacity-20" />
                      </div>
                    )}

                    {/* Badges Overlay */}
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white rounded border border-white/10 uppercase tracking-wider">
                        M4B
                      </span>
                      {book.epubFile && (
                        <span className="px-1.5 py-0.5 bg-cyan-900/80 backdrop-blur-sm text-[10px] font-bold text-cyan-200 rounded border border-cyan-500/30 uppercase tracking-wider">
                          EPUB
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 flex flex-col min-w-0">
                    <h3
                      className="font-semibold text-slate-100 truncate mb-1"
                      title={book.title}
                    >
                      {book.title}
                    </h3>
                    <p
                      className="text-sm text-slate-400 truncate mb-3"
                      title={book.author}
                    >
                      {book.author || "Unknown Author"}
                    </p>

                    <div className="mt-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-700/50 pt-3">
                      <span className="font-mono tabular-nums">
                        {formatDuration(book.duration)}
                      </span>
                      <span>
                        {/* Progress placeholder */}
                        Not started
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
