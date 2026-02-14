# Plan: bookplayer-codex-gpt-5.3-codex

Harness: codex-gpt-5.3-codex

Goal: Build a local-first TanStack Start app that indexes strict `.m4b` +
`.epub` pairs, supports `/` and `/player/$pairId`, and evolves toward integrated
audio + reader + transcript playback.

## Milestones

- [x] M1 Scaffold TanStack Start app with Bun + Nitro and no nested git
- [x] M2 Normalize scripts/tooling (`fmt`, `lint`, `check`, `test`, `ci`)
- [x] M3 Create experiment artifacts (`README.md`, `AGENTS.md`, `PLAN.md`)
- [x] M4 Add required env files (`.env.example` and local `.env`)
- [x] M5 Replace starter `/` with BookPlayer shell and real server data flow
- [x] M6 Add `/player/$pairId` placeholder layout with reader/transcript/player
- [x] M7 Implement media asset endpoints and route-param validation payloads
- [x] M8 Implement ePub.js rendering + playback state persistence
- [x] M9 Add tests for pairing logic and route integration
- [x] M10 Verify `bun run ci` is green and record outputs

## Decisions / Notes

- Scaffold command validated locally:
  `bunx --bun @tanstack/cli create ... --add-ons nitro --no-git`.
- Context7 TanStack docs still show `npm/pnpm create` guidance in places; local
  CLI output was used as source of truth for command flags.
- Bootstrap includes a runtime filesystem scan and manual rescan action.

## Session Audit Trail

- 2026-02-13: Scaffolded project in
  `experiments/bookplayer-codex-gpt-5.3-codex`.
- 2026-02-13: Added `epubjs` and lint/format dependencies via `bun add`.
- 2026-02-13: Updated scripts and CI pipeline in `package.json`.
- 2026-02-13: Added `eslint.config.js`, `.prettierrc`, `.prettierignore`.
- 2026-02-13: Replaced starter landing page with BookPlayer listing shell.
- 2026-02-13: Added server-side strict-pair scanner in `src/lib/library.server.ts`.
- 2026-02-13: Added `/player/$pairId` bootstrap route shell.
- 2026-02-13: Added local `README.md`, `AGENTS.md`, `PLAN.md`.
- 2026-02-13: `bun run ci` passed (lint warnings only, no lint errors).
- 2026-02-13: Added API endpoints for listing pairs, pair detail, and asset
  serving with structured validation errors.
- 2026-02-13: Implemented dynamic epub.js reader, audio transport controls,
  transcript cue syncing, and local progress persistence.
- 2026-02-13: Added Vitest coverage for strict-pair indexing and route data
  helpers.
- 2026-02-13: Re-ran `bun run ci` after M7-M9 updates (green, lint warnings
  only).
- 2026-02-13: User confirmed updated bootstrap command in
  `BUN_TANSTACK.md` (`bunx --bun ...`) was required for reliability.
- 2026-02-13: Local environment confusion documented: command invocation cwd
  and sandbox assumptions were clarified during run/debug cycle.
- 2026-02-13: Confirmed required experiment artifacts exist in experiment dir:
  `README.md`, `AGENTS.md`, `PLAN.md`, `.env.example`, `.env`.
- 2026-02-13: M7-M9 were completed after milestone checklist drift; progress
  state synced back to implementation status.
- 2026-02-13: Initial run lacked browser-level verification of `/` and
  `/player/$pairId`; gap was caught by user review and corrected with
  Playwright-based checks.
- 2026-02-13: UI/layout issue confirmed in real usage: player header and
  controls consumed too much vertical space and reduced ebook viewport.
- 2026-02-13: Real-root validation added using
  `AUDIOBOOKS_ROOT=/Volumes/Space/Reading/audiobooks/` and
  `VTT_DIR=../../bun-one/apps/whisper/data/output/`; verified `Use Of Weapons`
  renders on index and player routes.
- 2026-02-13: API defect fixed: async media asset handler response was not
  awaited, which bypassed intended structured error handling.
- 2026-02-13: EPUB loading defect fixed: reader now fetches EPUB bytes and opens
  `arrayBuffer` input for stable epub.js rendering from route assets.
- 2026-02-13: Context7 was used for epub.js API navigation (`Section.find`,
  `rendition.display(cfi)`, highlight/remove annotation flow).
- 2026-02-13: EPUB text search implemented in reader and validated against real
  content (`Use Of Weapons` -> query `Dizzy`).
- 2026-02-13: Requirement correction for seed updates:
  EPUB search is a core requirement for the reader and is not optional.
- 2026-02-13: User feedback (quoted): "codex-gpt5.3 is incapable of doing a
  prpoer ui layout".
- 2026-02-13: Handoff learning added: browser validation is mandatory before
  claiming UI progress. Required checks include `/` and `/player/$pairId` with
  real roots and real content, not placeholder data.
- 2026-02-13: Handoff learning added: use the real validation case
  `Use Of Weapons` + EPUB search query `Dizzy` as a baseline acceptance test.
- 2026-02-13: Handoff learning added: reader-first UX is non-negotiable.
  Reading viewport is primary, navigation controls are secondary, metadata must
  be subtle and out of the way.
