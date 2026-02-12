# bookplayer Requirements

Local-first web app for browsing matched ebook/audiobook pairs and reading while
listening.

## Workflow / CI

- Each experiment created from this seed should include a local `AGENTS.md`.
- Each experiment should include a `PLAN.md` with milestones and a Session Audit
  Trail.
- That `AGENTS.md` should instruct the agent to run `bun run ci` after
  completing a meaningful task/phase, and to fix failures before proceeding.
- Dependencies must be added with `bun add` / `bun add -d` (never by editing
  `package.json` directly).
- That `AGENTS.md` should explicitly instruct the implementation agent to use
  available MCP/doc tools to validate current framework details before coding.
- Validation requirement for scaffold-sensitive details (scripts/dependencies):
  - Query latest TanStack Start docs first (prefer Context7 when available).
  - Then verify by running scaffold commands locally and reading generated
    `package.json`.
  - Treat scaffold output as source of truth for framework versions/scripts.

## Tech Stack / Runtime

- **Bun** must be used as the runtime and package manager (not Node.js).
- Use **TanStack Start** for the web app framework and routing.
- Use **TypeScript** for all application code.
- The app is local-first and single-user by default (no auth required in v1).

## Project Bootstrap

- Create the app from the current TanStack Start scaffolder (do not hand-roll the
  initial framework wiring):
  - `bun create @tanstack/start@latest <experiment-dir>`
- Treat the scaffold-generated `package.json` scripts and framework dependencies
  as canonical for that date/version.
- Then add project-specific packages with `bun add` (for example `epubjs`).

## Environment Configuration

- Library root must be configurable via environment variable:
  - `AUDIOBOOKS_ROOT=/Volumes/Space/Reading/audiobooks/`
- Require both:
  - `.env` for local machine configuration (gitignored)
  - `.env.example` with documented required keys
- Example `.env.example`:

```dotenv
AUDIOBOOKS_ROOT=/Volumes/Space/Reading/audiobooks/
```

- On startup, validate `AUDIOBOOKS_ROOT`:
  - exists
  - is a directory
  - is readable
- Fail fast with a clear startup error if invalid.

## App Interface

- App has two main pages:
  - `/` landing page: directory of matched ebook/audiobook pairs
  - `/player/$pairId` player page: audiobook player + embedded ebook reader
- Mobile and desktop layouts must both be usable and tested.

## Library Source

- Default model: app scans a configured local library root directory.
- Recursively traverse all nested directories under `AUDIOBOOKS_ROOT`.
- Supported v1 file types:
  - Ebook: `.epub`
  - Audio: `.m4b`
- Expected source shape: mostly one `.m4b` per book folder, often with matching
  `.epub` in same folder.
- Hidden files/directories must be skipped.
- Invalid/corrupt files should not crash app startup; they should be skipped
  with warnings.

## Pairing Rules

- Primary strategy (required): folder-based pairing (ebook and audio in same
  book folder).
- Include in app directory only strict matches that contain both:
  - at least one `.m4b`
  - at least one `.epub`
- Unmatched entries (audio-only or epub-only) must not be shown in main results.
- Pair id must be the `.m4b` basename (without extension), treated as globally
  unique in this library.
- Basename consistency check: `.m4b` and `.epub` basenames are expected to
  match; when they do not, still pair by folder but log a warning for upstream
  cleanup.

## Landing Page (`/`)

- Show a searchable/sortable directory of matched pairs.
- Minimum displayed fields:
  - Title
  - Author (when available)
  - Total audio duration
  - Last progress (if available)
  - Action to open player
- Include empty state guidance when no pairs are found.
- Include loading and error states while scanning/indexing library.

## Player Page (`/player/$pairId`)

- Must render both:
  - Audiobook player panel
  - Embedded ebook reader panel (ePub.js)
- Reader and player should be visible together on desktop.
- On mobile, reader/player can stack or use tabs, but both must remain easily
  accessible.

### Audio Player Controls

- Required controls:
  - Play/pause
  - Seek scrubber
  - Jump backward 15s
  - Jump forward 15s
  - Playback speed selector (0.75x to 2.0x)
  - Volume control
