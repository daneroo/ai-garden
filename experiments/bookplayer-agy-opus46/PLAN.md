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

- [ ] Validate AUDIOBOOKS_ROOT and VTT_DIR on startup
- [ ] Recursive directory scanner (m4b + cover detection)
- [ ] Asset grouping: canonical book records (m4b + cover)
- [ ] EPUB and VTT capability flags
- [ ] Generate stable bookId (sha1 digest of m4b basename)
- [ ] In-memory manifest with scan lock
- [ ] Persist cache to `.book-cache.json`; restore on startup
- [ ] Server-side timing logs

## Phase 3: Server Endpoints & Media Serving

Media streaming with HTTP Range support. Asset endpoints for cover, audio, epub,
VTT.

- [ ] Cover image endpoint (by bookId)
- [ ] Audio streaming with HTTP Range / 206 Partial Content
- [ ] EPUB file serving
- [ ] VTT transcript serving
- [ ] Path traversal protections
- [ ] Input validation for route params

## Phase 4: Landing Page

Searchable/sortable directory of canonical books with filters.

- [ ] Book listing via server function
- [ ] Search filter
- [ ] Asset filters (EPUB / VTT toggles)
- [ ] Pagination
- [ ] Asset badges (M4B, EPUB, VTT)
- [ ] Loading, error, empty states
- [ ] Responsive desktop + mobile layout

## Phase 5: Player Page - Audio & Layout

Player route with audio controls and reader-first layout.

- [ ] Player route (`/player/$bookId`)
- [ ] Audio player controls (play/pause, seek, skip ±15s/±1m, speed, volume)
- [ ] Keyboard transport (arrows ±15s, shift+arrows ±1m, space play/pause)
- [ ] Current time / duration display
- [ ] Reader-first layout (compact chrome, reader-dominant viewport)
- [ ] Responsive stacking for mobile

## Phase 6: EPUB Reader

ePub.js integration with navigation and search.

- [ ] Dynamic import of epubjs (client only)
- [ ] Render EPUB in bounded iframe container
- [ ] Chapter/TOC navigation
- [ ] Prev/next page navigation
- [ ] Single-column → spread layout at desktop widths
- [ ] Location tracking with CFI persistence (localStorage)
- [ ] EPUB search (spine iteration, result list, highlight, capped results)
- [ ] No-EPUB fallback state

## Phase 7: VTT Transcript

Transcript panel with active cue tracking and click-to-seek.

- [ ] Load VTT by matching m4b basename
- [ ] Display cue list in transcript strip
- [ ] Active cue highlight during playback
- [ ] Click cue to seek audio
- [ ] Auto-scroll to active cue
- [ ] No-transcript fallback state

## Phase 8: Progress & Polish

Persist progress. Final layout budget verification.

- [ ] Save/restore audio position per book (localStorage)
- [ ] Save/restore EPUB CFI per book
- [ ] Layout budget check (reader 60vh+ desktop, 45vh+ mobile)
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

## Session Audit Trail

- **S1** (2026-02-16) — Setup + Phase 1
  - Created experiment artifacts (README, AGENTS, PLAN)
  - Scaffolded with `@tanstack/cli` (`--deployment nitro --toolchain eslint`)
  - Aligned scripts to BUN_TANSTACK.md baseline
  - Replaced starter UI with BookPlayer shell (landing + player routes)
  - CI green, build passes