- 2026-02-13: Handoff learning added: remove unsolicited high-footprint panels
  (for example large "audiobook context" side panels) unless explicitly
  requested.
- 2026-02-13: Handoff learning added: remove irrelevant starter branding (for
  example visible TanStack starter logo/badges) from reader/player surfaces.
- 2026-02-13: Handoff learning added: EPUB iframe containment is a hard
  requirement. The iframe and epub.js internal containers must be clipped to
  the reader bounds and must not bleed into header/footer/player regions.
- 2026-02-13: Handoff learning added: explicit user directives must be treated
  as blocking requirements, especially around layout defects and validation
  steps.
- 2026-02-13: Search bug root cause documented: `Section.find` can behave
  asynchronously; assuming a synchronous return caused silent no-result flows.
  Fix: search now uses docs-backed `load/find/unload` handling with
  promise-aware matching, deduping, and explicit failure messaging.
- 2026-02-13: Player UI refactor applied for reader-first density: compact
  header, compact transport bar, and transcript moved to collapsed details by
  default so controls remain secondary.
- 2026-02-13: TanStack starter branding cleanup completed; leftover logo-based
  header component was replaced with neutral BookPlayer UI.
- 2026-02-13: EPUB container constraints were tightened further with enforced
  clipping/containment on epub.js internal wrappers to prevent iframe bleed in
  desktop and mobile layouts.
- 2026-02-14: Validation baseline was moved to an isolated dev server on
  `http://localhost:3100` to avoid stale background servers on `:3000` causing
  false UI/asset failures.
- 2026-02-14: Fixed real EPUB delivery failure (`ERR_CONTENT_LENGTH_MISMATCH`)
  in `/api/assets/$pairId?kind=epub` by serving non-range assets as buffered
  bytes and keeping streamed responses range-safe.
- 2026-02-14: Used Context7 again for epub.js behavior checks and kept
  docs-aligned flow (`Section.find` + `rendition.display(cfi)`) for in-book
  search.
- 2026-02-14: Fixed runtime search fragility where malformed/empty section
  results could crash deduping (`result.cfi` access on invalid values).
- 2026-02-14: Real search acceptance test passed on
  `Use Of Weapons` with query `Dizzy` (12 matches; selectable result list).
- 2026-02-14: Player layout was refactored to enforce reader-first use:
  compact header, compact footer controls, no large floating transcript panel,
  and transcript status reduced to a single subtle line.
- 2026-02-14: Verified iframe containment with runtime geometry checks:
  iframe bounds remain inside `.reader-viewport` and do not overlap footer.
- 2026-02-14: Starter PWA branding was normalized (`public/manifest.json`
  renamed to BookPlayer metadata). Visible TanStack-specific UI artifacts were
  not present in Playwright validation after cleanup.
- 2026-02-14: User feedback reinforced as hard requirement: if the player is
  not comfortably usable for reading at first glance, the iteration is not
  complete.
- 2026-02-14: Search regression root cause fixed: `EpubReader` reloaded the
  book whenever `initialCfi` changed, and `initialCfi` changes on every
  relocation. This reset search results and made result clicks look broken.
  Load lifecycle now keys off `epubUrl` only.
- 2026-02-14: Match-navigation robustness added: range CFIs from
  `Section.find()` are normalized to start-point CFIs before `rendition.display`
  to avoid `IndexSizeError` and ensure click-to-match navigation works.
- 2026-02-14: Search highlight visibility bug fixed: previous CSS forced epub.js
  view width to viewport width, which prevented internal pagination scrolling and
  left highlights off-screen. Constraint strategy was updated to clip only outer
  containers and allow epub.js internal view width/scroll math to function.
- 2026-02-14: Selected match flow now guarantees visible term emphasis with
  stronger highlight styling and confirmed in-viewport highlight positioning on
  real data (`Use Of Weapons`, query `Dizzy`).
- 2026-02-14: **Experiment terminated by user.** Reason recorded per explicit
  user directive: EPUB navigation remains unreliable; EPUB search can return
  matches but does not consistently reposition the book to the correct passage
  or reliably show the searched-term highlight at the expected location.
- 2026-02-14: Additional termination context: delivery quality did not meet
  user expectations for core reader usability, and repeated regressions in the
  search-to-navigation/highlight flow resulted in loss of confidence.

## Next-Agent Guardrails (Do Not Skip)

- Run browser-level verification with Playwright for both `/` and
  `/player/$pairId` before reporting completion.
- Validate against real configured roots (`AUDIOBOOKS_ROOT`, `VTT_DIR`) and
  confirm the real pair route opens successfully.
- In the EPUB reader, execute in-book text search for `Dizzy` on
  `Use Of Weapons` and confirm navigation to a real match.
- Confirm search UX output is visible and actionable (match count button and
  result panel), not just background state changes.
- Confirm the reader area stays fully constrained:
  no iframe spill, no overlap with persistent controls, no hidden giant panels.
- Keep header/footer compact so the book page remains the dominant visible
  region on desktop and mobile.
- Use Context7 docs when implementing or changing epub.js behavior.
