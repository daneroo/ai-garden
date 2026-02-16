/**
 * VTT Transcript panel — loads a WebVTT file, displays cue list,
 * highlights the active cue, supports click-to-seek, auto-scrolls.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface VttCue {
  start: number
  end: number
  text: string
}

interface VttTranscriptProps {
  vttUrl: string
  currentTime: number
  onSeek: (time: number) => void
}

/** Parse HH:MM:SS.mmm or MM:SS.mmm into seconds. */
function parseTimestamp(ts: string): number {
  const parts = ts.split(':')
  if (parts.length === 3) {
    return (
      parseFloat(parts[0]) * 3600 +
      parseFloat(parts[1]) * 60 +
      parseFloat(parts[2])
    )
  }
  if (parts.length === 2) {
    return parseFloat(parts[0]) * 60 + parseFloat(parts[1])
  }
  return parseFloat(ts)
}

/** Parse raw VTT text into cue array. */
function parseVtt(text: string): Array<VttCue> {
  const cues: Array<VttCue> = []
  // Split on double-newline blocks
  const blocks = text.replace(/\r\n/g, '\n').split(/\n\n+/)
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    // Find the timestamp line (contains "-->")
    const tsLineIdx = lines.findIndex((l) => l.includes('-->'))
    if (tsLineIdx < 0) continue
    const tsLine = lines[tsLineIdx]
    const match = /^([\d:.]+)\s+-->\s+([\d:.]+)/.exec(tsLine)
    if (!match) continue
    const start = parseTimestamp(match[1])
    const end = parseTimestamp(match[2])
    const cueText = lines
      .slice(tsLineIdx + 1)
      .join(' ')
      .trim()
    if (cueText) {
      cues.push({ start, end, text: cueText })
    }
  }
  return cues
}

export default function VttTranscript({
  vttUrl,
  currentTime,
  onSeek,
}: VttTranscriptProps) {
  const [cues, setCues] = useState<Array<VttCue>>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Fetch and parse VTT
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetch(vttUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.text()
      })
      .then((text) => {
        if (cancelled) return
        const parsed = parseVtt(text)
        setCues(parsed)
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [vttUrl])

  // Find active cue index via binary search
  const activeCueIndex = useMemo(() => {
    if (cues.length === 0) return -1
    // Find the last cue whose start <= currentTime and end > currentTime
    let lo = 0
    let hi = cues.length - 1
    let result = -1
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1
      if (cues[mid].start <= currentTime) {
        result = mid
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    if (result >= 0 && cues[result].end > currentTime) return result
    return -1
  }, [cues, currentTime])

  // Auto-scroll to active cue
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    }
  }, [activeCueIndex])

  const handleClick = useCallback(
    (time: number) => {
      onSeek(time)
    },
    [onSeek],
  )

  if (loading) {
    return (
      <div className="h-20 shrink-0 border-t border-slate-700 bg-slate-900/50 p-3 flex items-center justify-center">
        <p className="text-xs text-slate-500 animate-pulse">
          Loading transcript…
        </p>
      </div>
    )
  }

  if (error || cues.length === 0) {
    return (
      <div className="h-16 shrink-0 border-t border-slate-700 bg-slate-900/50 p-3 flex items-center justify-center">
        <p className="text-xs text-slate-500">No transcript available</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-28 shrink-0 overflow-y-auto border-t border-slate-700 bg-slate-900/50 px-3 py-2 space-y-0.5"
    >
      {cues.map((cue, i) => {
        const isActive = i === activeCueIndex
        return (
          <button
            key={i}
            ref={isActive ? activeRef : undefined}
            type="button"
            onClick={() => handleClick(cue.start)}
            className={`block w-full text-left rounded px-2 py-0.5 text-xs transition-colors ${
              isActive
                ? 'bg-cyan-900/50 text-cyan-300 font-medium'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {cue.text}
          </button>
        )
      })}
    </div>
  )
}
