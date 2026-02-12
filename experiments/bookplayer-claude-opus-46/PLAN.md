# bookplayer Plan

## Phase 1: Bootstrap

Scaffold TanStack Start project with Bun, add CI tooling, create experiment
artifacts. Verify `bun run ci` passes.

- [x] Scaffold TanStack Start project
- [x] Add CI scripts (fmt, lint, check, test, build)
- [x] Create experiment artifacts (README, AGENTS, PLAN, LEARNING)
- [x] Remove scaffold boilerplate, replace with bookplayer content
- [x] Create .env from .env.example

## Phase 2: Library Scanner & Indexer

Scan AUDIOBOOKS_ROOT for audiobook directories. Index metadata (title, author,
cover art, chapter files). Expose via server function.

- [x] Scan filesystem for audiobook directories
- [x] Detect audio files, covers, epub/pdf
- [x] Expose via server function (getLibrary)
- [x] Server-side timing logs

## Phase 3: Server Endpoints

Media streaming with HTTP Range support for audio files. Epub file serving.

- [x] Cover image endpoint (Nitro /api/cover, serves cover.jpg by book id)
- [x] Audio streaming with HTTP Range support (Nitro /api/audio)
- [x] Epub file serving (Nitro /api/epub)

## Phase 4: Landing Page

Grid/list view of audiobook library. Cover art, title, author. Click to open
player.

- [x] Grid view with book cards
- [x] Search filter
- [x] Pagination (24 per page)
- [x] Lazy-load covers (native `loading="lazy"` via /api/cover URLs)
- [x] Click tile to navigate to player

## Phase 5: Player Page

Audio playback with controls. Synchronized epub.js reader panel. Chapter
navigation.

- [x] Player route (`/player/$id`)
- [x] Audio playback controls (play/pause, seek, skip +/-30s, time display)
- [x] epub.js reader panel (dynamic import, prev/next page navigation)
- [x] Chapter navigation (TOC dropdown from epub navigation)
- [x] Keyboard shortcuts (Space=play/pause, Left/Right=skip)

## Phase 6: Progress Persistence & Polish

Save/restore playback position. Responsive layout. Keyboard shortcuts.

- [x] Save/restore playback position (localStorage, throttled save every 5s + on pause)
- [x] Responsive layout (flex-col on mobile, flex-row on lg)
- [x] Keyboard shortcuts (done in Phase 5)
