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

function Player() {
  const book = Route.useLoaderData() as Book | undefined;
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const [cues, setCues] = useState<VttCue[]>([]);
  const [activeCueId, setActiveCueId] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // VTT Loading
  useEffect(() => {
    if (!book) return;

    // Fetch VTT
    fetch(`/api/media/vtt/${book.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("No VTT");
        return res.text();
      })
      .then((text) => {
        const parsed = parseVtt(text);
        setCues(parsed);
      })
      .catch(() => {
        // VTT missing is expected for some books
        setCues([]);
      });
  }, [book]);

  // Audio Sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      const t = audio.currentTime;
      setCurrentTime(t);

      const active = cues.find((c) => t >= c.startTime && t < c.endTime);
      if (active && active.id !== activeCueId) {
        setActiveCueId(active.id);
        const el = document.getElementById(`cue-${active.startTime}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  // Reader Initialization
  useEffect(() => {
    if (!book?.epubFile || !readerRef.current) return;

    const epubUrl = `/api/media/epub/${book.id}`;
    const rendition = ePub(epubUrl).renderTo(readerRef.current, {
      width: "100%",
      height: "100%",
      flow: "paginated",
    });

    rendition.display();

    return () => {
      // Cleanup if needed
    };
  }, [book]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

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
    <div className="h-screen bg-slate-900 text-slate-300 flex flex-col">
      {/* Header */}
      <header className="flex-shrink-0 h-14 border-b border-slate-800 flex items-center px-4 justify-between bg-slate-900/90 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="font-semibold text-slate-100 truncate">
              {book.title}
            </h1>
            <p className="text-xs text-slate-500 truncate">{book.author}</p>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Reader Area (Left/Top) */}
        <div className="flex-1 bg-white text-slate-900 relative">
          {book.epubFile ? (
            <div ref={readerRef} className="absolute inset-0" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
              <div className="text-center">
                <p>No eBook available.</p>
                <p className="text-sm">Audio-only mode.</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (Right/Bottom) - Player & Transcript */}
        <div className="w-full md:w-96 bg-slate-800 border-l border-slate-700 flex flex-col flex-shrink-0 z-20">
          {/* Transcript (Top of Sidebar) */}
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

          {/* Audio Player (Bottom of Sidebar) */}
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
      </main>

      <audio
        ref={audioRef}
        src={`/api/media/audio/${book.id}`}
        preload="metadata"
      />
    </div>
  );
}
