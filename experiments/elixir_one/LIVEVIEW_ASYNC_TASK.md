# LiveView Async Task Experiment

> First Phoenix/LiveView App - Documenting how async background work integrates with LiveView.

## Context

This experiment explores how to:

- Scan a directory of audiobooks (~882 files)
- Enrich each file with metadata via `ffprobe` (slow, ~20s total)
- Stream progress updates to the browser in real-time

The goal isn't a production UI—it's understanding the mechanics of:

- Background tasks in Elixir
- PubSub for real-time updates
- LiveView rendering and performance

---

## Next Steps

- Add visual loading indicator per-row (spinner while enriching)
- Persist enriched data to SQLite/Ash
- Add sorting and pagination
- Experiment with more complex async patterns (cancellation, retries)
- Refactor to LiveView Streams (`stream/3`) to reduce memory usage
- Implement ETS for canonical state storage to reduce message copying
- Move the elapsed timer to a client-side Hook to reduce PubSub traffic

---

## Architecture

```txt
┌─────────────────────────────────────────────────────────────────┐
│                        Application Start                         │
│                              │                                   │
│                    ┌─────────▼─────────┐                         │
│                    │  Library.Server   │◄── GenServer (singleton)│
│                    │  (holds state)    │                         │
│                    └────────┬──────────┘                         │
│                             │                                     │
│              ┌──────────────┼──────────────┐                     │
│              ▼              ▼              ▼                     │
│         Fast Scan      Async Task      PubSub                    │
│         (instant)      (ffprobe)       (batched)                 │
│                             │              │                     │
│                             └──────────────┼─────────────────────┤
│                                            ▼                     │
│                                    ┌──────────────┐              │
│                                    │  BooksLive   │              │
│                                    │  (LiveView)  │              │
│                                    └──────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### Scanner (`lib/elixir_one/library/scanner.ex`)

Walks the directory tree and optionally enriches with metadata.

- `scan/1` - Fast directory walk. Returns list of `%{path, basename, size, mtime}`. Instant.
- `enrich_stream/1` - Returns a lazy `Stream` of entries enriched via `ffprobe`. Uses `Task.async_stream` with `max_concurrency: 20`.

### Prober (`lib/elixir_one/library/prober.ex`)

Calls `ffprobe` on a single file and parses the JSON output.

Returns: `{:ok, %{duration, bit_rate_bps, title, author, ...}}` or `{:error, reason}`.

### Server (`lib/elixir_one/library/server.ex`)

Singleton GenServer that owns the library state and coordinates updates.

Key behaviors:

- On `init`: Sends `:load` to self, starts background scan
- On `:load`:
  - Fast scan (immediate)
  - Broadcast `{:library_reset, entries, 0}` to reset UI
  - Spawn `Task` that iterates `enrich_stream/1`
  - Broadcast `{:progress_update, elapsed_s}` every 10 entries (batched!)
  - On completion: Broadcast `{:scan_complete, elapsed_s}`

### BooksLive (`lib/elixir_one_web/live/books_live.ex`)

LiveView that subscribes to PubSub and renders the table.

Key behaviors:

- On `mount`: Fetch current state from Server, subscribe to "library" topic
- On `{:progress_update, elapsed_s}`: Fetch fresh state, update assigns
- On `{:scan_complete, elapsed_s}`: Final refresh

---

## Critical Lesson: Batching PubSub Updates

### The Problem

With 882 files and 20 parallel probes, we were sending ~50 updates/second to the browser. Each update caused:

- Full `Enum.map` over 882 entries
- Re-filter
- LiveView diff + render

Result: Browser lagged 4-5x behind the server. A 19s enrichment took 40+ seconds to display.

### The Fix

Batch updates: Broadcast to browser every 10 entries instead of every single one.

```elixir
# Server.ex - inside the Task
|> Stream.with_index(1)
|> Enum.each(fn {entry, index} ->
  send(server_pid, {:update_entry, entry})  # Always update server state

  if rem(index, 10) == 0 do                 # Only broadcast every 10
    Phoenix.PubSub.broadcast(..., {:progress_update, elapsed_s})
  end
end)
```

Result: ~88 updates instead of ~882. Browser keeps up in real-time.

---

## Template Highlights (`books_live.html.heex`)

```heex
<!-- Stats header with reset button -->
<div class="mt-4 flex items-center justify-between">
  <div>
    {@filtered_count} of {@total_count} books visible
    <span>({Enum.count(@entries, &Map.get(&1, :bit_rate_bps))} enriched in {@elapsed_s}s)</span>
  </div>
  <button phx-click="global_reset">Rescan Library ↻</button>
</div>

<!-- Table with live data -->
<.table rows={@filtered_entries}>
  <:col :let={entry} label="Name">{Map.get(entry, :title) || entry.basename}</:col>
  <:col :let={entry} label="Author">{Map.get(entry, :author, "-")}</:col>
  ...
</.table>
```

---

## Summary of Patterns

| Pattern             | Implementation                                      |
| ------------------- | --------------------------------------------------- |
| Background work     | `Task.start/1` spawned from GenServer               |
| Parallel processing | `Task.async_stream` with `max_concurrency`          |
| Real-time updates   | `Phoenix.PubSub.broadcast` → LiveView `handle_info` |
| State management    | Singleton GenServer holds canonical data            |
| Batching            | Broadcast every N items, not every single one       |
| Fast initial load   | Fast scan first, enrich async second                |
