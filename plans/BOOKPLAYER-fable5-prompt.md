# Plan the Prosodio Bookplayer

You are working from `/Users/daniel/Code/iMetrical/ai-garden`. Inside it,
`prosodio/` is a separate, nested Git monorepo. Your task is to investigate the
existing Bookplayer experiments and the current Prosodio repository, then write
one implementation-ready design and plan to:

`prosodio/thoughts/plans/bookplayer.md`

The planned application must live at:

`prosodio/apps/bookplayer/`

This is a planning task only. Do not scaffold the app, install dependencies,
modify the backlog, or change implementation files. The only repository file you
may create or modify is `prosodio/thoughts/plans/bookplayer.md`. Read-only
inspection and documentation/tool lookups are expected.

## Outcome

Produce a precise plan that another implementation agent can follow without
having to rediscover the product requirements, architecture, repository
conventions, experiment lessons, verification strategy, or completion gates. The
plan must synthesize evidence and make decisions. It must not merely list files
to read, repeat the seed, or offer a menu of unresolved implementation options.

Do not choose one experiment as the new app's base, average their designs, or
assume repeated choices are good choices. Start from the Bookplayer's intended
user experience and Prosodio's current needs. Use the experiments to discover
working behavior, failure modes, and questions that have already been answered.
The new design should be free to replace their component structure, visual
layout, state model, server boundaries, naming, and implementation techniques
when a simpler or stronger design is justified.

The plan is both the focused design and the executable checklist for this app.
Keep it in the one requested plan file even though Prosodio also supports
separate design documents.

## Source authority

Use this order when sources disagree:

- The current `prosodio/AGENTS.md`, current Prosodio code, and current Prosodio
  documentation define repository, workflow, dependency, privacy, and quality
  conventions.
- `experiments/seeds/bookplayer.md` defines the Bookplayer product contract and
  acceptance behavior unless it conflicts with a current Prosodio convention.
- The three experiments are implementation evidence, not templates. Extract
  independently useful behavior and recorded lessons, then judge each choice
  against the seed and current Prosodio. Reuse is valuable only when the reused
  idea remains correct, fits the new architecture, and is better than a clean
  implementation. Do not copy historical scaffolding, dependency layout, bugs,
  contract drift, styling, or obsolete framework assumptions.
- `experiments/BUN_TANSTACK.md` and the experiment-local `AGENTS.md` files are
  historical guidance. Validate time-sensitive framework details against current
  official documentation and the current CLI before putting them in the plan.

When a conflict cannot be resolved from repository evidence, state one
recommended decision with rationale and record the residual question. Do not
silently blend incompatible contracts.

## Required investigation

Read the following completely before writing the plan:

- `prosodio/AGENTS.md`
- `prosodio/README.md`
- `prosodio/package.json`
- `prosodio/.env.example`
- `prosodio/.gitignore`
- `prosodio/docs/README.md`
- `prosodio/docs/WORKFLOW.md`
- `prosodio/docs/FILE-LAYOUT.md`
- `prosodio/docs/DEPENDENCY.md`
- `prosodio/docs/PRIVACY.md`
- `prosodio/docs/FRAMEWORK-TANSTACK.md`
- `prosodio/docs/STYLING.md`
- `prosodio/docs/CODING-STYLE.md`
- `prosodio/docs/FORMATTING.md`
- `prosodio/docs/MARKDOWN.md`
- `prosodio/fixtures/manifest.jsonc`
- `experiments/seeds/bookplayer.md`
- `experiments/BUN_TANSTACK.md`
- `experiments/STYLING.md`
- `experiments/bookplayer-agy-opus46/AGENTS.md`
- `experiments/bookplayer-agy-opus46/PLAN.md`
- `experiments/bookplayer-claude-opus-46/AGENTS.md`
- `experiments/bookplayer-claude-opus-46/PLAN.md`
- `experiments/bookplayer-codex-gpt-5.3-codex/AGENTS.md`
- `experiments/bookplayer-codex-gpt-5.3-codex/PLAN.md`

Inspect relevant implementation and test code, not just the plans:

- In `bookplayer-agy-opus46`, inspect the scanner/index/cache, environment
  validation, media serving, server functions, both routes, EPUB reader, VTT
  transcript, styles, and package scripts. This is the strongest overall and
  most seed-aligned experiment, but its recorded gaps still matter.
- In `bookplayer-claude-opus-46`, inspect the player route, reader/player
  interaction, chapter navigation, audio scrobbling/progress, scanner, styles,
  and tests. It is useful evidence for the simplest working player, not a full
  product contract.
