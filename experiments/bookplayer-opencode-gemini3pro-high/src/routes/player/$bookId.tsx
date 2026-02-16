import { createFileRoute } from "@tanstack/react-router";
import { getBookFn } from "../../server/functions";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Play,
  Pause,
  List,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Menu,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Book } from "../../server/types";
import { parseVtt, type VttCue } from "../../lib/vtt";
import ePub from "epubjs";

export const Route = createFileRoute("/player/$bookId")({
  component: Player,
  loader: async ({ params }) => {
    return await getBookFn({ data: params.bookId });
  },
});

// Helper for EPUB search
// Iterate over all spine items, load them, search, unload.
// Note: This can be slow for large books.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function doSearch(book: any, query: string) {
  if (!query || query.length < 3) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any[] = [];
  // Use a subset or chunking if too slow, but for now iterate all
  for (const item of book.spine.spineItems) {
    try {
      await item.load(book.load.bind(book));
      const itemResults = await item.find(query);
      item.unload();
      results.push(...itemResults);
    } catch (e) {
      console.warn("Failed to search chapter", e);
    }
  }
  return results;
}

function Player() {
  const book = Route.useLoaderData() as Book | undefined;

  // --- Audio State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [cues, setCues] = useState<VttCue[]>([]);
  const [activeCueId, setActiveCueId] = useState<string | null>(null);

  // --- Reader State ---
  const readerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rendition, setRendition] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [epubBook, setEpubBook] = useState<any>(null); // ePub.Book
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [toc, setToc] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentCfi, setCurrentCfi] = useState<string>("");

  // --- Search State ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- Persistence Key ---
  const storageKey = book ? `book-progress-${book.id}` : "";

  // 1. VTT Loading
  useEffect(() => {
    if (!book) return;
    fetch(`/api/media/vtt/${book.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No VTT");
        return res.text();
      })
      .then((text) => setCues(parseVtt(text)))
      .catch(() => setCues([]));
  }, [book]);

  // 2. Audio Sync & Transport
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const t = audio.currentTime;
      setCurrentTime(t);
      // Sync transcript
      const active = cues.find((c) => t >= c.startTime && t < c.endTime);
      if (active && active.id !== activeCueId) {
        setActiveCueId(active.id);
        document.getElementById(`cue-${active.startTime}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else if (!active) {
        setActiveCueId(null);
      }
    };

    const updateDuration = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", onEnded);
    };
  }, [cues, activeCueId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Restore Audio Progress
  useEffect(() => {
    if (storageKey && audioRef.current) {
      const saved = localStorage.getItem(storageKey + "-audio");
      if (saved) {
        const t = parseFloat(saved);
        if (Number.isFinite(t)) {
          audioRef.current.currentTime = t;
          setCurrentTime(t);
        }
      }
    }
  }, [storageKey]);

  // Save Audio Progress
  useEffect(() => {
    if (!storageKey || !currentTime) return;
    const save = () =>
      localStorage.setItem(storageKey + "-audio", currentTime.toString());
    const interval = setInterval(save, 5000); // Save every 5s
    return () => clearInterval(interval);
  }, [storageKey, currentTime]);

  // 3. Reader Initialization & Logic
  useEffect(() => {
    if (!book?.epubFile || !readerRef.current) return;

    const epubUrl = `/api/media/epub/${book.id}.epub`;
    const eBook = ePub(epubUrl);
    setEpubBook(eBook);

    const rend = eBook.renderTo(readerRef.current, {
      width: "100%",
      height: "100%",
      flow: "paginated",
    });
    setRendition(rend);

    // Restore Location
    const savedCfi = localStorage.getItem(storageKey + "-epub");
    rend.display(savedCfi || undefined);

    // Event: Relocated (Save Progress)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rend.on("relocated", (location: any) => {
      setCurrentCfi(location.start.cfi);
      localStorage.setItem(storageKey + "-epub", location.start.cfi);
    });

    // Load TOC
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eBook.loaded.navigation.then((nav: any) => {
      setToc(nav.toc);
    });

    return () => {
      eBook.destroy();
    };
  }, [book, storageKey]);

  // --- Handlers ---

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const seekRelative = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(
        0,
        Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + seconds,
        ),
      );
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Reader Navigation
  const prevPage = () => rendition?.prev();
  const nextPage = () => rendition?.next();

  const handleTocChange = (href: string) => {
    rendition?.display(href);
  };

  // Search Logic
  const performSearch = async () => {
    if (!epubBook || !searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await doSearch(epubBook, searchQuery);
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (cfi: string) => {
    rendition?.display(cfi);
    rendition?.annotations.add("highlight", cfi);
    // Optional: clear previous highlights?
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time)) return "0:00";
    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = Math.floor(time % 60);
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!book) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Book Not Found</h1>
          <Link to="/" className="text-cyan-400 hover:text-cyan-300">
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-900 text-slate-300 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/90 backdrop-blur z-30 relative">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            to="/"
            className="p-2 hover:bg-slate-800 rounded-full transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0 truncate">
            <h1 className="font-semibold text-slate-100 truncate text-sm md:text-base">
              {book.title}
            </h1>
            <p className="text-xs text-slate-500 truncate">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* TOC Dropdown */}
          <div className="relative group">
            <select
              onChange={(e) => handleTocChange(e.target.value)}
              className="appearance-none bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:border-cyan-500 max-w-[150px] truncate"
              defaultValue=""
            >
              <option value="" disabled>
                Table of Contents
              </option>
              {toc.map((item, i) => (
                <option key={i} value={item.href}>
                  {item.label.trim()}
                </option>
              ))}
            </select>
            <Menu className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`p-2 rounded-full transition-colors ${isSearchOpen ? "bg-cyan-900/50 text-cyan-400" : "hover:bg-slate-800 text-slate-400"}`}
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Search Overlay Panel */}
        {isSearchOpen && (
          <div className="absolute top-0 right-0 bottom-0 w-full md:w-80 bg-slate-900/95 backdrop-blur border-l border-slate-700 z-50 flex flex-col shadow-2xl transition-transform">
            <div className="p-4 border-b border-slate-700 flex gap-2">
              <input
                type="text"
                placeholder="Search in book..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") performSearch();
                }}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-cyan-500 outline-none"
                autoFocus
              />
              <button
                onClick={performSearch}
                disabled={isSearching}
                className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {searchResults.length === 0 && !isSearching && searchQuery && (
                <p className="text-center text-slate-500 text-sm py-4">
                  No results found.
                </p>
              )}
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleResultClick(result.cfi)}
                  className="w-full text-left p-3 rounded hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group"
                >
                  <p className="text-xs text-slate-500 mb-1 font-mono">
                    {result.cfi.slice(0, 20)}...
                  </p>
                  <p className="text-sm text-slate-300 line-clamp-2 group-hover:text-cyan-300">
                    "{result.excerpt.trim()}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reader Area */}
        <div className="flex-1 bg-white relative group">
          {book.epubFile ? (
            <>
              <div ref={readerRef} className="absolute inset-0" />

              {/* Reader Navigation Overlays (Desktop) */}
              <button
                onClick={prevPage}
                className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hover:from-black/20 flex items-center justify-start pl-4 outline-none"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-8 h-8 text-slate-800/50 drop-shadow-lg" />
              </button>
              <button
                onClick={nextPage}
                className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hover:from-black/20 flex items-center justify-end pr-4 outline-none"
                aria-label="Next Page"
              >
                <ChevronRight className="w-8 h-8 text-slate-800/50 drop-shadow-lg" />
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
              <div className="text-center">
                <p>No eBook available.</p>
                <p className="text-sm">Audio-only mode.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (Player & Transcript) */}
        <div className="w-full md:w-96 bg-slate-800 border-l border-slate-700 flex flex-col flex-shrink-0 z-20">
          {/* Transcript */}
          <div
            className="flex-1 overflow-y-auto p-4 border-b border-slate-700"
            ref={transcriptRef}
          >
            <div className="flex items-center gap-2 text-slate-500 mb-4 uppercase text-xs font-bold tracking-wider sticky top-0 bg-slate-800 py-2">
              <List className="w-3 h-3" />
              Transcript
            </div>
            {cues.length > 0 ? (
              <div className="space-y-4">
                {cues.map((cue, i) => (
                  <div
                    key={i}
                    id={`cue-${cue.startTime}`}
                    className={`text-sm p-2 rounded cursor-pointer transition-colors ${
                      activeCueId === cue.id ||
                      (currentTime >= cue.startTime &&
                        currentTime < cue.endTime)
                        ? "bg-cyan-900/30 text-cyan-200 border-l-2 border-cyan-500"
                        : "text-slate-400 hover:bg-slate-700/50"
                    }`}
                    onClick={() => seek(cue.startTime)}
                    onDoubleClick={() => seek(cue.startTime)}
                  >
                    <p>{cue.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="italic opacity-50 text-center py-8 text-sm">
                No transcript available.
              </p>
            )}
          </div>

          {/* Audio Player Controls */}
          <div className="p-4 bg-slate-800 space-y-4 shadow-lg z-30">
            {/* Timeline */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-xs text-slate-500 font-mono tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <select
                  value={playbackRate}
                  onChange={(e) => setPlaybackRate(Number(e.target.value))}
                  className="bg-transparent text-xs text-slate-400 font-bold hover:text-white cursor-pointer focus:outline-none"
                >
                  <option value="0.75">0.75x</option>
                  <option value="1.0">1.0x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2.0">2.0x</option>
                </select>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => seekRelative(-60)}
                  className="text-slate-400 hover:text-white transition-colors flex flex-col items-center group"
                  title="-1m"
                >
                  <ChevronsLeft className="w-5 h-5 group-active:scale-90 transition-transform" />
                  <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100">
                    -1m
                  </span>
                </button>
                <button
                  onClick={() => seekRelative(-15)}
                  className="text-slate-400 hover:text-white transition-colors flex flex-col items-center group"
                  title="-15s"
                >
                  <ChevronLeft className="w-5 h-5 group-active:scale-90 transition-transform" />
                  <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100">
                    -15s
                  </span>
                </button>

                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-cyan-600 hover:bg-cyan-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-900/20 transition-all active:scale-95 flex-shrink-0"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={() => seekRelative(15)}
                  className="text-slate-400 hover:text-white transition-colors flex flex-col items-center group"
                  title="+15s"
                >
                  <ChevronRight className="w-5 h-5 group-active:scale-90 transition-transform" />
                  <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100">
                    +15s
                  </span>
                </button>
                <button
                  onClick={() => seekRelative(60)}
                  className="text-slate-400 hover:text-white transition-colors flex flex-col items-center group"
                  title="+1m"
                >
                  <ChevronsRight className="w-5 h-5 group-active:scale-90 transition-transform" />
                  <span className="text-[10px] font-mono opacity-50 group-hover:opacity-100">
                    +1m
                  </span>
                </button>
              </div>

              <div className="w-16"></div>
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={`/api/media/audio/${book.id}`}
          controls={false}
          preload="auto"
        />
      </main>
    </div>
  );
}
