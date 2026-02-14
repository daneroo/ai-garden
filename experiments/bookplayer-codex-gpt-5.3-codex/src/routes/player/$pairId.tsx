import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { EpubReader } from '@/components/EpubReader'
import { getPairsDirectoryData } from '@/lib/route-data.server'

interface TranscriptCue {
  start: number
  end: number
  text: string
}

interface PairProgress {
  audioTime: number
  playbackRate: number
  volume: number
  cfi: string | null
}

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2]

const getPairsDirectory = createServerFn({ method: 'GET' }).handler(
  async () => {
    return getPairsDirectoryData()
  },
)

export const Route = createFileRoute('/player/$pairId')({
  loader: async ({ params }) => {
    const pairId = params.pairId
    if (
      pairId.trim().length === 0 ||
      pairId.includes('/') ||
      pairId.includes('\\') ||
      pairId.includes('\0')
    ) {
      throw new Error('Invalid pair id.')
    }

    const directory = await getPairsDirectory()
    const pair = directory.pairs.find((entry) => entry.id === pairId)
    if (!pair) {
      throw new Error(`Pair not found: ${pairId}`)
    }

    return {
      pair,
    }
  },
  pendingComponent: () => (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-8 text-center">
        <h1 className="font-display text-3xl text-slate-100">
          Preparing player...
        </h1>
      </div>
    </main>
  ),
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <div className="rounded-2xl border border-rose-300/35 bg-rose-400/5 p-8 text-center">
        <h1 className="font-display text-3xl text-rose-100">
          Player failed to load
        </h1>
        <p className="mt-3 text-rose-200/90">
          {error?.message ?? 'Unknown error'}
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg border border-rose-300/40 px-3 py-1.5 text-sm text-rose-100 hover:bg-rose-300/10"
        >
          Back to library
        </Link>
      </div>
    </main>
  ),
  component: PlayerShell,
})

function parseVttTimestamp(raw: string): number {
  const clean = raw.trim().replace(',', '.')
  const pieces = clean.split(':')
  if (pieces.length < 2 || pieces.length > 3) {
    return Number.NaN
  }

  const secondsPart = Number.parseFloat(pieces[pieces.length - 1] ?? '')
  const minutesPart = Number.parseInt(pieces[pieces.length - 2] ?? '', 10)
  const hoursPart =
    pieces.length === 3 ? Number.parseInt(pieces[0] ?? '', 10) : 0

  if (
    !Number.isFinite(secondsPart) ||
    !Number.isFinite(minutesPart) ||
    !Number.isFinite(hoursPart)
  ) {
    return Number.NaN
  }

  return hoursPart * 3600 + minutesPart * 60 + secondsPart
}

function parseVtt(text: string): TranscriptCue[] {
  const lines = text.replace(/\r/g, '').split('\n')
  const cues: TranscriptCue[] = []

  let index = 0
  while (index < lines.length) {
    const line = (lines[index] ?? '').trim()
    if (!line) {
      index += 1
      continue
    }

    const timingLine = line.includes('-->')
      ? line
      : (lines[index + 1] ?? '').trim()

    if (!timingLine.includes('-->')) {
      index += 1
      continue
    }

    const [rawStart, rawEnd] = timingLine
      .split('-->')
      .map((part) => part.trim())
    const start = parseVttTimestamp(rawStart)
    const end = parseVttTimestamp(rawEnd.split(' ')[0] ?? rawEnd)

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      index += 1
      continue
    }

    const textStart = line.includes('-->') ? index + 1 : index + 2
    const cueLines: string[] = []
    let cursor = textStart
    while (cursor < lines.length) {
      const cueLine = lines[cursor] ?? ''
      if (!cueLine.trim()) {
        break
      }
      cueLines.push(cueLine.trim())
      cursor += 1
    }

    cues.push({
      start,
      end,
      text: cueLines.join(' ').trim(),
    })
    index = cursor + 1
  }

  return cues
}

function formatTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '--:--'
  }

  const wholeSeconds = Math.floor(totalSeconds)
  const hours = Math.floor(wholeSeconds / 3600)
  const minutes = Math.floor((wholeSeconds % 3600) / 60)
  const seconds = wholeSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function loadSavedProgress(progressKey: string): PairProgress | null {
  const raw = localStorage.getItem(progressKey)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PairProgress>
    if (
      typeof parsed.audioTime === 'number' &&
      typeof parsed.playbackRate === 'number' &&
      typeof parsed.volume === 'number'
    ) {
      return {
        audioTime: Math.max(parsed.audioTime, 0),
        playbackRate: Math.min(Math.max(parsed.playbackRate, 0.75), 2),
        volume: Math.min(Math.max(parsed.volume, 0), 1),
        cfi: typeof parsed.cfi === 'string' ? parsed.cfi : null,
      }
    }
  } catch {
    return null
  }

  return null
}

function PlayerShell() {
  const { pair } = Route.useLoaderData()
  const progressKey = useMemo(() => `bookplayer:progress:${pair.id}`, [pair.id])
  const audioRef = useRef<HTMLAudioElement>(null)
  const initialAudioTimeRef = useRef(0)
  const lastPersistRef = useRef(0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [volume, setVolume] = useState(1)
  const [savedCfi, setSavedCfi] = useState<string | null>(null)
  const [cues, setCues] = useState<TranscriptCue[]>([])
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)

  const persistProgress = useCallback(
    (force = false) => {
      const now = Date.now()
      if (!force && now - lastPersistRef.current < 1500) {
        return
      }
      lastPersistRef.current = now

      const audio = audioRef.current
      const payload: PairProgress = {
        audioTime: audio?.currentTime ?? currentTime,
        playbackRate,
        volume,
        cfi: savedCfi,
      }
      localStorage.setItem(progressKey, JSON.stringify(payload))
    },
    [currentTime, playbackRate, progressKey, savedCfi, volume],
  )

  useEffect(() => {
    const saved = loadSavedProgress(progressKey)
    if (!saved) {
      initialAudioTimeRef.current = 0
      setSavedCfi(null)
      setPlaybackRate(1)
      setVolume(1)
      setCurrentTime(0)
      return
    }

    initialAudioTimeRef.current = saved.audioTime
    setSavedCfi(saved.cfi)
    setPlaybackRate(saved.playbackRate)
    setVolume(saved.volume)
    setCurrentTime(saved.audioTime)
  }, [progressKey])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }
    audio.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }
    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const beforeUnload = () => persistProgress(true)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      persistProgress(true)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [persistProgress])

  useEffect(() => {
    persistProgress(true)
  }, [savedCfi, persistProgress])

  useEffect(() => {
    let disposed = false

    const loadTranscript = async () => {
      if (!pair.assets.vtt) {
        setCues([])
        setTranscriptError(null)
        return
      }

      try {
        const response = await fetch(pair.assets.vtt)
        if (!response.ok) {
          throw new Error(`Transcript request failed with ${response.status}`)
        }

        const text = await response.text()
        if (!disposed) {
          setCues(parseVtt(text))
          setTranscriptError(null)
        }
      } catch (error) {
        if (!disposed) {
          setCues([])
          setTranscriptError(
            error instanceof Error
              ? error.message
              : 'Unable to load transcript.',
          )
        }
      }
    }

    void loadTranscript()

    return () => {
      disposed = true
    }
  }, [pair.assets.vtt])

  const activeCue = useMemo(() => {
    return cues.find((cue) => currentTime >= cue.start && currentTime < cue.end)
  }, [cues, currentTime])

  const transcriptSummary = useMemo(() => {
    if (transcriptError) {
      return `Transcript error: ${transcriptError}`
    }
    if (!pair.assets.vtt) {
      return 'No transcript available.'
    }
    if (cues.length === 0) {
      return 'Transcript ready.'
    }
    if (!activeCue) {
      return 'Transcript synced.'
    }
    return `${formatTime(activeCue.start)} ${activeCue.text}`
  }, [activeCue, cues.length, pair.assets.vtt, transcriptError])

  const seekBy = useCallback(
    (seconds: number) => {
      const audio = audioRef.current
      if (!audio) {
        return
      }

      const nextTime = Math.max(
        0,
        Math.min(
          audio.currentTime + seconds,
          duration || Number.MAX_SAFE_INTEGER,
        ),
      )
      audio.currentTime = nextTime
      setCurrentTime(nextTime)
      persistProgress()
    },
    [duration, persistProgress],
  )

  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (audio.paused) {
      try {
        await audio.play()
      } catch {
        return
      }
      setIsPlaying(true)
      return
    }

    audio.pause()
    setIsPlaying(false)
    persistProgress(true)
  }, [persistProgress])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditable =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        target?.isContentEditable

      if (isEditable) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        seekBy(event.shiftKey ? -60 : -15)
        return
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        seekBy(event.shiftKey ? 60 : 15)
        return
      }
      if (event.key === ' ') {
        event.preventDefault()
        void togglePlayPause()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [seekBy, togglePlayPause])

  return (
    <main className="h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-2 p-2">
        <header className="flex h-10 shrink-0 items-center gap-2 rounded border border-slate-800 bg-slate-900/90 px-2">
          <div className="min-w-0 flex-1">
            <h1
              className="truncate text-xs font-semibold leading-tight text-slate-100"
              title={pair.title}
            >
              {pair.title}
            </h1>
            <p className="truncate text-[10px] leading-tight text-slate-500">
              {pair.author ?? pair.id}
            </p>
          </div>
          <Link
            to="/"
            className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-100 transition-colors hover:bg-slate-700"
          >
            Library
          </Link>
        </header>

        <section className="relative min-h-0 flex-1 overflow-hidden rounded border border-slate-800 bg-slate-950">
          <EpubReader
            epubUrl={pair.assets.epub}
            initialCfi={savedCfi}
            onLocationChange={setSavedCfi}
          />
        </section>

        <footer className="shrink-0 rounded border border-slate-800 bg-slate-900/90 px-2 py-1.5">
          <audio
            ref={audioRef}
            src={pair.assets.audio}
            preload="metadata"
            onLoadedMetadata={() => {
              const audio = audioRef.current
              if (!audio) {
                return
              }
              setAudioError(null)
              setDuration(audio.duration || 0)
              audio.playbackRate = playbackRate
              audio.volume = volume
              if (initialAudioTimeRef.current > 0) {
                audio.currentTime = Math.min(
                  initialAudioTimeRef.current,
                  audio.duration || initialAudioTimeRef.current,
                )
                setCurrentTime(audio.currentTime)
              }
            }}
            onTimeUpdate={() => {
              const audio = audioRef.current
              if (!audio) {
                return
              }
              setCurrentTime(audio.currentTime)
              persistProgress()
            }}
            onPlay={() => {
              setAudioError(null)
              setIsPlaying(true)
            }}
            onPause={() => {
              setIsPlaying(false)
              persistProgress(true)
            }}
            onEnded={() => {
              setIsPlaying(false)
              persistProgress(true)
            }}
            onError={(event) => {
              const code = event.currentTarget.error?.code
              setAudioError(
                code
                  ? `Audio failed to load (error ${code}).`
                  : 'Audio failed to load.',
              )
            }}
          />

          <p className="mb-1 truncate text-[10px] text-slate-400">
            {transcriptSummary}
          </p>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <TransportButton label="-15s" onClick={() => seekBy(-15)} />
            <TransportButton
              label={isPlaying ? 'Pause' : 'Play'}
              onClick={() => {
                void togglePlayPause()
              }}
            />
            <TransportButton label="+15s" onClick={() => seekBy(15)} />

            <label className="ml-1 flex items-center gap-1 text-slate-300">
              Speed
              <select
                value={playbackRate}
                onChange={(event) =>
                  setPlaybackRate(Number.parseFloat(event.currentTarget.value))
                }
                className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[11px] text-slate-100"
              >
                {PLAYBACK_RATES.map((rate) => (
                  <option key={rate} value={rate}>
                    {rate.toFixed(2)}x
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-1 text-slate-300">
              Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(event) =>
                  setVolume(Number.parseFloat(event.currentTarget.value))
                }
                className="w-16 accent-slate-300"
              />
            </label>

            <span className="ml-auto tabular-nums text-slate-200">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {audioError ? (
            <p className="mt-1 text-[10px] text-rose-300">{audioError}</p>
          ) : null}
        </footer>
      </div>
    </main>
  )
}

function TransportButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] text-slate-100 transition-colors hover:bg-slate-700"
    >
      {label}
    </button>
  )
}