- In `bookplayer-codex-gpt-5.3-codex`, inspect its tests, route-data boundary,
  media validation, error handling, reader, and final player layout. Preserve
  its CI and validation discipline. Explicitly account for its strict-pair
  contract drift, oversized public type surface, failed EPUB
  search-to-navigation/highlight behavior, and termination notes.

### Visual evidence from the working experiments

The two strongest working players were run against the same private
`Use Of Weapons` book and inspected at `1440x900` desktop and `390x844` mobile
viewports. The screenshots are local planning evidence under `plans/`. Read them
with an image-inspection tool; do not copy them into Prosodio because they
contain private-corpus metadata.

Claude Opus 4.6 player:

- `plans/bookplayer-claude-desktop.jpg`
- `plans/bookplayer-claude-mobile.jpg`
- `plans/bookplayer-claude-search.jpg`
- `plans/bookplayer-claude-search-mobile.jpg`

AGY Opus 4.6 player:

- `plans/bookplayer-agy-desktop.jpg`
- `plans/bookplayer-agy-mobile.jpg`
- `plans/bookplayer-agy-search-mobile.jpg`

Verified observations to use as evidence, not inherited design:

- Both players initially devote most of the reader surface to a full book cover.
  That is functional EPUB rendering, but it demonstrates why the new design's
  compact-cover and readable-content acceptance checks must be explicit.
- Claude uses a bounded centered reading surface with explicit chapter, search,
  previous, and next controls. Its desktop `Dizzy` search returned 12 actionable
  results; selecting the first result navigated to readable text and visibly
  highlighted the term.
- Claude keeps a transcript strip and transport visible together. On mobile,
  however, its single-row transport/timeline is clipped at the right edge. After
  navigating to the desktop search match and switching to mobile, the visible
  page no longer contained the match or highlight, exposing a responsive-reflow
  location-preservation case that the new acceptance tests must cover.
- AGY gives the EPUB iframe nearly the full viewport width and keeps its header,
  EPUB toolbar, transcript, and player vertically compact. Its desktop reader
  occupied roughly two-thirds of the viewport height, a useful baseline for a
  reader-first page.
- AGY's mobile toolbar cannot expose its search input, submit, and close
  controls together at `390px`; the search had to be submitted after returning
  to a desktop width. Its mobile results overlay consumes a large part of the
  reader, and selecting the first `Dizzy` result did not visibly place or
  highlight that term in the remaining reader viewport.
- AGY hides the one-minute jump controls and volume control at the inspected
  mobile width. It also exposes TanStack development chrome in the player. Both
  are implementation artifacts, not patterns to carry forward.
- Both apps show that compact persistent transcript and transport regions are
  feasible, but neither screenshot set should be treated as the target visual
  design.

Use the screenshots to extract `preserve`, `avoid`, and `reconsider` findings
tied to usability and correctness. Screenshots are evidence, not a visual
specification: do not clone either UI, mechanically combine their layouts, or
let their component boundaries constrain a stronger reader-first design. Derive
an independent Prosodio Bookplayer UX direction and explain where it
intentionally departs from both.

Inspect the current Prosodio code that may be reused or whose contracts must be
respected, especially:

- `prosodio/packages/vtt/` and its public `@prosodio/vtt` API
- `prosodio/apps/align/lib/config.ts`
- `prosodio/apps/align/lib/discovery.ts` and its tests
- `prosodio/apps/align/lib/epub-extract.ts` and its tests
- relevant EPUB validation adapters in `prosodio/apps/epub-validate/src/`
- existing workspace package names, scripts, and dependency patterns

Do not import another app's internal files merely to avoid duplication. If code
has genuinely become a cross-app concern, the plan may propose a small shared
package, but it must identify the consumers, ownership boundary, migration
steps, and tests. Avoid speculative abstraction and keep public types small. Use
`@prosodio/vtt` instead of designing a second VTT parser.

For current TanStack Start, Nitro, Bun, and epub.js behavior, consult current
official documentation using available documentation tools. Check the current
TanStack CLI help without generating an app. Record in the plan what was
validated and the relevant current CLI/package assumptions. Current sources
override the February 2026 experiment scaffold notes. Do not freeze versions in
the plan unless Prosodio's dependency policy requires it.

## Required synthesis

First classify the seed material rather than treating every historical design
choice as equally binding:

- Preserve explicit hard requirements, user-visible behavior, data invariants,
  safety constraints, and acceptance regressions.
