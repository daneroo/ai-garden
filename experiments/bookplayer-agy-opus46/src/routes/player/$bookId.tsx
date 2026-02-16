import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowLeft,
  BookOpenText,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
} from 'lucide-react'
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'

import { fetchBook } from '../../server/library'

const EpubReader = lazy(() => import('../../components/EpubReader'))
const VttTranscript = lazy(() => import('../../components/VttTranscript'))

export const Route = createFileRoute('/player/$bookId')({
  loader: ({ params }) => fetchBook({ data: params.bookId }),
  component: PlayerPage,
})

function PlayerPage() {
  const book = Route.useLoaderData()
  const audioRef = useRef<HTMLAudioElement>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(1)

  // Sync audio state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const safeDuration = () => {
      const d = audio.duration
      return d && isFinite(d) ? d : 0
    }

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onDurationChange = () => setDuration(safeDuration())
    const onLoadedMetadata = () => setDuration(safeDuration())
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onEnded = () => setPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('durationchange', onDurationChange)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('durationchange', onDurationChange)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) {
      void audio.play()
    } else {
      audio.pause()
    }
  }, [])

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(
      0,
      Math.min(audio.currentTime + seconds, audio.duration || 0),
    )
  }, [])

  const seek = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
  }, [])

  const changeSpeed = useCallback(() => {
    const speeds = [0.75, 1, 1.25, 1.5, 1.75, 2]
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length] ?? 1
    setSpeed(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }, [speed])

  const changeVolume = useCallback((v: number) => {
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  // Keyboard transport
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(e.shiftKey ? -60 : -15)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(e.shiftKey ? 60 : 15)
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePlay, skip])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={`/api/audio/${book.id}`} preload="metadata" />

      {/* Header */}
      <header className="shrink-0 border-b border-slate-700 bg-slate-900/95 backdrop-blur-sm px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <BookOpenText className="h-5 w-5 text-cyan-400" />
          <span className="text-sm font-medium truncate">{book.title}</span>
          {book.author && (
            <span className="text-xs text-slate-500 truncate hidden sm:inline">
              — {book.author}
            </span>
          )}
        </div>
      </header>

      {/* Reader area — full width */}
      <div className="flex-1 overflow-hidden bg-slate-800 flex flex-col">
        {/* EPUB reader or fallback */}
        {book.hasEpub ? (
          <Suspense
            fallback={
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-slate-400 animate-pulse">
                  Loading EPUB…
                </p>
              </div>
            }
          >
            <EpubReader bookId={book.id} epubUrl={`/api/epub/${book.id}`} />
          </Suspense>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <BookOpenText className="mx-auto h-16 w-16 text-slate-600 mb-4" />
              <p className="text-slate-400">No EPUB available for this title</p>
            </div>
          </div>
        )}

        {/* Transcript strip */}
        <div className="shrink-0 border-t border-slate-700">
          {book.hasVtt ? (
            <Suspense
              fallback={
                <div className="h-20 bg-slate-900/50 p-3 flex items-center justify-center">
                  <p className="text-xs text-slate-500 animate-pulse">
                    Loading transcript…
                  </p>
                </div>
              }
            >
              <VttTranscript
                vttUrl={`/api/vtt/${book.id}`}
                currentTime={currentTime}
                onSeek={seek}
              />
            </Suspense>
          ) : (
            <div className="h-16 bg-slate-900/50 p-3 flex items-center justify-center">
              <p className="text-xs text-slate-500">No transcript available</p>
            </div>
          )}
        </div>
      </div>

      {/* Player bar — cover + controls */}
      <div className="shrink-0 border-t border-slate-700 bg-slate-800">
        {/* Seek bar — spans full width */}
        <div className="flex items-center gap-2 px-4 pt-2">
          <span className="w-14 text-right text-xs text-slate-500 tabular-nums">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="flex-1 h-1.5 appearance-none rounded-full bg-slate-700 accent-cyan-500 cursor-pointer"
            style={{
              background: `linear-gradient(to right, #06b6d4 ${progress}%, #334155 ${progress}%)`,
            }}
          />
          <span className="w-14 text-xs text-slate-500 tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row with cover art */}
        <div className="flex items-center gap-3 px-4 py-2">
          {/* Cover + metadata + badges (left) */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <img
              src={`/api/cover/${book.id}`}
              alt={book.title}
              className="h-12 w-12 rounded object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{book.title}</p>
              {book.author && (
                <p className="text-xs text-slate-400 truncate">{book.author}</p>
              )}
              <div className="flex gap-1 mt-0.5">
                <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-500">
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
              </div>
            </div>
          </div>

          {/* Transport controls (center) */}
          <div className="flex flex-1 items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => skip(-60)}
              className="hidden sm:block text-slate-500 hover:text-white transition-colors p-1"
              title="Back 1 min (Shift+←)"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => skip(-15)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Back 15s (←)"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
              title="Play/Pause (Space)"
            >
              {playing ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => skip(15)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              title="Forward 15s (→)"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => skip(60)}
              className="hidden sm:block text-slate-500 hover:text-white transition-colors p-1"
              title="Forward 1 min (Shift+→)"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          {/* Speed + Volume (right) */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            <button
              type="button"
              onClick={changeSpeed}
              className="rounded border border-slate-600 px-2 py-0.5 text-xs text-slate-400 hover:text-white transition-colors tabular-nums"
              title="Playback speed"
            >
              {speed}×
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => changeVolume(parseFloat(e.target.value))}
              className="hidden md:block w-20 h-1 appearance-none rounded-full bg-slate-700 accent-cyan-500 cursor-pointer"
              title="Volume"
            />
          </div>
        </div>

        {/* Keyboard hints */}
        <p className="pb-1 text-center text-[10px] text-slate-600">
          Space: play/pause · ←/→: ±15s · Shift+←/→: ±1m
        </p>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}
