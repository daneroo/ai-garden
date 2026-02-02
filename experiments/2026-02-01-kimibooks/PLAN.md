# Kimibooks PLAN

Experiment: 2026-02-01-kimibooks | Agent: OpenCode | Seed: bookfinder.md

Goal: Audiobook scanner CLI with Bun + OpenTUI. Scans /Volumes/Space/Reading/audiobooks/, extracts metadata via ffprobe, interactive results table.

Design Decisions:

- Test with Malazan subset (10 books), use --limit N flag for dev speed
- .env file for ROOT_PATH, CLI --rootpath overrides
- Default: TUI with progress → results table; --json: direct JSON output

## Milestones

- [x] **M0 Bootstrap**
  - [x] bun init + TypeScript
  - [x] Deps: commander, @opentui/core, @opentui/react, react, dotenv, eslint, prettier, vitest
  - [x] AGENTS.md, PLAN.md (this file)
  - [x] bun run ci passes

- [x] **M1 CLI Foundation**
  - [x] .env loading for ROOT_PATH
  - [x] Commander: -r --rootpath, -c --concurrency (default 8), --json, --limit N, -h --help
  - [x] Validate rootpath exists and is directory

- [x] **M2 File Discovery**
  - [x] Recursive scan for .m4b, .mp3
  - [x] Skip hidden files/dirs
  - [x] Sort by relative path ascending
  - [x] Respect --limit flag

- [x] **M3 Metadata Extraction**
  - [x] ffprobe with 30s timeout, -print_format json
  - [x] Extract: duration, bitrate, codec, title, artist, file size, relative path
  - [x] Concurrency-limited worker pool (default 8)
  - [x] Skip failures, log warnings, continue processing

- [x] **M4 TUI Progress View**
  - [x] OpenTUI React setup
  - [x] Show: total, processed, running, timing
  - [x] In-flight files list (up to concurrency)
  - [x] --json bypasses TUI

- [x] **M5 TUI Results Table**
  - [x] Columns: Author, Title, Duration (HH:MM:SS), Bitrate, Codec, File
  - [x] Sort: left/right arrows cycle columns, r reverses, show ↑/↓ indicators
  - [x] Scroll: arrows/j/k, page up/down, g/G top/bottom
  - [x] Keep headers visible, truncate Author/Title/File with ellipsis
  - [x] q or esc exits

- [x] **M6 JSON Mode**
  - [x] --json bypasses TUI, outputs pretty-printed JSON array (2-space indent)
  - [x] All metadata fields included
  - [x] Warnings to stderr, exit 0 success / 1 fatal error

- [x] **M7 Polish**
  - [x] Test full 882-book library (JSON mode verified)
  - [x] Performance and memory validation
  - [x] bun run ci passes

## Learnings / Notes

### OpenTUI Patterns (from booktui implementation)

**Critical: Renderer Setup for Clean Exit**

```typescript
const renderer = await createCliRenderer({
  exitOnCtrlC: true,        // Set HERE, not in useKeyboard
  useAlternateScreen: true, // Clean fullscreen mode
});

await new Promise<void>((resolve) => {
  const root = createRoot(renderer);
  root.render(
    <App onExit={() => {
      renderer.destroy();  // Clean cleanup
      resolve();           // Unblock async
    }} />
  );
});
```

**Key Insights:**

1. `exitOnCtrlC` must be set on createCliRenderer, NOT in useKeyboard
2. Wrap render in Promise for async/await friendly cleanup
3. Call `renderer.destroy()` in onExit for clean shutdown
4. Use phase-based state machine (scanning → probing → results)
5. Worker pool pattern: `Promise.all(Array.from({length: n}, () => worker()))`
6. Async work goes in useCallback, triggered by useEffect ONCE
7. Keyboard handlers call `onQuit()` callback, NOT process.exit directly

### Worker Pool Pattern (CRITICAL for large batches)

**WRONG - causes memory leaks and system hangs:**

