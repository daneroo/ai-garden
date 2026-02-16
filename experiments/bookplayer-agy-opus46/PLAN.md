# bookplayer Plan

## Phase 1: Bootstrap

Scaffold TanStack Start project with Bun + Nitro. Add CI tooling. Replace
scaffold UI with BookPlayer shell. Verify `bun run ci` and `bun run build`.

- [x] Scaffold TanStack Start project (bunx @tanstack/cli create)
- [x] Add CI scripts (fmt, lint, check, test, build)
- [x] Install dev tooling (eslint, prettier, vitest)
- [x] Create .env.example and .env (AUDIOBOOKS_ROOT, VTT_DIR)
- [x] Starter cleanup: replace scaffold UI with BookPlayer shell
- [x] Verify `bun run dev` starts, `/` loads app shell
- [x] Verify `bun run build` succeeds
- [x] `bun run ci` green

## Phase 2: Library Scanner & Indexer

Scan AUDIOBOOKS_ROOT for audiobook directories. Build in-memory manifest.
Validate env vars on startup. Support re-scan.

- [x] Validate AUDIOBOOKS_ROOT and VTT_DIR on startup
- [x] Recursive directory scanner (m4b + cover detection)
- [x] Asset grouping: canonical book records (m4b + cover)
- [x] EPUB and VTT capability flags
- [x] Generate stable bookId (sha1 digest of m4b basename)
- [x] In-memory manifest with scan lock
- [x] Persist cache to `.book-cache.json`; restore on startup
- [x] Server-side timing logs

## Phase 3: Server Endpoints & Media Serving

Media streaming with HTTP Range support. Asset endpoints for cover, audio, epub,
VTT.

- [x] Cover image endpoint (by bookId)
- [x] Audio streaming with HTTP Range / 206 Partial Content
- [x] EPUB file serving
- [x] VTT transcript serving
- [x] Path traversal protections
- [x] Input validation for route params

## Phase 4: Landing Page

Searchable/sortable directory of canonical books with filters.

- [x] Book listing via server function
- [x] Search filter
- [x] Asset filters (EPUB / VTT toggles)
- [x] Pagination
- [x] Asset badges (M4B, EPUB, VTT)
- [x] Loading, error, empty states
- [x] Responsive desktop + mobile layout

## Phase 5: Player Page - Audio & Layout

Player route with audio controls and reader-first layout.

- [x] Player route (`/player/$bookId`)
- [x] Audio player controls (play/pause, seek, skip ±15s/±1m, speed, volume)
- [x] Keyboard transport (arrows ±15s, shift+arrows ±1m, space play/pause)
- [x] Current time / duration display
- [x] Reader-first layout (compact chrome, reader-dominant viewport)
- [x] Responsive stacking for mobile

## Phase 6: EPUB Reader

ePub.js integration with navigation and search.

- [x] Dynamic import of epubjs (client only)
- [x] Render EPUB in bounded iframe container
- [x] Chapter/TOC navigation
- [x] Prev/next page navigation
- [x] Single-column → spread layout at desktop widths
- [x] Location tracking with CFI persistence (localStorage)
- [x] EPUB search (spine iteration, result list, highlight, capped results)
- [x] No-EPUB fallback state

## Phase 7: VTT Transcript

Transcript panel with active cue tracking and click-to-seek.

- [x] Load VTT by matching m4b basename
- [x] Display cue list in transcript strip
- [x] Active cue highlight during playback
- [x] Click cue to seek audio
- [x] Auto-scroll to active cue
- [x] No-transcript fallback state

## Phase 8: Progress & Polish

Persist progress. Final layout budget verification.

- [x] Save/restore audio position per book (localStorage)
- [x] Save/restore EPUB CFI per book
- [x] Persist landing page filter toggles (EPUB/VTT) in localStorage
- [x] Layout budget check (reader 60vh+ desktop, 45vh+ mobile)
- [ ] Metadata extraction (ffprobe with bounded concurrency)
- [ ] Error handling (graceful degradation)
- [ ] Observability (server timing logs)

## Phase 9: Acceptance Validation

Playwright-based visual verification on real data.

- [ ] `/` loads with real library data
- [ ] `/player/$bookId` loads with audio + EPUB + transcript
- [ ] Reader containment check (no iframe overflow)
- [ ] Compact chrome, reader-first viewport dominance
- [ ] Desktop and mobile screenshots
- [ ] Layout budget pass/fail
- [ ] EPUB search regression test (Use Of Weapons → search Dizzy)
- [ ] No local Playwright deps added

## Learnings

- The `src/router.tsx` scaffold gap documented in `BUN_TANSTACK.md` is now fixed
  in `@tanstack/cli` — the file is generated automatically. No manual workaround
  needed.
- Current scaffold uses `@tanstack/eslint-config` (flat config) instead of the
  manual eslint package list in `BUN_TANSTACK.md`. This is simpler and
  sufficient.
