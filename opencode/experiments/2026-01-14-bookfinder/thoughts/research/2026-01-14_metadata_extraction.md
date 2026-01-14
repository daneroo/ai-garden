---
date: 2026-01-14T19:45:00Z
topic: Enhanced Metadata Extraction Research
tags: ffprobe, metadata, concurrency, bun
last_updated: 2026-01-14T19:45:00Z
---

# Enhanced Metadata Extraction Research

## Ticket Synopsis

Extend the audiobook scanner to extract detailed metadata using `ffprobe`.
Target formats are `.m4b`, `.mp3`, and `.m4a`. Output should include duration,
bitrate, codec, and tags. JSON output size must be in bytes. Extraction must be
parallelized.

## Summary

- **Tool**: `ffprobe` provides comprehensive metadata in JSON format.
- **Fixture Analysis**: `Robert Frost - The Road Not Taken.m4b` contains
  `title`, `artist`, `album`, `duration` (76s), and `bit_rate` (132kbps).
- **Concurrency**: `Bun.spawn` can be used to run `ffprobe`. Concurrency can be
  managed using a simple pool or `p-limit`.
- **Data Transformation**:
  - `duration`: Convert string to number (seconds).
  - `bit_rate`: Convert string to number (bps).
  - `size`: Use `fs.stat` for reliability or `format.size` from ffprobe. The
    user requested `size` in bytes for JSON.

## Detailed Findings

### ffprobe JSON Structure

Example command: `ffprobe -v error -show_format -show_streams -of json [file]`

Relevant fields:

- `.format.duration` (string)
- `.format.bit_rate` (string)
- `.format.size` (string)
- `.format.tags.title` (string)
- `.format.tags.artist` (string)
- `.format.tags.album` (string)
- `.streams[0].codec_name` (string)

### Duration Formatting

```typescript
function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":")
    .replace(/^00:/, ""); // Optional: hide leading 00
}
```

### Concurrency in Bun

Using `p-limit` or a custom semaphore:

```typescript
async function parallelMap<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  const running = new Set<Promise<void>>();
  for (const item of items) {
    const promise = fn(item).then((res) => {
      results.push(res);
      running.delete(promise);
    });
    running.add(promise);
    if (running.size >= limit) {
      await Promise.race(running);
    }
  }
  await Promise.all(running);
  return results;
}
```

## Architecture Insights

- **Scanner vs Prober**: The `Scanner` should find files, and a new `Prober`
  component should handle `ffprobe` execution.
- **Fail Fast**: The user wants to exit on `ffprobe` failure. We must handle
  process exit codes and stderr.

## Open Questions

- Should we handle cases where tags like `artist` are missing by checking
  `album_artist`? (Research says `artist` is the primary one).
- Handling multiple audio streams? (Audiobooks usually have one, but we should
  pick the first audio stream).

## Next Steps

1. Create implementation plan.
2. Implement `Prober` logic.
3. Update `Scanner` to support multiple extensions.
4. Integrate parallel probing into `index.ts`.