```typescript
// BAD: Promise.race with shared Map causes unbounded growth
const inFlight = new Map<string, Promise<void>>();
async function worker() {
  while (queue.length > 0) {
    const file = queue.shift();
    const promise = processFile(file);
    inFlight.set(file.path, promise); // Added but removal is delayed
    if (inFlight.size >= concurrency) {
      await Promise.race(inFlight.values()); // Only waits for ONE
      // Other completed promises still in map!
    }
  }
}
```

**CORRECT - shared index pattern:**

```typescript
// GOOD: Each worker grabs next file via atomic index
let nextIndex = 0;
const inFlight = new Set<string>(); // Only tracks currently running

async function worker() {
  while (nextIndex < files.length) {
    const file = files[nextIndex++]; // Atomic increment
    inFlight.add(file.path);

    const metadata = await extractMetadata(file); // Await directly

    inFlight.delete(file.path); // Immediately remove when done
    results.push(metadata);
  }
}

const workers = Array.from({ length: concurrency }, () => worker());
await Promise.all(workers);
```

**Key Insights:**

- Use `nextIndex++` for atomic work distribution (no queue.shift race conditions)
- Each worker awaits its own work directly (no Promise.race needed)
- `inFlight` Set only contains currently-running work (bounded by concurrency)
- Progress callback fires before and after each file

### TUI Table Layout (CRITICAL)

**WRONG - multiple text elements cause rendering chaos:**

```tsx
// BAD: Multiple text elements don't align properly
<box>
  <text>{truncate(author, 20)}</text>
  <text>{truncate(title, 25)}</text>
  <text>{truncate(file, 30)}</text>
</box>
// Result: Overlapping, misaligned, unreadable output
```

**CORRECT - single formatted string per row:**

```tsx
// GOOD: One text element with pre-formatted string
const row = [
  truncEnd(author, wAuthor),
  truncEnd(title, wTitle),
  truncEnd(duration, wDuration),
  truncFront(file, wFile),
].join("  "); // 2-space gap

<box>
  <text>{row}</text>
</box>;
```

### Column Width Management

**Calculate from terminal width dynamically:**

```typescript
const { width } = useTerminalDimensions();
const availWidth = width - gaps - margins;
const wAuthor = Math.floor(availWidth * 0.3);
const wTitle = Math.floor(availWidth * 0.4);
const wFile = availWidth - wAuthor - wTitle;
```

**Truncation strategies by column type:**

- **Author/Title**: `str.slice(0, len-1) + "…"` (keep beginning)
- **File**: `"…" + str.slice(-(len-1))` (keep end/filename)

### Critical Lessons Summary

**What should have been known before starting:**

1. **OpenTUI lifecycle**: Renderer setup must include `exitOnCtrlC: true` and Promise wrapper for cleanup
2. **Worker pool**: Use atomic index pattern (`nextIndex++`), never Promise.race with shared state
3. **TUI tables**: Single text element per row with manual string formatting
4. **Column widths**: Calculate from terminal dimensions, different truncation per content type
5. **Async React**: useCallback + useEffect pattern, never direct async in render

**Common Mistakes to Avoid:**

- DON'T use Promise.race with shared Maps/Sets (causes unbounded growth)
- DON'T use queue.shift() with multiple workers (race conditions)
- DON'T use multiple text elements per table row (causes layout chaos)
- DON'T hardcode column widths (breaks on different terminal sizes)
- DON'T put exitOnCtrlC in useKeyboard hook
- DON'T call process.exit() directly in components
- DO use atomic index pattern for work distribution
- DO use single formatted strings for table rows
- DO calculate widths from useTerminalDimensions()
- DO pass onExit/onQuit callbacks down through component tree

## Audit Trail

| Date       | Action      | Notes                                      |
| ---------- | ----------- | ------------------------------------------ |
| 2026-02-01 | Initialize  | Directory created, PLAN drafted            |
| 2026-02-01 | M0 Complete | Bootstrap done, CI passing                 |
| 2026-02-01 | M6 Complete | JSON mode working, TUI exit handlers fixed |
| 2026-02-01 | M7 Complete | All milestones done, CI green              |
