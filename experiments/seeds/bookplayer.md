# bookplayer Requirements

Local-first web app for browsing audiobook directories (with optional ebook and
transcripts) and reading while listening.

## Workflow / CI

- Each experiment created from this seed should include a local `AGENTS.md`.
- Each experiment should include a `PLAN.md` with milestones and a Session Audit
  Trail.
- That `AGENTS.md` should instruct the agent to run `bun run ci` after
  completing a meaningful task/phase, and to fix failures before proceeding.
- That `AGENTS.md` should explicitly require this loop after modifications:
  - run `bun run ci`
  - if `fmt:check` fails, run `bun run fmt`, then rerun `bun run ci`
  - do not mark phase complete until CI is green
- For UI/layout phases, `AGENTS.md` must require Playwright-based visual
  verification before phase completion.
- Dependencies must be added with `bun add` / `bun add -d` (never by editing
  `package.json` directly).
- That `AGENTS.md` should explicitly instruct the implementation agent to use
  available MCP/doc tools to validate current framework details before coding.
- During scaffold generation, copy relevant guidance from
  `experiments/BUN_TANSTACK.md` and `experiments/STYLING.md` into the local
  experiment `AGENTS.md`.
- Generated `AGENTS.md` must be self-contained for ongoing implementation (agent
  should not need to read files outside the active experiment directory).
- Validation requirement for scaffold-sensitive details (scripts/dependencies):
  - Query latest TanStack Start docs first (prefer Context7 when available).
  - Then verify by running scaffold CLI help locally and reading generated
    `package.json`.
  - If docs and CLI output conflict, follow current CLI output.
  - Treat scaffold output as source of truth for framework versions/scripts.

### Agent Preflight (Required in generated `AGENTS.md`)

- At session start, the implementation agent must explicitly state available
  capabilities:
  - docs tooling (Context7/WebFetch equivalents)
  - browser automation/screenshot tooling (Playwright MCP or equivalent)
- If browser tooling is unavailable, the agent must say so immediately and must
  not claim visual verification.
- If browser tooling is required but missing, the agent should request setup
  early instead of continuing blind on UI-heavy phases.
- For framework-specific APIs (TanStack Start routes/server behavior), the agent
  must check docs before implementation and record what was validated.

### Playwright MCP Enforcement (Hard Requirement in generated `AGENTS.md`)

- If Playwright MCP is connected, browser verification MUST use MCP Playwright
  tools.
- Do not install project-local Playwright tooling as a substitute.
- Forbidden unless user explicitly requests it:
  - `bun add playwright`
  - `bun add -d @playwright/test`
  - `npx playwright install`
  - adding Playwright config/scaffolding only to replace MCP screenshots
- If Playwright MCP is unavailable, pause UI/layout completion and report a
  blocker requesting MCP setup.

### Plan Tracking (Required in generated `PLAN.md`)

- Use checkbox milestones (`- [ ]` / `- [x]`) for each phase.
- Update checkbox status continuously during execution (not only at the end).

### Browser Usability Verification (Required in generated `AGENTS.md`)

- Do not claim UI/layout completion without Playwright checks on both routes:
  - `/`
  - `/player/$bookId`
- Validate both desktop and mobile viewport behavior.
- Validate with real configured roots (`AUDIOBOOKS_ROOT`, `VTT_DIR`), not only
  fixture/demo data.
- Record screenshot paths and explicit pass/fail notes in the session output.
- Include a verification note that no local Playwright dependencies were added
  to `package.json` unless explicitly requested by the user.

### Reference Locality

- Shared docs in `experiments/*.md` are source material for scaffolding.
- Ongoing implementation guidance must live inside `<slug>-<variant>/AGENTS.md`
  and `<slug>-<variant>/PLAN.md`.

## Tech Stack / Runtime

- **Bun** must be used as the runtime and package manager (not Node.js).
- Use **TanStack Start** for the web app framework and routing.
- Use **Nitro** hosting integration per `experiments/BUN_TANSTACK.md`.
- Use **TypeScript** for all application code.
- The app is local-first and single-user by default (no auth required in v1).

## Project Bootstrap