- Treat recommendations, example layouts, sample filenames, suggested
  algorithms, palette choices, and implementation notes as design inputs that
  may be replaced with a justified approach that meets the same outcome.
- If current Prosodio evidence warrants changing an apparent hard requirement,
  identify the change explicitly, explain the tradeoff, and keep it visible for
  user approval. Do not weaken a requirement merely because an experiment did
  not implement it.

The plan must cover the complete behavioral contract, including the less visible
requirements that are easy to omit:

- Canonical records are `.m4b` plus `cover.jpg` or `cover.png`; EPUB and VTT are
  optional capabilities. Orphan assets never become books.
- Recursive, hidden-safe, traversal-safe library discovery; stable short IDs;
  warnings and graceful handling for malformed assets; scan lock; persisted,
  fingerprinted cache; background metadata enrichment with bounded `ffprobe`
  concurrency; runtime rescan; timing instrumentation.
- Lightweight listing and detail data; protected asset lookup; cover, EPUB, VTT,
  and audio endpoints; correct HTTP range and content-length semantics;
  structured input errors; no absolute filesystem paths exposed to clients.
- Searchable, sortable, paginated or virtualized library behavior for more than
  800 books, composable EPUB/VTT filters with the specified defaults and truth
  table, capability badges, metadata, progress, and complete loading, error, and
  empty states.
- Reader-first player layout with strict containment and viewport budgets;
  compact controls; desktop and mobile usability; full transport, keyboard,
  speed, volume, time, progress persistence, and subsystem failure states.
- Client-only epub.js lifecycle, navigation, TOC, responsive flow, persisted
  CFI, full-text spine search, bounded results, range-CFI handling,
  deterministic result navigation, visible highlighting, highlight cleanup, and
  protection against reader resets during relocation.
- A transcript strip that always exists, VTT parsing, active-cue tracking,
  cue-to-seek, auto-scroll, and the explicit no-transcript state.
- Automated unit/integration coverage, real browser behavior, observability,
  accessibility, error handling, and explicit acceptance evidence.
- Root-level Prosodio quality gates after every edit and before every commit,
  plus a separate production build verification where the root CI does not cover
  it.

Do not let the plan regress to the Codex experiment's strict `.m4b` + `.epub`
pair model or `/player/$pairId`. The public route is `/player/$bookId`, and a
book without an EPUB must remain playable.

## Prosodio-specific decisions

Adapt the experiment into the monorepo rather than treating `apps/bookplayer/`
as a standalone experiment. The plan must explicitly decide and describe:

- How the TanStack Start app participates in the Bun workspace and root
  lockfile, lint, format, typecheck, test, and dependency conventions without a
  nested Git repository or duplicated root tooling.
- App scripts and root commands for development, tests, CI, production build,
  preview/start, and browser verification.
- The minimal app/package/component boundaries and intended file layout. Name
  likely files where that makes steps unambiguous, but do not invent a large
  framework of abstractions.
- Whether any discovery, configuration, EPUB, or media logic should be shared
  with existing Prosodio code. Existing `align` triplet discovery requires all
  three assets and therefore cannot be reused unchanged for the Bookplayer's
  canonical-record contract.
- How `AUDIOBOOKS_ROOT` and `VTT_DIR` from the seed reconcile with Prosodio's
  provisional `PROSODIO_CORPORA_DIR` and future shared-config direction. Specify
  ownership, path resolution, startup validation, `.env` behavior, and
  migration/compatibility policy. A committed example must not contain the
  seed's machine-specific absolute path.
- How cache, index, screenshot, and browser-evidence artifacts fit Prosodio's
  `data/bookplayer/` convention instead of becoming app-root state or committed
  private data.
- How the checked-in/fetched public Prosodio fixtures support deterministic
  tests. Notice that the existing public Alice audiobook fixture may not meet
  the seed's cover invariant; include the smallest legal/provenanced fixture
  change needed rather than weakening the production invariant.
- How public fixture acceptance differs from optional private-corpus acceptance.
  `Use Of Weapons` and the query `Dizzy` remain the private regression case when
  that corpus is mounted, but private names, metadata, screenshots, reports, and
  derived artifacts must not be committed. Put any such artifacts only in an
  appropriate gitignored location and report their paths at handoff.
- How the existing `@prosodio/vtt` package is consumed from browser/server
  boundaries without duplicating parsing contracts or shipping unnecessary
  server code.
