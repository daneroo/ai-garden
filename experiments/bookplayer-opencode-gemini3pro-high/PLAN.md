# Plan (BookPlayer)

## Goal

Build a local-first audiobook/ebook player using Bun and TanStack Start.

## Milestones

- [x] **Phase 1: Project Setup & Bootstrap**
  - [x] Initialize project with `bunx --bun @tanstack/cli create`
  - [x] Create `README.md`, `AGENTS.md`, and `PLAN.md` (done)
  - [x] Configure `package.json` scripts (lint, check, test, fmt, ci)
  - [x] Install dependencies (`epubjs`, tooling)
  - [x] Create `.env` and `.env.example`
  - [x] Verify `bun run ci` and `bun run dev`
  - [x] Create minimal `src/router.tsx` if missing
  - [x] Cleanup starter code (remove `tanstack-*` assets, update title)
  - [x] Validate Nitro Bun preset config

- [x] **Phase 2: Core Data & Server Scanning**
  - [x] Implement `AUDIOBOOKS_ROOT` and `VTT_DIR` validation
  - [x] Implement recursive filesystem scanner (`.m4b` + `cover` required, `.epub` optional)
  - [x] Implement metadata extraction (duration, bitrate, etc.)
  - [x] Create in-memory manifest/index
  - [x] Create server endpoints: List books, Get book details

- [x] **Phase 3: Landing Page UI (`/`)**
  - [x] Build layout shell (header, main content)
  - [x] Implement book list/grid view
  - [x] Add search/filter functionality
  - [x] Add sorting (Title, Author, Duration)
  - [x] Handle empty/loading/error states
  - [x] **Verification**: Playwright checks for `/`

- [x] **Performance Optimization (Added)**
  - [x] **Decision**: Implement concurrency control (single scan) and file-based metadata cache.
  - [x] **Strategy**: Use `p-limit` for bounded concurrency (default: 8) and persist cache to `.book-cache.json`.
  - [x] Refactor `scanner.ts` to accept cache and use `p-limit`.
  - [x] Refactor `db.ts` to manage cache file and single-scan lock.

- [x] **Phase 4: Player Page Logic & Assets**
  - [x] Create `/player/$bookId` route
  - [x] Implement asset serving (audio range requests, EPUB files)
  - [x] Implement VTT transcript parsing/serving
  - [x] Implement Audio Player logic (HTML5 Audio, seek, speed)
  - [x] Implement EPUB Reader logic (epub.js, rendering, navigation)

- [x] **Phase 5: Player UI & Integration**
  - [x] Build Player UI (Split view: Reader + Transcript + Controls)
  - [x] Implement Audio controls (Play/Pause, Seek, Skip, Speed)
  - [x] Implement Reader controls (Next/Prev, TOC)
  - [x] Implement Transcript sync (highlight active cue, click to seek)
  - [x] **Verification**: Playwright checks for `/player/$bookId` (layout, interaction)

- [x] **Phase 6: Search & Persistence**
  - [x] Implement EPUB full-text search
  - [x] Persist progress (audio time, EPUB CFI) to `localStorage`
  - [x] Restore progress on book load

- [ ] **Phase 7: Refinement & Polish**
  - [ ] styling refinement (Dark mode, responsiveness)
  - [ ] Performance optimization (virtualization if needed)
  - [ ] Final CI/CD run

## Technical Decisions & Learnings

### Scanner Performance Optimization

To address performance issues with scanning large libraries (800+ books), we implemented a two-pronged strategy:

1.  **Concurrency Control (The "Lock")**:
    - Implemented a `isScanning` flag in the singleton `Database` class.
    - Requests to `scanLibraryFn` are dropped if a scan is already active.
    - This prevents multiple UI clients or rapid refreshes from spawning parallel scanning jobs that would thrash the disk.

2.  **Parallelism (The "Accelerator")**:
    - Used `p-limit` to restrict the number of concurrent `ffprobe` processes to 8.
    - This ensures we use available CPU/IO bandwidth efficiently without saturating the system with hundreds of subprocesses.

3.  **Caching**:
    - Metadata is cached in `.book-cache.json`.
    - Cache invalidation is based on file `mtime` and `size`.
    - Subsequent scans of unchanged files are near-instant (<1s).

### Mistakes & Forbidden Actions

- **Forbidden**: Installing a local copy of Playwright (or other tools) when a corresponding Agent Tool is available in the environment. Always check `opencode mcp list` or available tools before installing dev dependencies that duplicate functionality.
- **Correction**: I failed to utilize the provided `playwright` MCP tool and instead installed `@playwright/test` locally. This was a violation of the environment capabilities. Future agents must use the provided tools.

## Session Audit Trail

- [x] Session Start: Created project structure.
- [x] Phase 2: Refined scanner to require cover images and make EPUB optional.
- [x] Phase 3: Completed Landing Page UI.
- [x] Performance: Added `p-limit` and file-based caching for scanner.
- [x] Phase 4: Implemented Player basics (VTT, Audio, EPUB rendering).
- [x] Phase 5: Refined Player UI, added specific seek controls, verified with Playwright (fixture env).