- Reuse canonical bootstrap/setup from `experiments/BUN_TANSTACK.md`.
- Use the preferred single-line create command from that doc.
- Apply its starter cleanup checklist before feature work.
- Then add project-specific packages with `bun add` (for example `epubjs`).
- Replace scaffold/demo UI in the first implementation phase with BookPlayer
  shell:
  - app title/header says `BookPlayer`
  - `/` route exists and is wired to real server data flow (no fake placeholder)
  - `/player/$bookId` route exists with placeholder layout for audio + reader
- Create `.env` from `.env.example` during bootstrap.
- Bootstrap must be tested immediately after scaffolding:
  - `bun run dev` starts successfully
  - browser check confirms `/` loads and is not the default scaffold page
  - `bun run build` succeeds
  - verify Nitro Bun preset wiring per `experiments/BUN_TANSTACK.md`

## Environment Configuration

- Library root must be configurable via environment variable:
  - `AUDIOBOOKS_ROOT=/Volumes/Space/Reading/audiobooks/`
- Transcript root must be configurable via environment variable:
  - `VTT_DIR=../../bun-one/apps/whisper/data/output/`
- Require both:
  - `.env` for local machine configuration (gitignored)
  - `.env.example` with documented required keys
- Example `.env.example`:

```dotenv
AUDIOBOOKS_ROOT=/Volumes/Space/Reading/audiobooks/
VTT_DIR=../../bun-one/apps/whisper/data/output/
```

- On startup, validate `AUDIOBOOKS_ROOT`:
  - exists
  - is a directory
  - is readable
- Validate `VTT_DIR` with the same checks.
- Fail fast with a clear startup error if invalid.

## App Interface

- App has two main pages:
  - `/` landing page: directory of canonical audiobook book records
  - `/player/$bookId` player page: audiobook player + embedded ebook reader
- Mobile and desktop layouts must both be usable and tested.

## Library Source

- Default model: app scans a configured local library root directory.
- Recursively traverse all nested directories under `AUDIOBOOKS_ROOT`.
- Expected book-directory invariant:
  - required: one `.m4b`
  - required: `cover.jpg` or `cover.png`
  - optional: `.epub`
- Transcript files: `.vtt` from `VTT_DIR` (not colocated with audiobook files).
- In this library, book directories are always leaf directories; scanner should
  still recurse safely.
- Cover selection precedence: prefer `cover.jpg`; fallback to `cover.png`.
- Hidden files/directories must be skipped.
- Invalid/corrupt files should not crash app startup; they should be skipped
  with warnings.

## Asset Grouping Rules

- Primary strategy (required): folder-based grouping (ebook and audio in same
  book folder).
- Canonical book record requirement:
  - `.m4b` present
  - `cover.jpg` or `cover.png` present
- EPUB and VTT are capability flags on top of canonical book records (not
  required for a book to be listed).
- Orphan assets without `.m4b` must not appear in main results.
- Canonical source key is always the `.m4b` basename (without extension).
- Public URL id must be a short digest of normalized `.m4b` basename (for
  cleaner/stable URLs), for example `sha1(basename).slice(0, 12)`.
- Keep original `.m4b` basename in metadata for diagnostics and VTT matching.
- Basename consistency check: `.m4b` and `.epub` basenames are expected to
  match; when they do not, still group by folder but log a warning for upstream
  cleanup.

## Landing Page (`/`)

- Show a searchable/sortable directory of canonical books.
- Listing policy is filter-driven (not hardcoded EPUB-only inclusion).
- Minimum displayed fields:
  - Title
  - Author (when available)
  - Total audio duration
  - Last progress (show `Not started` when no progress exists)
  - Clickable title/name entry that opens `/player/$bookId`
- Include empty state guidance when no books are found.
- Include loading and error states while scanning/indexing library.
- Include asset filters near search:
  - `EPUB` toggle (default on)
  - `VTT` toggle (default on)
- Filters must compose and reset pagination to page 0 when changed.
- Filter behavior:
  - both checked: show books with EPUB and VTT
  - only `EPUB`: show books with EPUB
  - only `VTT`: show books with VTT
  - both unchecked: show all canonical books (`.m4b` + cover)
