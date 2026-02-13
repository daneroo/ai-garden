# Learning / Retrospective

## Overall Verdict: THIS DID NOT GO WELL AT ALL

Burned an entire session's tokens (93%+) and the app still hasn't been visually verified. Root causes:

- **Reinvented instead of asking**: built 3 custom Nitro API handlers when a symlink to `public/` was the obvious answer. Wasted massive effort on something that should have been 1 line.
- **Dodged the browser tool question repeatedly**: user asked multiple times "can't you see what you're building?" — should have immediately said "I don't have a browser tool, let's install Playwright MCP" instead of deflecting and continuing blind.
- **Token waste compounds**: every wrong approach (base64 covers, Nitro API routes, diving into internals) burned tokens that could have been spent on actual features. Prevention > cure.
- **Lesson**: when you don't have a capability, SAY SO IMMEDIATELY. Don't dodge, don't work around it, don't hope the user stops asking. One honest answer early saves an entire session.

## Bootstrap Phase Failures

- Wasted more than 70% of effort making TanStack Start starter work, failed to use docs tools, did not clean up after starter generator
- Left the entire scaffold landing page as-is (TanStack demo garbage) — should have replaced all boilerplate immediately
- Didn't create `.env` from `.env.example` — obvious step, completely missed
- Hardcoded a "no books found" message instead of actually wiring up the filesystem scanner
- Tried a nonexistent API (`createAPIFileRoute`) without checking the installed package version first
- No way of testing web pages — must fix (e.g. playwright, curl, screenshot tool)
- Landing page loads all books with inline base64 covers in one payload — way too slow, needs search or pagination
- Web app is completely unresponsive as a result
- Every book directory already has a cover.jpg — serve those via an endpoint, don't inline base64 into the JSON response
- No server-side logging for slow operations — no traces, no timing, no explanation of slow reads. Always log timing for I/O-heavy operations (scan, cover loads) so performance issues are visible in the server console
- PLAN.md should use checkboxes (`- [x]` / `- [ ]`) so progress is visible at a glance — don't use prose "Status: complete"
- Update PLAN.md checkboxes as work progresses so user can track without asking — don't wait until the end
- epubjs defaults to iframe rendering — must pass InlineView class to renderTo() for direct DOM rendering. Read the source/docs BEFORE using a library, not after
- Need to talk to epub programmatically (display CFI, navigate chapters, get TOC via book.navigation.toc, track location via rendition events)
- USE DOCS TOOLS (Context7, WebFetch) to read library documentation before coding — don't guess APIs from memory

## API Route Fiasco

- Built three Nitro `server/api/` handlers (cover, audio, epub) — all returned 404
- Instead of reading TanStack Start docs to understand API routes, dove deep into Nitro internals debugging `scanDirs` — total waste
- This is the SAME failure pattern as the bootstrap: ignoring docs, guessing APIs
- The correct solution was obvious: symlink AUDIOBOOKS_ROOT into `public/` and serve static assets directly via Vite — no API routes needed at all
- Static serving is faster, simpler, zero custom code for file serving
- Lesson: before building infrastructure, ask "can I just serve files statically?"

## epub.js Iframe Decision

- epubjs only supports iframe rendering (InlineView is dead code, not exported)
- Iframe is acceptable IF we can control navigation and DOM
- epubjs provides: `rendition.display(href)`, `.next()`, `.prev()`, `rendition.on('relocated', ...)`
- For highlighting: `rendition.annotations.highlight(cfiRange, {}, callback)` — works through the iframe
- Iframe approach is adequate — navigation control + annotation/highlighting API both work

## Web Testing Gap

- Built an entire web app without ever viewing it in a browser — no visual verification at any point
- Claude Code has NO built-in browser tool — cannot see, screenshot, or interact with web pages
- curl only catches HTTP status codes and HTML content, not rendering, layout, or JS behavior
- **Fix**: install a browser MCP server (e.g. `@anthropic/mcp-playwright`, `browser-tools-mcp`) so Claude Code can launch a browser, take screenshots, click elements, and verify the UI
- This MUST be set up before building any more web UI — flying blind is unacceptable
- Should have asked for this on day 1 instead of shipping untested UI across 6 phases