- Show current time and total duration.
- If audio is composed of multiple files, support seamless next-track
  progression.

### Ebook Reader (ePub.js)

- Use ePub.js to render `.epub` content in the player page.
- Support basic navigation (next/previous section or page).
- Preserve reader location between sessions for each pair.
- Handle unreadable EPUB errors with a clear fallback UI message.

## Sync and Progress

- v1 does not require sentence-level or word-level sync.
- Persist per-pair progress locally:
  - Audio playback position
  - EPUB location/CFI
- Persist in browser storage by default (`localStorage`), keyed by pair id.

## Server/Data Endpoints (TanStack Start)

- Provide server-side endpoints/functions for:
  - Listing matched pairs
  - Fetching details for one pair by id
  - Serving media paths required by player/reader
- Input validation is required for route params and query params.
- Return structured error payloads for not-found and invalid id cases.

## Indexing and Refresh Model

- Indexing is runtime behavior (not compile-time and not build-time).
- On server start, perform a filesystem scan of `AUDIOBOOKS_ROOT` to discover
  strict `.m4b` + `.epub` pairs.
- Keep an in-memory manifest/index for fast route responses.
- Support explicit re-scan at runtime (manual refresh endpoint/button).
- Optional optimization: persist cache to a local data file and restore it on
  startup, then revalidate in background.
- Cache invalidation should use file fingerprint checks (relative path + mtime +
  size).

### Media Serving Strategy

- Do not expose absolute filesystem paths to the client.
- Use pair ids from the runtime manifest/index to resolve files server-side.
- Serve media through app endpoints:
  - audio stream endpoint with HTTP Range support (required for scrubbing)
  - epub file endpoint consumable by ePub.js
- Keep path traversal protections strict (`..`, symlink escape, non-root files).

## Metadata Extraction

- Metadata source priority:
  - `metadata.json` in book directory when present and valid
  - fallback to `ffprobe` for `.m4b`
- Metadata extraction can run sequentially by default for simplicity.
- Optional optimization: bounded-concurrency ffprobe workers if profiling shows
  clear startup benefit.
- For large libraries, directory results should not block on full metadata
  extraction; show partial rows and update as metadata resolves.
- Cache extracted metadata server-side (memory + optional data file) and only
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
- Keyboard accessibility:
  - Space toggles play/pause when player is focused
  - Left/right arrows seek when timeline is focused

## Error Handling

- Continue rendering usable UI when one subsystem fails (audio or reader).
- Show actionable error messages (file missing, unsupported format, parse
  failure).
- Log technical details to console/server logs without exposing sensitive paths
  in user-facing messages.

## package.json Scripts

- Do not hardcode framework scripts in the seed; use scripts generated by the
  TanStack Start scaffold for `dev`, `build`, and `start`.
- Ensure the project also has:
  - `lint`: `eslint .`
  - `check`: `tsc --noEmit`
  - `test`: `vitest run`
  - `fmt`: `prettier --write .`
  - `fmt:check`: `prettier --check .`
  - `ci`: `bun run fmt:check && bun run lint && bun run check && bun run test && bun run build`

## Dependencies

- Do not freeze full framework dependency lists in this seed; rely on the
  current TanStack Start scaffold output.
- Required project-specific dependency:
  - `epubjs`
- Expected categories after scaffold + additions:
  - Runtime/framework: TanStack Start + React stack
  - Tooling/testing: TypeScript, ESLint, Prettier, Vitest

## Implementation Notes

- Use the `.m4b` basename as the stable pair id.
- Keep media path handling centralized to avoid traversal bugs.
- Validate and sanitize all filesystem-derived values before exposing to routes.
- Keep scanner/indexer logic separate from route handlers for testability.
- Add fixture-based tests for pairing logic:
  - clean one-to-one pair
  - one EPUB with multi-part audio
  - unmatched EPUB/audio files
  - basename mismatch warning (`.m4b` vs `.epub`)
- Add basic integration test for `/` and `/player/$pairId` route rendering.