- Show compact asset badges in list/cards (for example `M4B`, `EPUB`, `VTT`).

## Player Page (`/player/$bookId`)

- Must render both:
  - Audiobook player panel
  - Embedded ebook reader panel (ePub.js)
- Reader and player should be visible together on desktop.
- On mobile, reader/player can stack or use tabs, but both must remain easily
  accessible.
- Always render a transcript strip between reader and player.
- If no matching VTT exists for a book, show an empty/"no transcript" state in
  that strip.
- Recommended shell behavior:
  - `h-screen` root with `flex` column layout
  - fixed header and player bar (`shrink-0`)
  - reader area consumes remaining space (`flex-1`)
  - transcript strip has capped height with independent scroll
- Reader-first UX is non-negotiable: reading viewport must be visually dominant
  over control chrome.
- Keep header/transcript/player chrome compact; avoid high-footprint side panels
  unless explicitly requested.
- Remove starter/demo branding from player surfaces.

### Player Layout Budget (Hard Requirement)

- Reader(epub) content must be the primary visible surface on the player page.
- Full-cover art must never become the dominant player-page surface; cover art
  is limited to compact thumbnail use in player controls.
- Chrome must stay compact and single-row where possible:
  - header and player controls should not consume multi-row vertical space by
    default
  - transcript strip should use capped height and scrolling (not expand to push
    reader off-screen)
  - combined non-reader chrome should typically stay in the `25vh-35vh` range
    across desktop/mobile
- Keep chrome footprint roughly stable across desktop/mobile (do not let mobile
  breakpoints inflate header/player/transcript heights by default).
- Reader viewport targets (calibrated from validated reader-first layout):
  - desktop target: reader around `60vh+` (hard fail below `50vh`)
  - mobile target: reader around `45vh+` (hard fail below `38vh`)
- Use these as usability guardrails, not pixel-perfect design locks.
- Avoid floating utility panels over reader content unless explicitly requested.

### Reader Containment (Hard Requirement)

- The ePub reader wrapper must clip overflow and remain bounded within its
  panel.
- Reader wrapper must use explicit containment (`overflow: hidden`, bounded
  height, and width constraints).
- The epub.js iframe and internal containers must not bleed into
  header/transcript/player regions.
- No overlap between reader surface and persistent controls at any viewport
  size.

### Audio Player Controls

- Required controls:
  - Play/pause
  - Seek scrubber
  - Jump backward 1m
  - Jump backward 15s
  - Jump forward 15s
  - Jump forward 1m
  - Playback speed selector (0.75x to 2.0x)
  - Volume control
- Use explicit transport labels in UI: `-1m`, `-15s`, `+15s`, `+1m`.
- Show current time and total duration.
- If audio is composed of multiple files, support seamless next-track
  progression.
- Keyboard transport:
  - Left/right arrows seek 15s
  - Shift+left/right seek 1m

### Ebook Reader (ePub.js)

- Use ePub.js to render `.epub` content in the player page.
- If a book has no `.epub`, keep player route usable and show explicit no-ebook
  reader state.
- Load `epubjs` via dynamic import in client code to avoid SSR/runtime issues.
- Support basic navigation (next/previous section or page).
- Support chapter/TOC navigation (`book.loaded.navigation` / `toc`).
- Reader flow should be single-column on narrower widths and transition to
  spread/two-page layout around desktop widths (roughly `840px+`) where
  supported by epub.js rendition settings.
- Prefer named Tailwind breakpoints (`sm`/`md`/`lg`) where feasible; use a
  custom breakpoint only when needed to hit reader spread behavior.
- Track location with rendition relocation events and persist per-book CFI.
- Preserve reader location between sessions for each book.
- Handle unreadable EPUB errors with a clear fallback UI message.
- Assume iframe-based rendering as the supported default path.

### EPUB Search (Required)

- Support full-text EPUB search by iterating spine items and using
  `Section.find(query)`.
- Treat search flow as async/promise-aware (`load/find/unload` per section) and
  guard malformed/empty section results.
- Search results should navigate with `rendition.display(cfi)`.
- Normalize range CFIs to start-point CFIs before display navigation when
  needed.
