/**
 * ffprobe utility — extract duration, bitrate, codec from audio files.
 *
 * Runs ffprobe with a per-invocation timeout and supports bounded
 * concurrency when probing many files in parallel.
 */
import { execFile } from 'node:child_process'

interface ProbeResult {
  duration: number | null
  bitrate: number | null
  codec: string | null
}

const FFPROBE_TIMEOUT_MS = 10_000

/**
 * Probe a single audio file. Returns nulls on failure (missing ffprobe,
 * corrupt file, timeout, etc.).
 */
export function probeFile(filePath: string): Promise<ProbeResult> {
  return new Promise((resolve) => {
    execFile(
      'ffprobe',
      [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
      ],
      { timeout: FFPROBE_TIMEOUT_MS },
      (err, stdout) => {
        if (err) {
          resolve({ duration: null, bitrate: null, codec: null })
          return
        }
        try {
          const data = JSON.parse(stdout)
          const format = data.format ?? {}
          const duration = format.duration ? parseFloat(format.duration) : null
          const bitrate = format.bit_rate ? parseInt(format.bit_rate, 10) : null

          // Find the audio stream codec
          let codec: string | null = null
          if (Array.isArray(data.streams)) {
            const audioStream = data.streams.find(
              (s: Record<string, unknown>) => s.codec_type === 'audio',
            )
            if (audioStream) codec = audioStream.codec_name ?? null
          }

          resolve({ duration, bitrate, codec })
        } catch {
          resolve({ duration: null, bitrate: null, codec: null })
        }
      },
    )
  })
}

/**
 * Run async tasks with bounded concurrency.
 * Returns results in the same order as the input.
 */
export async function withConcurrency<T, TResult>(
  items: Array<T>,
  concurrency: number,
  fn: (item: T) => Promise<TResult>,
): Promise<Array<TResult>> {
  const results = new Array<TResult>(items.length)
  let next = 0

  async function worker() {
    while (next < items.length) {
      const idx = next++
      results[idx] = await fn(items[idx])
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  )
  await Promise.all(workers)
  return results
}