- Scaffold now supports `--deployment nitro` and `--toolchain eslint` flags
  directly (no need for `--add-ons nitro`).
- Scaffold includes Tailwind CSS 4, `@tailwindcss/vite`, `vite-tsconfig-paths`,
  `lucide-react`, and `jsdom`+`@testing-library` out of the box.
- TanStack eslint config enforces `Array<T>` over `T[]`, bans unnecessary type
  assertions, and flags async handlers without await. `eslint --fix` handles
  most of these automatically.
- `createServerFn` handlers can be synchronous — no need for `async` unless
  using `await`. The input validation method is `inputValidator`, not
  `validator`.
- TanStack Start Server Routes use `createFileRoute` with `server.handlers`
  property — returns raw `Response` objects, supports `params` for dynamic
  paths. Colocated with UI routes in `src/routes/`.
- API routes under `src/routes/api/$type/$bookId.ts` are 3 directories deep —
  imports need `../../../` not `../../`. Easy to miss.
- `createReadStream` cast to `ReadableStream` works for Bun but needs
  `as unknown as ReadableStream` to satisfy TS.
- Server route handlers can be synchronous (no `async` needed).

## Session Audit Trail

- **S1** (2026-02-16) — Setup + Phase 1
  - Created experiment artifacts (README, AGENTS, PLAN)
  - Scaffolded with `@tanstack/cli` (`--deployment nitro --toolchain eslint`)
  - Aligned scripts to BUN_TANSTACK.md baseline
  - Replaced starter UI with BookPlayer shell (landing + player routes)
  - CI green, build passes
- **S2** (2026-02-16) — Phase 2: Library Scanner & Indexer
  - Created `src/lib/types.ts`, `env.ts`, `scanner.ts`, `index.ts`
  - Created `src/server/library.ts` (fetchLibrary, fetchBook, triggerRescan)
  - Wired landing page to fetchLibrary server function with book grid UI
  - Verified: 882 books discovered in 50ms, cache persistence working
  - CI green
- **S3** (2026-02-16) — Phase 3: Server Endpoints & Media Serving
  - Created `src/server/media.ts` (validation, traversal guard, Range/206)
  - API routes: `/api/cover/$bookId`, `/api/audio/$bookId`, `/api/epub/$bookId`,
    `/api/vtt/$bookId`
  - Curl verified: cover 200 jpeg, audio 206 range, VTT 404 (correct), invalid
    400
  - CI green
- **S4** (2026-02-16) — Phase 4: Landing Page
  - Rebuilt `index.tsx` with search, EPUB/VTT filter toggles, cover images,
    pagination
  - Added `parseBasename()` to extract author/title from m4b naming convention
  - Browser verified: 882 books, covers load, search filters ("tolkien" → 8),
    EPUB filter (526)
  - CI green
- **S5** (2026-02-16) — Phase 5: Player Page
  - Rebuilt `player/$bookId.tsx` with full audio transport controls
  - `<audio>` with Range-backed streaming, play/pause, ±15s/±1m skip, speed
    cycling, volume
  - Keyboard shortcuts: Space (play/pause), ←/→ (±15s), Shift+←/→ (±1m)
  - Cover art sidebar (desktop) / strip (mobile), seek bar, duration display
  - Browser verified on "Use of Weapons" — audio plays, controls work
  - CI green
- **S6** (2026-02-16) — Phase 6: EPUB Reader
  - Created `EpubReader.tsx` with epubjs dynamic import, dark theme, paginated
    flow, responsive spread layout
  - TOC dropdown (book.loaded.navigation), prev/next page navigation
  - CFI persistence via localStorage for per-book reading position
  - Full-text EPUB search: spine iteration, result list (capped at 100),
    highlight active result, range CFI normalization
  - Error handling and no-EPUB fallback state
  - Reader containment: overflow hidden, CSS contain strict
  - Lazy-loaded via React.Suspense in player page
  - Fixed epubjs URL resolution with `openAs: 'epub'` option
  - Browser verified: cover renders, text pages, TOC, navigation, search panel
  - CI green
- **S7** (2026-02-16) — Phase 7: VTT Transcript
  - Created `VttTranscript.tsx` with VTT parsing, cue list, binary-search active
    cue tracking
  - Click-to-seek: clicking any cue seeks audio to that timestamp
  - Auto-scroll to active cue during playback
  - Loading, error, and no-VTT fallback states
  - Lazy-loaded via React.Suspense, receives `currentTime` and `onSeek` props
  - Browser verified: cues load, active highlight tracks playback, click-to-seek
    works
  - CI green
- **S8** (2026-02-16) — Phase 8: Progress & Polish
  - Audio position persistence: debounced save every 2s, restore on load, save
    on unmount
  - EPUB CFI persistence already in place from Phase 6
  - Landing page filter toggles (EPUB/VTT) persisted to localStorage
  - Browser verified: filter state survives reload, audio position restores
  - CI green