- Highlight selected result using `rendition.annotations.highlight(cfi, ...)`.
- Remove previous active highlight before applying a new search-result
  highlight.
- Cap result count (for example 100) to avoid UI overload on common terms.
- Provide clear empty-query and no-results states.
- Search UX must be visible/actionable (result count + selectable result list),
  not only background state updates.

## Sync and Progress

- v1 does not require sentence-level or word-level sync.
- Persist per-book progress locally:
  - Audio playback position
  - EPUB location/CFI
- Persist in browser storage by default (`localStorage`), keyed by `bookId`.

## VTT Transcript

- Transcript UI/panel is required on player page.
- When a matching VTT exists, load and show transcript cues.
- When VTT is missing, keep panel visible with a clear no-transcript state.
- Cue interactions:
  - active cue highlights while audio plays
  - clicking a cue seeks audio to cue start time
  - transcript auto-scrolls to keep active cue visible
- VTT matching convention:
  - use audio basename + `.vtt` in `VTT_DIR`
  - example: `My Book.m4b` -> `My Book.vtt`

## Server/Data Endpoints (TanStack Start)

- Provide server-side endpoints/functions for:
  - Listing canonical books
  - Fetching details for one book by id
  - Providing client-accessible URLs for audio, EPUB, cover, and transcript
    assets
- Asset-serving architecture is implementation-defined (for example static
  mapping/mount or route handlers) as long as runtime and security requirements
  below are met.
- Input validation is required for route params and query params.
- Return structured error payloads for not-found and invalid id cases.
- Before building full media endpoints, implement one minimal proof endpoint and
  verify it works in the installed TanStack Start version.

## Indexing and Refresh Model

- Indexing is runtime behavior (not compile-time and not build-time).
- On server start, perform a filesystem scan of `AUDIOBOOKS_ROOT` to discover
  canonical book records (`.m4b` + cover) and optional EPUB capability.
- Keep an in-memory manifest/index for fast route responses.
- Enforce a single active scan at a time (scan lock); overlapping refresh
  requests should be coalesced or rejected with a clear in-progress status.
- Support explicit re-scan at runtime (manual refresh endpoint/button).
- Persist cache to a local data file (for example `.book-cache.json`), restore
  on startup, then revalidate in background.
- Cache invalidation should use file fingerprint checks (relative path + mtime +
  size).

### Media Serving Strategy

- Do not expose absolute filesystem paths to the client.
- Use `bookId` values from the runtime manifest/index to resolve files
  server-side.
- Audio serving must return proper range semantics for seek:
  - `206 Partial Content` for range requests
  - `Accept-Ranges: bytes` and `Content-Range` headers
- Rationale: native browser audio playback relies on byte-range requests for
  efficient seek/scrub behavior.
- Validate seek behavior in browser (timeline drag, skip buttons, cue-click
  seek).
- Avoid `ERR_CONTENT_LENGTH_MISMATCH` on route-served assets; non-range EPUB
  responses must return consistent content length and complete payload bytes.
- Cover images must be served by URL endpoint/path, not embedded as base64 in
  directory JSON payloads.
- Keep listing responses lightweight; do not inline binary assets.
- Keep path traversal protections strict (`..`, symlink escape, non-root files).
- Do not copy mutable media libraries into build artifacts; resolve assets at
  runtime from configured roots.

## Metadata Extraction

- Metadata source priority:
  - `metadata.json` in book directory when present and valid
  - fallback to `ffprobe` for `.m4b`
- Metadata extraction can run sequentially by default for simplicity.
- Phase 2 requirement: add bounded-concurrency ffprobe workers (documented
  default, for example `8`) after baseline correctness is verified.
- Prefer a standard limiter utility (for example `p-limit`) for bounded
  ffprobe concurrency.
- For large libraries, directory results should not block on full metadata
  extraction; show partial rows and update as metadata resolves.
- Cache extracted metadata server-side (memory + persisted data file) and only
  recompute when file fingerprint changes.

### Required Metadata Fields

Extract or derive:

- Duration: (seconds, formatted as `HH:MM:SS` in table output)
- Bitrate: (kbps)
- Codec: (audio codec name)
- Title tag: (if present) - maps to book title
- Artist tag: (if present) - maps to author
- File path: (relative to `AUDIOBOOKS_ROOT`)
- File size