## Audiobookshelf & epubjs

[Audiobookshelf](https://github.com/advplyr/audiobookshelf) is a well-maintained self-hosted audiobook/podcast server that also uses epubjs v0.3.93. Their approach:

- **No fork** — they use the stock npm package + [patch-package](https://github.com/advplyr/audiobookshelf/pull/4548) for targeted fixes
- **Known patch**: fixes CFI navigation (scrollBy → scrollTo in continuous manager) for bookmarks, highlights, reading position sync
- **Same pain**: maintainer acknowledges "issues with the 3rd party epubjs library" but "a better one hasn't been found yet" ([discussion #2029](https://github.com/advplyr/audiobookshelf/discussions/2029))
- **Takeaway**: patch-package is the pragmatic path for epubjs fixes. No need to fork. Watch audiobookshelf's patches for fixes we can reuse.

## epub.js Setup Summary

Chose epubjs (v0.3.93) for epub rendering. Key decisions and findings:

- **Rendering**: epubjs only supports iframe-based rendering in practice. An InlineView class exists in the source but is not exported or wired up — it's dead code. The iframe approach is the only supported path.
- **Dynamic import**: epubjs is loaded via `import('epubjs')` to avoid SSR issues (it needs `window`/DOM). This also code-splits it out of the main bundle (~351KB client chunk).
- **TOC**: Accessed via `book.loaded.navigation` promise, which returns `nav.toc` — an array of `{label, href}` items. Rendered as a dropdown on the player page.
- **Navigation**: `rendition.display(href)` to jump to a chapter, `rendition.next()`/`prev()` for page-by-page, `rendition.on('relocated', ...)` to track current position.
- **Limitation**: No audio-epub synchronization yet. Audio and epub are independent — user manually navigates each. Syncing would require SMIL or a custom chapter-to-timestamp mapping.
- **Risk**: epubjs is unmaintained (last release 2019, v0.3.93). If iframe rendering becomes a blocker, alternatives include Readium or a custom EPUB parser.

## Visual Design & Color Scheme

Dark theme built entirely with Tailwind's `slate` palette — no custom colors, no CSS variables, no theme config. The slate grays have a subtle blue undertone that reads as professional rather than flat.

**Palette hierarchy:**
- `bg-slate-900` — page background (both landing and player)
- `bg-slate-800` — elevated surfaces: cards, player bar, buttons, search input, dropdowns
- `bg-slate-700` — interactive states: active cue, current chapter, play button, placeholder covers
- `border-slate-700` — dividers between sections (header, transcript, player bar)
- `border-slate-600` — input borders, dropdown borders (slightly brighter for affordance)
- `text-white` — primary text (titles, active content)
- `text-slate-300` — secondary text (chapter list, search results, filter labels)
- `text-slate-400` — tertiary text (skip buttons, timestamps, book badges, hover targets)
- `text-slate-500` — de-emphasized (book count, time display, "no results")

**Key decisions:**
- White epub reader (`bg-white rounded-lg`) contrasts sharply against the dark shell — draws the eye to the reading area
- Cover art on landing page uses `aspect-square object-cover` for uniform grid regardless of source image dimensions
- `hover:border-slate-500` on book cards gives subtle lift on hover without color shift
- `tabular-nums` on all time displays prevents layout jitter as digits change
- `transition-colors` on cards for smooth hover; no transitions elsewhere (snappy feel)
- `accent-slate-400` on checkboxes and range slider keeps controls in-palette
- Dropdowns (chapters, search) use `shadow-lg` + `z-10` to float above the epub iframe

## Player Page Layout

The player page uses a vertical stack that fills the viewport (`h-screen flex flex-col overflow-hidden`):

```
+--------------------------------------------------+
| Header: ← Library | Book Title            shrink-0|
+--------------------------------------------------+
|                                                    |
|  Epub Reader (flex-1, max-w-4xl, centered)         |
|  - Chapters dropdown | Search dropdown             |
|  - Two-column spread (spread: 'auto') at desktop   |
|  - White bg, rounded-lg, paginated flow             |
|  - ← Prev / Next → buttons below                   |
|                                                    |
+--------------------------------------------------+
| VTT Transcript (if available)           max-h-28  |
| - Scrollable cue list, auto-scrolls to active cue |
| - Click cue to seek audio                          |
+--------------------------------------------------+
| Audio Player Bar                        shrink-0  |
| [cover 40px] [-30s] [▶] [+30s] [0:00 ===== 8:00] |
+--------------------------------------------------+
```

Key design decisions:
- `h-screen` + `overflow-hidden` on the root prevents page scroll — the epub reader handles its own pagination
- `flex-1` on the epub main area means it gets all remaining vertical space after header, transcript, and player bar
- Player bar is `shrink-0` so it never collapses — always visible at the bottom
- VTT transcript sits between epub and player, `max-h-28` with `overflow-y-auto` so it scrolls independently
- `max-w-4xl mx-auto` constrains both the epub container and the player bar to the same centered width
- Album art in player bar is small (`w-10 h-10`) to keep the bar compact
- `spread: 'auto'` on epubjs gives two-column layout at desktop width, single column on narrow screens

## epub.js Full-Text Search

epubjs has a built-in `Section.find(query)` method that searches text within a single spine item. To search the whole book, iterate over all spine items:

```js
async function doSearch(book, query) {
  await book.ready
  const results = await Promise.all(
    book.spine.spineItems.map(item =>
      item.load(book.load.bind(book))
        .then(item.find.bind(item, query))
        .finally(item.unload.bind(item))
    )
  )
  return [].concat(...results) // [{cfi, excerpt}, ...]
}
```

- Each result has `{cfi, excerpt}` — use `rendition.display(cfi)` to navigate to the match
- The search loads/unloads each spine item sequentially, so it's not instant on large books but acceptable
- Case sensitivity appears to depend on the epub content — test with your specific books
- Must hold a ref to the `Book` object (not just `Rendition`) since search needs `book.spine` and `book.load`
- Cap results (e.g. `.slice(0, 100)`) to avoid flooding the UI on common words

### Highlighting Search Results via CFI

The CFI ranges returned by `Section.find()` work directly with `rendition.annotations.highlight()`. This means search result navigation and highlighting are a natural pair:

```js
// Navigate to the CFI, then highlight it
rendition.display(cfi).then(() => {
  rendition.annotations.highlight(cfi, {}, () => {}, '', {
    fill: 'rgba(255, 200, 0, 0.5)',
    'fill-opacity': '0.5',
    'mix-blend-mode': 'multiply',
  })
})
```

- The CFI from `find()` is a range (start,end), not a point — so it highlights the matched text, not just a cursor position
- `rendition.annotations.remove(cfi, 'highlight')` clears a specific highlight — track the active CFI in a ref and remove it before adding a new one
- Styles are SVG attributes (epubjs renders highlights as SVG overlays inside the iframe), so use `fill` and `fill-opacity`, not CSS `background-color`
- The highlight persists across page navigation within the same spine item but is naturally cleared when the rendition is destroyed (e.g. navigating away from the player)

### E2E Search Test (validated with Playwright)

Great manual regression test: Home -> search "Use of Weapons" -> open "Iain M. Banks - Culture 03 - Use Of Weapons" -> epub Search "Dizzy" -> 12 results -> click first result -> navigates to Chapter One where the drone Skaffen-Amtiskaw calls Sma "Dizzy". Two-column spread renders correctly, CFI navigation lands on the right passage, and "Dizzy" is highlighted in yellow. This exercises: library search, book loading, epub init, full-text spine search, CFI-based navigation, and CFI-based annotation highlighting.

## VTT Transcript Integration

VTT (WebVTT) files are whisper transcriptions generated by `bun-one/apps/whisper`. They live in a separate directory (`VTT_DIR`), not alongside the audiobook files.

### Directory & Filename Convention

- `VTT_DIR` is set in `.env` (e.g., `../../bun-one/apps/whisper/data/output/`)
- VTT filenames match the audio filename exactly, with `.vtt` replacing the audio extension
  - Audio: `Iain M. Banks - Culture 03 - Use Of Weapons.m4b`
  - VTT: `Iain M. Banks - Culture 03 - Use Of Weapons.vtt`

### Serving

VTT_DIR is served as a Nitro `publicAsset` at `/vtt/`, same pattern as audiobooks:

```typescript
// vite.config.ts
const vttDir = process.env.VTT_DIR || '/tmp/no-vtt'
// ... nitro({ publicAssets: [..., { dir: vttDir, baseURL: '/vtt', maxAge: 86400 }] })
```

The player constructs the URL as `/vtt/${encodeURIComponent(book.vttFile)}`.

### Scanner Matching

`scanLibrary(root, vttDir)` reads the VTT_DIR once, builds a `Set<string>` of `.vtt` filenames, then matches each book by stripping the audio file extension and checking for `${base}.vtt`. This avoids per-book filesystem checks.

### VttTranscript Component

- `parseVtt(raw)` splits on blank lines, extracts timestamp ranges (`HH:MM:SS,mmm --> HH:MM:SS,mmm`), and collects cue text
- Renders a scrollable strip (`max-h-28`) between the epub reader and the audio player bar
- Active cue (matching `currentTime`) is highlighted and auto-scrolled into view
- Clicking a cue seeks the audio to that cue's start time

## Landing Page Filters

The library landing page has two checkbox filters next to the search bar: **EPUB** and **VTT**, both defaulting to checked. This filters the 882-book library down to the ~20 books that have all three assets (audio + epub + vtt transcript), which are the ones worth reading in the player.

- Filters compose: EPUB checked + VTT checked = only books with both
- Unchecking VTT shows all 546 books with epubs
- Unchecking both shows the full 882-book library
- BookCard badges show "M4B + EPUB + VTT" so you can see at a glance what each book has
- Filters reset pagination to page 0 to avoid showing an empty page

## Audio Seeking & Range Requests

Nitro's `publicAssets` does not support HTTP Range requests — it returns `200 OK` for all requests, even when the browser sends a `Range` header. Browsers need `206 Partial Content` + `Accept-Ranges: bytes` to seek in audio/video files. Without it, `audio.currentTime = X` silently fails (stays at 0), so skip buttons, scrubbing, and click-to-seek from VTT cues all break.

**Workaround**: a `serveWithRange` Vite plugin in `vite.config.ts` that intercepts `/audiobooks/` requests before Nitro and serves files with proper Range support. It's ~40 lines of standard Node `createReadStream({ start, end })` with `206`/`Content-Range` headers.

**TODO**: investigate whether Nitro has a built-in way to enable Range support on `publicAssets` (e.g. a config flag, middleware, or a newer Nitro version fix). The custom plugin works but is a workaround — a native Nitro solution would be cleaner.

## Audio Transport Controls

Player bar has four skip buttons: `-1m`, `-15s`, `+15s`, `+1m`. Keyboard: arrow keys = 15s, shift+arrow = 1m. Single `skip(seconds)` function handles all cases.

## Possible Refactor: Native `<track>` for VTT

Current approach: fetch VTT, regex-parse into cue array, linear-scan for active cue on every `timeupdate` render. Works but is all custom code.

The web platform already handles this: `<track kind="subtitles" src="..." default>` on the `<audio>` element lets the browser parse VTT asynchronously, expose cues via `TextTrack.cues`, and fire `cuechange` events only when the active cue changes. `track.mode = "hidden"` makes cues accessible to JS without rendering browser-native subtitles.

Advantages over our approach:
- **Async loading** — browser fetches and parses VTT in the background, no blocking fetch+parse in a useEffect
- **`cuechange` event** — fires only on cue transitions (O(1) per change), vs our linear scan on every `timeupdate` (~4/sec)
- **No custom parser** — eliminates `parseVtt()` regex, delegates to browser's spec-compliant parser
- **Hook extraction** — audio state (`currentTime`, `duration`, `paused`, `activeCue`, `seek`) moves into a `useAudioWithVtt` hook, thinning the player component

Not prioritized because current approach works and the refactor adds no user-facing value. Consider if `$id.tsx` grows further or if VTT performance becomes an issue with very large transcript files.