- The v1 boundary: audio/transcript cue synchronization and independent EPUB
  reading are required; word/sentence-level audio-to-EPUB alignment is not.
  Preserve a reasonable future seam for Prosodio alignment data without
  expanding v1.
- Collision and ambiguity behavior for basename-derived IDs and duplicate
  basenames across a recursive library.
- Reconciliation of the seed's single-`.m4b` directory invariant with its
  conditional requirement for seamless next-track progression. Make the
  supported v1 model and tests explicit.

Browser verification must use the available MCP/in-app browser automation when
available. Do not add Playwright or `@playwright/test` to Bookplayer merely to
replace MCP browser checks. Prosodio already has a Playwright dependency in a
different app for a different purpose; do not mistake its existence for
Bookplayer test ownership. If browser tooling is unavailable during
implementation, the plan must treat UI phase completion as blocked rather than
allowing an unverifiable completion claim.

## Plan quality bar

Write `prosodio/thoughts/plans/bookplayer.md` in Prosodio's Markdown style. It
must begin with:

```md
# bookplayer — <imperative title>

Status: planned

Goal: <one concrete sentence>.
```

After that, include concise but sufficient sections for:

- Context and evidence: what each experiment contributes, what must be rejected,
  the important visual-review findings, and how current Prosodio changes the
  approach.
- A concise independent UX thesis for the new app: the intended reading and
  listening experience, the hierarchy it implies, and deliberate departures from
  both working experiment UIs.
- Scope and non-goals.
- Chosen architecture: ownership boundaries, runtime/data flow, routes,
  server/client split, asset security, state and cache lifecycle, and proposed
  file/package layout.
- Product and UX design: landing page, player, reader, transcript, responsive
  behavior, accessibility, and failure states.
- Configuration, fixtures, privacy, and observability.
- Testing and browser acceptance strategy.
- Risks and resolved tensions. Keep truly unresolved questions few, specific,
  and blocking; recommend a default for each.
- Phased implementation checklist.
- Final acceptance checklist and handoff evidence.

Every implementation phase must use live Markdown checkboxes and state:

- the concrete outcome and important files/boundaries affected;
- the automated tests added or changed;
- the commands and browser checks that prove the phase is complete;
- a green `bun run ci` gate from the `prosodio/` root;
- `bun run fmt` followed by another `bun run ci` when formatting fails;
- explicit build verification for scaffold/framework-sensitive phases;
- no checkbox completion while its required verification is red, skipped, or
  unavailable.

The implementation agent must update checkboxes continuously and advance the
plan status from `planned` to `active` to `done`; the plan is the live progress
tracker, not a checklist filled in retrospectively.

Sequence the phases so risky assumptions are proven early. In particular,
require an early minimal proof of the installed TanStack server-function/route
API and media response behavior before building all endpoints. Require EPUB
open/search/display/highlight behavior on a small real fixture before polishing
the surrounding UI. Do not postpone tests, route contracts, or browser
verification to one final cleanup phase.

The final acceptance checklist must be requirement-traceable and include at
least:

- root CI and production build;
- deterministic public-fixture flow;
- optional real-root/private regression flow when configured;
- both `/` and `/player/$bookId` at desktop and mobile viewports;
- reader geometry/containment and viewport-budget measurements;
- audio range seek, scrub, jump buttons, keyboard transport, speed, volume,
  resume, and no-EPUB behavior;
- transcript presence, no-VTT state, active cue, cue seek, and auto-scroll;
- EPUB TOC/navigation/location persistence and search result navigation with a
  visible, in-bounds highlight that survives relocation without resetting
  results;
- filter truth table, pagination reset, large-library responsiveness, rescan,
  cache restore/invalidation, and background enrichment;
- traversal, symlink escape, invalid ID, missing/corrupt asset, range, and
  content-length tests;
- accessibility and visible focus checks;
- screenshot and pass/fail evidence paths, with private artifacts uncommitted;
- confirmation that no Bookplayer-local Playwright replacement dependency was
  added.

Be concrete enough that implementation estimates and review are possible, but do
not paste large code samples into the plan. Prefer exact contracts, decisions,
file ownership, tests, and completion evidence over speculative class/type
inventories. End with a short definition of done.

Before finishing, run Prosodio's formatter/checks applicable to the new Markdown
file from the `prosodio/` root. Inspect the final diff and confirm that only
`prosodio/thoughts/plans/bookplayer.md` changed.

Remember you are a much stronger model than that which made these previous
attempts. Be guided by this information, but design a clearly superior plan with
strong architecure and implementation plan, as I know you are capable of.