## Performance / UX

- Directory page should remain responsive with large libraries (800+ books).
- Use incremental loading, pagination, or virtualization as needed.
- Use optimistic UI only where state consistency is safe.
- Do not fetch heavy metadata/cover bytes for all rows in one initial payload.
- Keyboard accessibility:
  - Space toggles play/pause when player is focused
  - Left/right arrows seek when timeline is focused
  - Shift+left/right perform larger seek jumps

## Observability

- Add server-side timing logs for expensive operations:
  - filesystem scan
  - metadata extraction
  - cover/media lookup
- Log record counts and elapsed time so performance regressions are visible.

## Error Handling

- Continue rendering usable UI when one subsystem fails (audio or reader).
- Show actionable error messages (file missing, unsupported format, parse
  failure).
- Log technical details to console/server logs without exposing sensitive paths
  in user-facing messages.

## package.json Scripts

- Follow runtime script baseline from `experiments/BUN_TANSTACK.md`.
- Ensure the project also has:
  - `lint`: `eslint .`
  - `check`: `tsc --noEmit`
  - `test`: `vitest run`
  - `fmt`: `prettier --write .`
  - `fmt:check`: `prettier --check .`
  - `ci`: `bun run fmt:check && bun run lint && bun run check && bun run test`
- Keep `build` as a separate explicit verification step (not part of default
  `ci` loop).

## Dependencies

- Do not freeze full framework dependency lists in this seed; rely on the
  current TanStack Start scaffold output.
- Required project-specific dependency:
  - `epubjs`
- Expected categories after scaffold + additions:
  - Runtime/framework: TanStack Start + React + Nitro
  - Tooling/testing: TypeScript, ESLint, Prettier, Vitest

## Implementation Notes

- Generate stable `bookId` from a short digest of normalized `.m4b` basename;
  keep basename as a separate metadata field.
- Keep media path handling centralized to avoid traversal bugs.
- Validate and sanitize all filesystem-derived values before exposing to routes.
- Await async media handler responses to preserve structured error handling.
- Keep scanner/indexer logic separate from route handlers for testability.
- For route-served EPUB assets, support byte-fetch/`arrayBuffer` loading path
  when direct URL loading is unreliable.
- Keep EPUB load lifecycle keyed to stable book asset identity (`epubUrl`), not
  live relocation/progress updates, to prevent unintended reader resets.
- Add fixture-based tests for grouping logic:
  - canonical book (`.m4b` + `cover.jpg`)
  - canonical book (`.m4b` + `cover.png` fallback)
  - book with optional `.epub` and optional `.vtt`
  - orphan EPUB/VTT without `.m4b` excluded from results
  - basename mismatch warning (`.m4b` vs `.epub` when EPUB is present)
- Add basic integration test for `/` and `/player/$bookId` route rendering.
- Add integration checks for media behavior:
  - audio seek works (range requests honored)
  - VTT cue click seeks audio
  - EPUB search result navigates and highlights target CFI

## Acceptance Validation

- Required browser validation flow (Playwright):
  - open `/` and `/player/$bookId` on real roots
  - confirm reader containment (no iframe overflow/bleed)
  - confirm compact chrome and reader-first viewport dominance
  - capture desktop and mobile screenshots for `/player/$bookId`
  - verify layout budgets in screenshot review (chrome heights and reader
    minimums)
  - verify search UI is visible/actionable (match count + result list)
- Automatic failure conditions:
  - missing Playwright MCP evidence (screenshots + pass/fail checklist)
  - local Playwright dependency/tooling added without explicit user request
- Failure examples that must be rejected:
  - player page leaves too little vertical room for readable EPUB content
  - player page dominated by cover image instead of readable EPUB content
  - large floating overlays/panels obscuring reader text
- Canonical regression scenario for this library:
  - Home search `Use Of Weapons` -> open book -> EPUB search `Dizzy`
  - click a result -> verify navigation and visible highlight on matched text
  - verify highlighted match remains within reader bounds (no spill into chrome)
  - verify search results remain stable after navigation (no silent reset)
