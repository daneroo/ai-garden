# Consolidating: prosodio

Status: planning (no code moved yet). This is the single source of truth for the
prosodio consolidation. It is meant to be reviewed by Daniel and by a second agent
(codex). Keep all PLANNING content here - no hidden planning artifacts (the repo itself
may still carry ordinary dotfiles/config).

How to read this: claims carry a decision state, not a binary "validated or not" (see
"Decision state model"). State and evidence are independent - a choice can be decided yet
not production-validated, or evidence-backed yet not accepted. Items flagged ASSUME / NOT
SPECIFIED are Claude's unverified sketches; ASSESS verdicts await a real read of the code.

## Current objective

This document is a context bridge. When work moves to the prosodio repo, this rich
ai-garden context is lost and Claude goes blind - so we capture it here, now, while
the context still exists. The near-term goals, in order:

- Capture the gist and outline of the whole plan.
- Keep it falsehood-free: mark assumptions, do not assert.
- Preserve as much known context as possible.
- Delay decisions deliberately - record the forks, do not resolve them.
- Identify the first step we can safely execute to start the move.

Once a minimal prosodio repo exists, it gains its own objectives and we switch to
progressive, incremental work there.

## Context

ai-garden is an AI-experimentation monorepo that has accumulated ~20 directories of
work circling one coherent product idea: managing, aligning, and "playing"
audiobooks + ebooks on a synchronized timeline. The work is spread across embedded
sub-monorepos (`bun-one/`, `deno-one/`), legacy root prototypes, and agent bake-off
experiments. The goal is to consolidate the components of interest into a new, clean
sibling repository called prosodio (`~/Code/iMetrical/prosodio`).

Seeding the prosodio repo is now IN SCOPE (Epoch 0). This started as a planning-only
document; it is now the live record as we begin executing. Canonical target: the sibling
repo `~/Code/iMetrical/prosodio`. (The earlier nested `ai-garden/prosodio` scaffold was a
failed attempt, since removed - not completed work.)

## Motivation - why leave ai-garden

ai-garden accumulated too many competing axes at once (harnesses x stacks x configs x
experiments). That combinatorial complexity is the reason to start a narrower repo. A
specific failure: ai-garden was meant to be neutral ground for comparing AI harnesses
(codex, Claude, opencode, ...) and exploring skills and MCPs, but Claude Code's bespoke
configuration surface (a `.claude/` dir, `CLAUDE.md` duplicating `AGENTS.md`, hooks,
hidden plan artifacts) imposed itself and made that goal unworkable. Daniel built his
own harness-neutral framework in `experiments/` to escape it. prosodio must not repeat
this: the agent-facing layer is a first-class design concern, kept harness-neutral.

## Orthogonal concerns (axes register)

The consolidation separates into axes that can be reasoned about independently. This is
a living list - we began at three and keep surfacing more (4 and 5 emerged mid-design).
That escalation is itself the ai-garden disease; taming it is the point of prosodio, so
new axes get added here explicitly rather than tangled into other sections.

- Axis 1 - Repository layout and architecture: the workspace skeleton, package/app
  boundaries, where shared config and data live.
- Axis 2 - Stack and tooling: the Bun-centered toolchain choices (test runner,
  linter/formatter, type-check strategy, schema lib). Subtle, flagged for revisiting.
- Axis 3 - Partial implementations: the inventory pieces, each normalized onto axes 1
  and 2 rather than dragging its own conventions in.
- Axis 4 - AI harness enablement: how the repo exposes agent instructions, shared
  knowledge docs, skills, and MCP config in a harness-neutral way.
- Axis 5 - IDE config alignment: editor lint/format/plugin config across the
  VSCode-family editors, kept in lockstep with the CI target. Tightly coupled to (and a
  driver of) the Axis 2 format/lint choice.

Baselines: bun-one is the validated reference for axes 1 and 2 (see
`bun-one/docs/WORKSPACE-BUN.md` and `RETROSPECTIVE-2026-02-02.md`). The `experiments/`
framework is the reference for axis 4, not bun-one's Claude-flavored config.

## Decision log

- prosodio is a sibling local repo (`~/Code/iMetrical/prosodio`), created only after
  this plan is approved. No git remote yet.
- prosodio will be PUBLIC. State: decided - this is Daniel's default posture (all his
  repos are public, with a limited set of exceptions; ai-garden itself is public), not a
  special choice. It also explains why current corpora metadata is already exposed. Real
  corpora and identifying/derived reports stay private (see Public/private boundary).
- Format/lint: a revisitable requirement, not a permanent pick (the exemplar of how such
  choices are recorded). Requirement: one root-invokable formatter+linter meeting the
  Axis-2 formatter/linter swap-criteria (IDE parity, single-tool ideal, low config
  footprint, markdown incl embedded code). Current best choice (provisional, decided,
  evidence-backed): Codex's researched spec - prettier as the sole formatter
  (`proseWrap: always` @ 100, formats markdown + embedded code) + eslint for code +
  markdownlint-cli2 (`markdownlint/style/prettier` preset) as a structural markdown linter.
  No deno, no biome. See the Epoch 0 markdown item; it lands in `docs/FORMATTING.md`.
  Rationale: Biome too risky now; deno dropped (Daniel); prettier and markdownlint proven
  to coexist via the prettier preset. Revisit-when: the IDE-alignment validation (Axis 5)
  or a better single-tool option; `markdownlint --fix` usefulness is doubted and under test.
- License: MIT (public repo). State: decided.
- Runtime: Bun monorepo only. Deno parallel copies are reference-only.
- Migration style: clean-port plus provenance pointers. Each ported package carries a
  one-line `Ported from ai-garden@<sha>:<path>` note in its README. ai-garden persists,
  so full git history stays reachable without `git filter-repo` machinery.
- Migration philosophy: port mature components intact; extract reusable parts
  just-in-time, when a real second consumer needs them. Eager decomposition (SPLIT) is
  reserved for components whose seams and motivation already exist (epub-validate).
- v1 scope is validation-driven and deliberately unset. The inventory assigns verdicts,
  not a release cut.
- Alignment is designed fresh (no mature implementation exists to port).
- TTS is deferred reference - noted, not part of the initial consolidation.
- The player bake-off "winner" won against its own seed spec, which may not match
  prosodio's short-term goals; it is a revisit candidate, not a clean port.

## Scheduled unknowns (none block seeding)

There are no blocking open questions for Epoch 0/1. Remaining unknowns are scheduled into
the epoch that resolves them:

- EPUB production API shape (distinct from the `ParserOutput` parity schema) -> Epoch 2.
  Parser roles are already chosen in
  `epub-validate/docs/FINDINGS-epub-validate-2026-06-24.md` (epubts-node production,
  epubts-browser reference, Storyteller validator).
- Word-level alignment contract -> Epoch 4. Schema-lib and IDE alignment (Axis 5) ->
  deferred milestones. The decision log and per-epoch checklists carry live state.

## Axis 1 - Repository layout and architecture

Baseline taken from bun-one, which proved a single logic lib (`vtt`) and a single
component (`Timer`) can feed Vite, TanStack Start, and Astro/Starlight apps at once.

Established conventions to carry over:

- Bun workspaces with a three-way split:
  - `packages/*` - pure logic libraries, exported as raw `.ts` (no build step;
    `main`/`types`/`exports` point at the source file).
  - `components/*` - shared React UI libraries, kept separate from `packages/*` so
    Tailwind v4 `@source` paths stay clean.
  - `apps/*` - runnable applications (CLI and web).
- Shared root: `package.json` (workspaces + dependency catalogs), one `bun.lock`, base
  `tsconfig.json`, `eslint.config.js`.
- Internal dependencies via the `workspace:*` protocol.
- `data/` is volatile and `.gitignored` - the private side of the central corpora location
  (see Public/private boundary). Public fixtures live in the committed corpora root; public
  generated artifacts go in top-level `reports/`.
- Possible 4th top-level category for runtime/backend-bound code (depends on Bun/Node
  APIs or shells out to executables like ffprobe), to keep OS-dependent packages out of
  the frontend. See the Axis 2 dependency-isolation note. (open)

Tentative prosodio layout (to refine):

```text
prosodio/
  packages/
    epub-contract/         # ParserOutput schema + adapter assembler (parser-agnostic)
    epub-parser-epubts/    # @likecoin/epub-ts adapter (browser + node paths)
    epub-parser-storyteller/ # @storyteller-platform/epub adapter
    vtt/                   # speculative - only if extracted from apps/transcribe later
    transcription/         # optional: ASR core split out of apps/transcribe (renamed)
    align/                 # FRESH - the synchronization engine
  components/              # shared React UI (if the player reuses components)
  apps/
    transcribe/            # ASR CLI (renamed from whisper)
    player/                # web player (re-spec'd from bookplayer winner; TanStack Start)
    epub-validate/         # dev/validation harness (corpus + compare + report-writer)
  fixtures/test-books/     # committed PUBLIC corpora (audiobooks+ebooks); placement = publishable
  reports/                 # committed PUBLIC generated artifacts (whisper bench; maybe epub-validate)
  data/                    # gitignored: PRIVATE corpora + full reports (central, local)
  docs/                    # durable knowledge (bun, styling, CI, private-data, harnesses)
  thoughts/                # plans/research/tickets/reviews (this plan lands here on seed)
```

ASSUME / NOT SPECIFIED - epub-validate decomposition. The following is Claude's
unvalidated sketch of how the internal layers might map to packages. It has not been
specified or agreed, and exists only as a starting point to validate or discard:

- `packages/epub-contract` <- `schema.ts` (`ParserOutput`, the firewall; types inferred
  from Zod) + `adapter.ts` (`buildParserOutput`, the single validation assembler). No
  parser deps. This is the consolidated API every parser implements against.
- `packages/epub-parser-epubts` <- `epubts-browser.ts`, `epubts-node.ts`, the workers,
  `epubts-utils.ts`, `linkedom-quirks`. Deps: `@likecoin/epub-ts`, linkedom/jsdom,
  playwright.
- `packages/epub-parser-storyteller` <- `storyteller.ts` + worker. Dep:
  `@storyteller-platform/epub`.
- `apps/epub-validate` <- `corpus.ts`, `compare.ts`, `report-writer.ts`, `config.ts`,
  `index.ts`. Consumes the contract + parsers to produce comparison reports.

The production EPUB path = `epub-contract` + the chosen parser package(s). The
validation app is a separate dev concern that exercises all of them.

Two distinct uses the decomposition must serve (Daniel) - the sketch above does not yet
address their differing shapes:

- Comparing parser implementations (the validation harness).
- A simple consumption/extraction abstraction over one parser (likely epubts-node) for
  downstream use, e.g. alignment work.

Central problem (Daniel): the real requirement is reliably parsing Daniel's actual
library - many hundreds of books, some with badly-implemented EPUB specs. It is hard to
separate a parser's correctness from its robustness to broken content, since parsers
differ in how they tolerate bad input. The goal is not academic parser validation; it is
confidence that Daniel's consumption of the chosen library is reliable across his real
corpus. That is why comparison exists.

Layout questions (several now resolved by the epochs / boundary sections):

- Parser roles: RESOLVED in the epub-validate findings (epubts-node production, browser
  reference, Storyteller validator). Open instead: the production EPUB API shape (Axis-3
  EPUB notes + Epoch 2).
- Fixtures vs volatile data: DECIDED - public minimal corpora live in a committed root
  (e.g. `fixtures/` or `test/`; `test-books/` is the seed); volatile/private goes in a
  gitignored `data/` subtree (see Public/private boundary).
- epub-validate reports: RESOLVED by the boundary - full reports are private; storage
  model (private repo vs local) is a remaining decision.
- Doc/plans home: RESOLVED toward the `thoughts/` model + `docs/` (see Doc and agent
  structure), not a single top-level `plans/`.
- 4th top-level category for runtime/backend-bound code: deferred (see Axis 2 isolation).
- Open: does transcription ever split into `packages/transcription`, or stay inside
  `apps/transcribe`? (Just-in-time, per migration philosophy.)

## Axis 2 - Stack and tooling

bun-one's current answers, and the choices prosodio must consciously confirm or change.
Flagged as subtle: these are logged decisions, not yet made.

Requirements / rationale (Daniel) - the why behind the tooling, which matters more than
the tool names:

- Reusable React components across multiple apps and potentially multiple frameworks
  (Astro and TanStack Start), with a reasonable Tailwind/styling affordance.
- A coherent, maintainable way to handle dependency version updates across the monorepo
  (bun-one uses `"outdated": "bun outdated -r"`).
- A single CI target at the monorepo root that runs ALL of test / lint / check / format /
  etc - uniform invocation and universal coverage, callable entirely from root. bun-one
  fell short: its `check` target needed bespoke per-app invocations (the `check:starlight`
  / `check:tan-one` echo placeholders). prosodio must have no per-app escape hatches.
- A GitHub Actions story (greenfield - ai-garden and bun-one have none; nx-audiobook had
  nx-specific workflows `affected.yaml` / `unit.yaml` for reference):
  - Dependabot for automated dependency-update PRs (the cloud complement to the local
    `bun outdated -r`).
  - Run the root CI target on push / PR, executing at least the corpora-independent test
    suite. Corpus-dependent validation (epub / m4b across Daniel's hundreds of private
    books) is large and local-only - it does not run in Actions; gate it like
    `RUN_E2E_TESTS`.
- TanStack Start and Astro must be re-validated for the prosodio restart specifically:
  newest project starters, Bun compatibility. Notes may exist in
  `experiments/(seeds|docs)`, but they need re-validation (Astro v7, TanStack / vite+
  churn).

Tool selection criteria (a swap checklist): each choice records the rationale that
justified it, so a future swap is evaluated against explicit criteria, not vibes. A
replacement must meet or beat these.

- Bun (runtime + package manager + test runner + bundler)
  - speed.
  - OpenTUI compatibility - OpenTUI requires Bun at runtime (it uses `bun:ffi` for native
    Zig bindings); it type-checks under Deno but crashes at runtime there. A non-Bun
    runtime breaks OpenTUI-based TUIs (used in the bookfinder experiments).
  - simplicity: one toolchain covering runtime, install, test, and bundling.
  - first-class workspaces + dependency catalogs.
  - runs TypeScript directly (no build step for libraries).
- Formatter + linter
  - IDE parity is chief: official editor extensions across the VSCode forks
    (VSCode / Antigravity / Cursor) so CLI == IDE == CI (the Axis 5 observability point).
  - single-tool ideal, to shrink the alignment surface.
  - low config footprint: opinionated/deterministic defaults, minimal dotfiles.
  - markdown handling, including embedded fenced code with language ids (prettier supports
    this via `embeddedLanguageFormatting`).
- Test runner
  - native to Bun, zero extra config (part of the Bun simplicity rationale).
- Type-check
  - standard `tsc` with bundler resolution; per-app configs only where a framework forces
    it - but still invocable from root.
- Schema lib
  - criteria TBD (e.g. standard-schema compatibility, size, ecosystem); currently
    zod-leaning.
- Web frameworks
  - Bun compatibility; good component reuse with Tailwind; content-heavy output handled
    (Astro); avoid excessive framework legacy (the reason for moving off Next.js).

Each concern below lists its bun-one baseline, then the prosodio status.

- Runtime / lib build
  - baseline: Bun runs TS directly; libraries unbuilt
  - status: locked, keep
- Internal deps / versions
  - baseline: `workspace:*` + catalogs (zod, valibot)
  - status: keep
- Test
  - baseline: native `bun test`; happy-dom + RTL for components; `RUN_E2E_TESTS` gate
  - status: keep, plus an explicit split between corpora-independent tests (run in CI)
    and corpus-dependent validation (local-only, needs the private book corpora; gated
    like `RUN_E2E_TESTS`).
- Type-check
  - baseline: root `tsc --noEmit` (bundler resolution, strict,
    noUncheckedIndexedAccess); framework apps excluded from root
  - status: keep the base, but resolve the per-app exclusion properly - the `check:*`
    scripts are currently `echo` placeholders. The web player forces this.
- Format + lint
  - baseline: prettier + eslint v9 flat config
  - status: ADOPTED (see seed decision + Epoch 0 markdown item): prettier (format) +
    markdownlint-cli2 (structural lint); eslint for code. Biome too risky now; deno dropped.
    prettier formats embedded fenced code with language ids (`embeddedLanguageFormatting`).
  - seed decision (provisional, decided): adopt Codex's researched markdown spec - prettier
    sole formatter (`proseWrap: always` @ 100) + eslint (code) + markdownlint-cli2
    (`markdownlint/style/prettier` preset) structural linter; no deno/biome. See the Epoch 0
    markdown item. `markdownlint --fix` kept as manual-only and its usefulness is doubted.
    Revisit-when: the IDE-alignment validation (Axis 5) or a better single-tool option.
- Schema lib
  - baseline: zod and valibot both catalogued; `vtt` carries dual schemas
  - status: OPEN - standardize on one (zod dominates whisper + epub-validate) or keep
    dual.
- Dependency / runtime isolation (was mis-framed as "UI vs logic")
  - the real question is what can be transitively required and reused, across two cuts:
  - frontend reuse: can the framework (TanStack Start) reuse the React components well?
    The hard part was making Tailwind work properly across workspace components.
  - runtime binding: some code can only run on the backend - it depends on Bun/Node
    runtime APIs or shells out to executables (e.g. ffprobe). This must be isolated so an
    OS-dependent package is never accidentally pulled into the frontend bundle.
  - requirement (keep): backend-only dependencies must never enter browser/frontend
    bundles. Mechanism is OPEN and deferred: a 4th top-level dir is only one option;
    package exports, dependency rules, lint checks, and framework entry points may
    suffice. Defer the 4th category until a concrete package boundary needs it (codex).
- Shared data
  - baseline: `data/` at workspace root, volatile/gitignored
  - status: DECIDED - central corpora location + top-level `reports/`; gitignored `data/`
    holds private corpora/reports (see Public/private boundary).
- Web app framework
  - baseline: TanStack Start, Vite, Astro/Starlight all proven in bun-one
  - status: converging on TanStack Start (still a bit new) - chosen because Next.js
    (Daniel's go-to for years) now carries too much legacy and interacts poorly with Bun.
    Caveats: the vite+ ecosystem is churning (vitest, rolldown, Oxc), which also affects
    Astro. Astro/Starlight remains the sane way to handle content-heavy output (e.g.
    Daniel's generated reports) - the reason starlight is in bun-one. Astro just released
    v7, which probably breaks current assumptions.

Config-footprint constraint (Daniel): minimize dotfile litter (prettier, tsconfig,
eslint, etc.). Prefer tool defaults; defaults are often not good enough, so the fallback
is a single consolidated dotfile in the repo - and even that is not always workable.
bun-one is the closest workable setup we have. This is a tracked requirement to resolve
over milestones, not to perfect now.

Known tooling debt to clear during migration:

- Corrected: there is NO vtt dedup debt. `apps/whisper`'s `lib/vtt.ts` is the trusted,
  more-complete VTT; the standalone `@bun-one/vtt` package is not trusted. The bun-one
  retrospective's "duplicate vtt" framing does not reflect Daniel's assessment.
- `epub-validate` must be re-tooled from its own toolchain onto prosodio's axis-2 choices.

## Axis 3 - Component inventory

Two independent dimensions, easily conflated:

- Implementation maturity - how finished the code is. A component can be a proof of
  concept that demonstrates a pattern (bun-one's `vtt`/`epub` prove the
  extract-into-`packages/` pattern; their implementations are provisional) or it can be
  real substance (epub-validate's parsing).
- Port-shape - how the code moves. The unit of consolidation is the internal layer, not
  the directory. Some components port as-is, some are pattern-only references, and some
  must be split into several independent parts.

Verdict legend (port-shape):

- ASSESS - quality/fitness not yet evaluated; verdict pending a real read of the code.
- PORT - clean-port into prosodio as one unit.
- SPLIT - decompose into multiple independent parts along existing internal seams.
- PORT+DECIDE - port, and it resolves an open choice for us.
- REVISIT - strong candidate, but re-spec before porting.
- FRESH - design new; existing work is reference only.
- REFERENCE - mine for ideas / pattern only; do not port the implementation.
- DEFER - out of initial scope, revisit later.
- OUT - not a prosodio concern; stays in ai-garden.

### Bun-side core (maturity varies, graded per row)

- VTT handling - ASSESS (corrected)
  - The trusted, more-complete VTT code lives INSIDE `apps/whisper` (its `lib/vtt.ts`).
    The standalone `bun-one/packages/vtt` (`@bun-one/vtt`) is NOT the real thing (Daniel:
    "not a thing"). Claude's earlier claim that the app's vtt is a "duplicate" to be
    replaced by the package was FALSE - it is the reverse. If a shared vtt library is ever
    needed, it would be extracted from `apps/transcribe` just-in-time, not adopted from
    the POC package.
- `bun-one/apps/whisper` (`@bun-one/whisper`) - PORT
  - The most mature whisper.cpp wrapper for our purposes; supersedes
    whisper-sh/whisper-bench. Active, tested ASR pipeline CLI. Becomes `apps/transcribe`
    (renamed), moved intact. It also holds the only trusted VTT implementation
    (`lib/vtt.ts`). Defer any extraction of vtt or transcription into shared packages
    until a second consumer actually needs them.
  - validate: e2e transcription on a sample m4b produces the expected VTT.
- `epub-validate/` (repo root) - SPLIT (shape NOT specified)
  - The real EPUB substance (Daniel's assessment), currently one consolidated space;
    Daniel expects it splits on the way in. The decomposition in Axis 1 is Claude's
    unvalidated sketch, not an agreed design - not specified or thought through.
- `bun-one/packages/epub` (`@bun-one/epub`) - REFERENCE
  - Toy single-file parser; pattern-only. Superseded by the epub-validate decomposition.

### External repos to merge (outside ai-garden)

`../nx-audiobook` is a pnpm + nx monorepo from 2022 - itself an earlier attempt to
consolidate tooling and enable reuse. It is a third toolchain (alongside ai-garden's
Bun and Deno), which is part of why getting a handle on this is such a development tax.
Its layout: `apps/{validate, view-t3}`, `packages/{file-walk, time, validators}`.

- `apps/validate` - KEEP candidate (Daniel)
  - Validate audiobook metadata. The part Daniel wants to keep - not the convert/view
    stuff.
- `packages/validators` - KEEP candidate (Daniel)
  - A reasonably good validation abstraction. Core is a generic `Validation` result type
    (`{ ok, level: error/warn/info, message, extra }`) plus file-oriented validators over
    `FileInfo`. Only ever used for audiobook-collection validation, but the abstraction is
    general.
- `packages/file-walk` - ASSESS
  - Filesystem traversal; provides `FileInfo`. Dependency of validators.
- `packages/time` - ASSESS
  - Not read; possibly timecode utilities relevant to vtt/alignment.
- `apps/view-t3` - ASSESS (likely OUT)
  - T3-stack viewer; probably the convert/view era Daniel does not want. Confirm before
    dropping.

Observation (OPPORTUNITY, not a decision): `packages/validators`' generic `Validation`
type and epub-validate's own `ParserOutput`/`ComparisonResult` schemas are parallel
inventions of a "validation result" abstraction in different toolchains - "might well
have served for epub-validate if only there was a way." A unified validation abstraction
reused across epub, audiobook-collection, and m4b validation is a candidate prosodio
capability. Recorded as a delayed opportunity; not designed here.

### Capabilities to build or judge

- Audio-to-text alignment (`audio-deno-match`, `chapter-marks-match`, external
  `syncabook`) - FRESH
  - No mature implementation. Design alignment clean against the new pipeline contract;
    treat the experiments and syncabook (SMIL / media-overlay style sync) as reference
    inputs only. The hard core problem; gets its own research track.
- Player - winner `experiments/bookplayer-agy-opus46` (Opus; TanStack Start, React 19,
  epub.js) - REVISIT
  - Leading candidate, but re-spec against prosodio short-term goals before porting.
    Runner-up `bookplayer-codex-gpt-5.3-codex` noted for CI / validation discipline.
- Other `experiments/bookplayer-*` (claude-opus-46, codex, opencode-gemini3pro) -
  REFERENCE
- Finder - winner `experiments/bookfinder-opencode-gpt-5-2` (ffprobe metadata scanner
  CLI, Commander) - DEFER
  - Adjacent capability (library scanning), likely a later phase.
- Other `experiments/bookfinder-*` (claude-opus-4-5, kimi, antigravity, opencode,
  gemini-3-pro) - REFERENCE

### Legacy prototypes (audiobook / ebook related)

- `book-reader/` (static epub.js reader) - REFERENCE
  - Early prototype; superseded by player work.
- `audio-reader-vite/`, `audio-reader-html/` - REFERENCE
  - Early VTT-display players; media-chrome ideas worth a glance.
- `highlight-cfi/` - REFERENCE
  - CFI highlighting logic - candidate to mine into the player port.
- `whisper-bench/`, `whisper-sh/` - DEAD
  - Already superseded and dead; just not deleted yet. Nothing to capture or port; delete
    from ai-garden.
- `whisperkit-cli/` - REFERENCE
  - Different ASR backend (WhisperKit / CoreML, not whisper.cpp). Keep as reference for an
    alternate transcription path.
- `deno-one/packages/{epub,vtt}` - REFERENCE
  - Deno ports; dropped (Bun-only).
- `tts/` (dizzy-skel, eleven-audio, qwen3-tts) - DEFER
  - Narration; revisit after core consolidation.
- `PLAN-BookSearch-2025-03-25.md`, `workshop-5-openai-pinecone/` - DEFER
  - Novel Q&A / semantic search; adjacent, later.

### Out of prosodio scope (stay in ai-garden)

`agents/`, `langchain-js-local-ollama/`, `mastra-101/`, `ollama*/`, `llamaIndex-client/`,
`local-open-interpreter/`, `ink-cli/`, `ink-hello/`, `tui-pubsub/`, `smart-band/`,
`uv-one/`, `logo-ai/`, `llm-tool/`, `external-repos/` - general AI / agent experiments,
not part of the audiobook / ebook product.

## Axis 4 - AI harness enablement

The repo must support multiple AI harnesses working properly, and must let skills and
MCPs be explored without one harness's conventions taking over. Baseline: the
`experiments/` framework (harness-neutral docs + AGENTS.md + seeds), not bun-one's
`.claude/`-flavored config.

Harness tiers:

- First-class (must work): Claude Code and Codex (App) - the two SOTA-model harnesses.
- Best-effort: Antigravity, hermes, and Cursor (under consideration; long-time prior
  IDE). These should work via the same neutral layer but are not gating.

Principles:

- AGENTS.md is the single source of agent instructions. Any harness-specific file
  (`CLAUDE.md`, etc.) is a thin pointer to it, never a maintained duplicate. (Today
  `bun-one/AGENTS.md` and `bun-one/CLAUDE.md` are byte-identical - the anti-pattern.)
- Shared knowledge lives as plain `docs/*.md` any agent reads: how to use bun, styling,
  the CI contract, workspace conventions, markdown rules. Port from
  `experiments/{BUN_TANSTACK,STYLING,MARKDOWN,WORKSPACE}.md`.
- Binding decisions and rationale - the Axis 2 stack swap-checklist, repo conventions,
  and the CI contract - must live in this known, agent-readable home (AGENTS.md plus
  `docs/`), so every harness is aware of them and does not violate them. This plan is the
  working record; the agreed subset graduates into that home.
- Honest limits of neutrality: Claude Code skills are Claude-specific and MCP config
  formats differ per harness. Isolate these in small, clearly-labeled per-harness files
  so they cannot reshape the repo; express the portable equivalent (workflows, commands)
  as plain docs.
- This layer is moved, ported, tested, and evaluated like code: verify at least two
  harnesses actually work against it before blessing it.

Concrete design and acceptance for this axis now live under the epochs in "Doc and agent
structure" and "AI harness enablement (empirical compatibility program)". Remaining open:
the sync mechanism for AGENTS.md -> per-harness pointers (symlink / generator / import),
and the minimum portable MCP-config approach.

## Axis 5 - IDE config alignment

Scope: DEFERRED. Daniel's assessment is that IDE alignment is likely a bigger effort
than the entire consolidation port, so it is explicitly not in scope now. It is captured
here as a tracked milestone to resolve over time, not a near-term task.

The editors in play (VSCode, Antigravity, Cursor) are all VSCode forks, sharing the
extension ecosystem and `settings.json` schema. The pain Daniel calls out: making each
editor's lint/format/on-save behavior match the CI target exactly, validating that it
matches, and keeping it from drifting - a burden multiplied per editor.

Goal: one shared editor config, derived from a single source of truth (the CI tooling
target), with minimal per-editor bespoke settings, and ideally a check that flags drift
rather than relying on memory.

Observability principle (Daniel): Claude has zero visibility into the IDE, and the
Claude editor plugins (Antigravity especially) are thin, unreliable CLI wrappers. So the
IDE cannot be the source of truth - the only thing both Daniel and Claude can observe
identically is a CLI command's output. The contract is therefore: a committed config
file plus one authoritative CLI command is the ground truth; the IDE is a downstream
mirror. Claude proves compliance by running that command and showing its output (never
by claiming "it looks clean"); Daniel owns proving the IDE matches the same command.
Any IDE-vs-CLI disagreement is an isolatable IDE-config bug, not a rules question. This
generalizes past markdown to every Axis 2 / Axis 5 check.

Coupling to Axis 2: this axis is the strongest practical argument in the format/lint
fork. A single-tool target (Biome: one binary, one config, one extension that works
across all three VSCode forks) collapses alignment to near-zero. prettier + eslint means
two tools and several plugins to keep aligned across three editors, with independent
version drift - precisely the burden described. So Axis 5 should drive the Axis 2 choice,
not merely follow it.

Open questions:

- Single source of truth for tool versions (root `package.json` / catalog) that both CI
  and editor extensions consume, so they cannot diverge.
- Whether an automated drift check is worth building, or convention + a short doc suffices.

## Pipeline contract

The end-to-end data flow the architecture serves:

```text
epub  --parse--►  structured text + spine
audio --ASR----►  transcript (vtt)
              └-► align(text, transcript) --► synchronized timeline
                                          └-► play (web player)
```

## Epochs

Replaces the earlier flat migration order. Each epoch becomes a living checklist as we
execute (`- [ ]` / `- [x]`). Ordered so each epoch proves the conventions the next relies
on.

### Epoch 0 - seed and operating contract

Granular checklist - each step is ~one commit; work top-to-bottom; this is the live
tracker (details for each step live in "Seed procedure" and the "Markdown" spec below).

Repo init (git first - nothing is ever untracked):

- [x] 0.1 Create the repo dir and `git init` BEFORE any file (nested `ai-garden/prosodio`
      for visibility, `mv` to the sibling at handoff).
- [x] 0.2 Commit: MIT `LICENSE` + `README` stub.
- [x] 0.3 Commit: `AGENTS.md` (canonical) + thin `CLAUDE.md`.

Bun workspace (generate, then edit deliberately - see Seed procedure):

- [ ] 0.4 `bun init`; review the generated `package.json`/`tsconfig.json`/`.gitignore`; commit.
- [ ] 0.5 Edit `package.json`: `private`, `type: module`, workspaces globs
      (`packages/*`, `components/*`, `apps/*`), empty `runtime` catalog; commit.
- [ ] 0.6 `bun add -d` tooling: typescript, @types/bun, prettier, eslint, @eslint/js,
      typescript-eslint, markdownlint-cli2; commit.
- [ ] 0.7 eslint flat config (current typescript-eslint docs) + root scripts
      (`fmt`, `fmt:check`, `lint`, `lint:md`, `check`, `test`, `test:e2e`, `ci`, `outdated`); commit.

Markdown / format gates (spec + gates G1-G5 in the Markdown item below):

- [ ] 0.8 G1: prettier config in `package.json` + single `.markdownlint-cli2.jsonc` (prettier
      preset) + `.prettierignore` for generated artifacts; commit.
- [ ] 0.9 G2: `bun run fmt` twice -> empty `git diff` (idempotent).
- [ ] 0.10 G3: `bun run fmt:check && bun run lint:md` exit 0 and change no files.
- [ ] 0.11 G4: `.vscode/extensions.json` + `settings.json` (prettier format-on-save +
      markdownlint diagnostics); commit.
- [ ] 0.12 G5: review and simplify the `package.json` script names; commit.
- [ ] 0.13 `docs/FORMATTING.md` + `docs/MARKDOWN.md` (Codex spec + `experiments/MARKDOWN.md`,
      cross-referencing); commit.

Scaffold + boundary + CI:

- [ ] 0.14 Dir scaffold (`packages components apps docs thoughts/{plans,research,tickets,reviews}
      fixtures reports`) with `.gitkeep`; gitignore `data/`; commit.
- [ ] 0.15 Public/private conventions: `.env.example` for corpus paths (no absolute paths) +
      the central-location config note (see "Public/private boundary"); commit.
- [ ] 0.16 `bun install && bun run ci` green on the empty workspace (`bun run fmt` first if
      needed); commit.

Handoff (only after gates G1-G3 are green - see Handoff):

- [ ] 0.17 Move this plan to `prosodio/thoughts/plans/`; reflow with prettier (proseWrap @ 100);
      confirm gates; commit in prosodio.
- [ ] 0.18 Replace the ai-garden copy with a one-line pointer to the new home.
- [ ] 0.19 (if nested) `mv prosodio ~/Code/iMetrical/` to the canonical sibling.

Markdown formatting / linting (spec for steps 0.8-0.13; decision recorded, validated via
the gates):
  - Adopted approach (Codex's research): prettier is the ONLY formatter (prose + fenced
    code with language ids); config in `package.json` (`proseWrap: always`,
    `printWidth: 100`, `embeddedLanguageFormatting: auto`, `endOfLine: lf`). markdownlint is
    a STRUCTURAL linter, not a formatter: one `.markdownlint-cli2.jsonc` using the
    `markdownlint/style/prettier` preset (disables the rules prettier owns, line length
    included) - so a single config, not the two-file bookfinder split. No deno, no biome.
    CI checks both without writing. IDE = prettier format-on-save + markdownlint
    diagnostics; NO markdownlint fixAll-on-save.
  - `markdownlint-cli2 --fix`: usefulness DOUBTED (Daniel). Keep only as an explicit manual
    repair (`lint:md:fix`), never in CI, never on-save. Validate whether it adds anything
    over prettier (hypothesis: largely a no-op); drop it if it does not earn its place.
  - Document in the new repo: `docs/FORMATTING.md` (tool choices, configs, commands, IDE)
    and `docs/MARKDOWN.md` (style conventions, adjusted from `experiments/MARKDOWN.md`);
    the two cross-reference each other.
  - Validate in the new repo (practical tests): prettier formats this doc deterministically
    (proven - a ~845-line one-time reflow from 80 to 100 cols); markdownlint's prettier
    preset is recognized and the formatted doc passes (pending); `--fix` usefulness
    (pending); IDE/`.vscode` format-on-save matches the CLI (testable eventually, per the
    Axis-5 observability rule: CLI is ground truth, IDE mirrors).
  - Where it lives (artifact map; documented in `docs/FORMATTING.md`):
    - `package.json` - prettier config + scripts (`fmt`, `fmt:check`, `lint:md`,
      `lint:md:fix`, `ci`). Keep prettier config here to avoid another dotfile.
    - `.markdownlint-cli2.jsonc` - the single markdownlint config (prettier preset, globs,
      ignores). No second `.markdownlint.*`.
    - `.prettierignore` - generated artifacts only (dist, coverage, data, reports/generated).
    - `.vscode/extensions.json` + `.vscode/settings.json` - recommended extensions and the
      format-on-save baseline, shared across VSCode / Cursor / Antigravity.
    - `docs/FORMATTING.md` (tool choices, responsibilities, commands, IDE, agent rules) and
      `docs/MARKDOWN.md` (style conventions), cross-referencing each other.
  - How to re-validate (repeatable; codify as a check, not a one-time ritual - this is the
    point of "getting it right"):
    - idempotence: `bun run fmt` twice, then `git diff` is empty (no churn on a second pass).
    - clean gate: `bun run fmt:check && bun run lint:md` exits 0 and modifies no files.
    - golden fixture: a known-ugly markdown fixture (wide tables + embedded code) formats to
      a committed expected output - proves the formatter does what we intend, and catches
      regressions on tool upgrades.
    - IDE<->CLI parity (Axis 5, eventually): format-on-save a scratch file and confirm it
      matches `bun run fmt`; any mismatch is an IDE-config bug, not a rule change.
    - Run this whole procedure on every prettier / markdownlint version bump (the revisit
      trigger); `outdated` / Dependabot surfaces the bumps.
  - Validation order (gates - each must pass before the next; Epoch 0's markdown sign-off,
    simplified per Codex):
    1. G1 - configs exist: prettier config in `package.json` + single
       `.markdownlint-cli2.jsonc` (prettier preset).
    2. G2 - idempotent: `bun run fmt` twice -> empty `git diff`.
    3. G3 - clean gate: `bun run fmt:check && bun run lint:md` exit 0 and change no files.
    4. G4 - editor uses prettier (format-on-save) + markdownlint (diagnostics).
    5. G5 - review gate (Daniel): once functional, simplify and validate the `package.json`
       script targets/names.
    After G1-G3 are green, this plan doc is reflowed (prettier proseWrap @ 100) and handed
    off (see Handoff). Non-blocking follow-ups (NOT gates): a golden-fixture regression
    test; evaluating whether `markdownlint --fix` earns its place (`lint:md:fix` omitted
    initially).

Seed procedure (document first, then execute - hard rule):

- Generate first, then edit deliberately. Use generators where useful (`bun init`,
  `bun add`), then explicitly edit and validate the config - generated output is a starting
  point, not architectural truth. The narrow hard rule: never INVENT dependency versions by
  hand; versions come from `bun add` / the registry. Use current docs (Context7 / WebFetch)
  and the scaffold CLI output as the reference for versions/scripts, then adjust with intent.
- `bun init` at the prosodio root -> base `package.json`, `tsconfig.json`, `.gitignore`
  (origin: Bun official init).
- Configure workspaces: globs `packages/*`, `components/*`, `apps/*` (origin: bun-one
  `docs/WORKSPACE-BUN.md`, validated pattern).
- Add a `runtime` catalog for shared dependency versions; populate it only as real deps
  are added (origin: bun-one catalogs).
- Dev tooling via `bun add -d`: typescript, `@types/bun`, prettier, eslint, `@eslint/js`,
  typescript-eslint - versions as bun resolves them, never hand-pinned. eslint flat config
  from the current typescript-eslint setup docs. Exact version pinning is DEFERRED until
  tool choices stabilize (pinning now would hinder validating md formatting across versions);
  commit `bun.lock` regardless.
- Root scripts (`ci`/`fmt`/`lint`/`check`/`test`): adopt bun-one's documented set, verified
  against the generated `package.json`.
- Each adopted choice (workspaces, catalog, every library) is documented with its origin
  before it is materialized.

### Epoch 1 - transcribe (first port)

First product milestone: a working reproduction of whisper - NOT an extracted vtt package
and NOT an end-to-end player. `bun-one/apps/whisper` is already the consolidated, mature
implementation; nothing is needed from the dead `whisper-sh` / `whisper-bench`.

- [ ] Clean-port `bun-one/apps/whisper`, keeping its trusted VTT implementation internal.
      The rename (-> `apps/transcribe`?) and the equivalence/acceptance contract are settled
      during Epoch 1 execution, not pre-specified here (deferred per Codex).
- [ ] Point it at the central corpora location and `reports/` output; adjust paths only.
- [ ] Prove the root CI target includes the app.
- [ ] Use the port to validate runtime-bound package/app conventions.
- [ ] Acceptance: judged by Daniel at port time (see Port strategy and provenance).

### Epoch 2 - EPUB parsing and validation

- [ ] Port `epub-validate` with its validated findings intact; keep `ParserOutput` as the
      parser-parity contract.
- [ ] Introduce the smallest production EPUB abstraction an actual consumer justifies - do
      not turn the validation adapter boundaries directly into production packages.
- [ ] Keep browser (Playwright) and Storyteller machinery out of production dependency
      graphs.
- [ ] Move full-corpus reports to the private workflow; keep public deterministic
      fixtures/summaries sufficient to test the tool.
- [ ] Use this port to exercise dependency sharing, runtime isolation, and dead-dependency
      checks deliberately.

### Epoch 3 - audiobook collection validation

- [ ] Assess and port the useful `nx-audiobook/apps/validate`, `validators`, and required
      file-walking.
- [ ] Re-evaluate the generic `Validation` abstraction against real EPUB-validation needs;
      do not unify models just because both say "validation".
- [ ] Exclude the old viewer/conversion surface unless a fresh requirement justifies it.

### Epoch 4 - alignment research

- [ ] Port or mine `audio-deno-match`, `chapter-marks-match` under Bun (candidates, not
      mature alignment architecture).
- [ ] Define evaluation corpora and metrics before selecting an algorithm.
- [ ] Develop the word-level alignment contract in a dedicated plan, informed by the now
      real transcription and EPUB APIs. Its location model, metrics, and confidence
      representation are premature here.

Player, finder, TTS, and search remain later capability decisions, not implied members of
an initial release.

## Port strategy and provenance

For substantial sources (whisper, epub-validate), use two logical phases even when some
path/config changes are needed immediately:

- Behavior-preserving port: copy the source, record its exact source repo SHA and path,
  make only the changes needed to run in prosodio, and satisfy an explicit equivalence
  check.
- Native normalization: rename, split packages, change config in reviewable follow-ups.

This makes regressions attributable and compensates for not importing git history.
Provenance is recorded centrally in `provenance.md`: component, source repo, source commit,
source path, worktree state, target path, port commit, equivalence evidence, intentional
deviations. Package READMEs link to it rather than each inventing wording.

Whisper "reproduce" acceptance: TO BE JUDGED BY DANIEL at port time. Approach: port as-is,
make it run, then adjust source/destination paths to the new layout and public/private
boundary. Low expected difficulty beyond adapting to prosodio's evolving standards. The
codex candidate evidence (existing tests pass; a public fixture yields semantically
equivalent VTT; cache/runner/segmentation/failure behavior stays covered; a private-corpus
smoke run via external-data config; recorded performance) is available as a checklist if
Daniel wants it, not a required gate.

## Public/private boundary

State: decided. prosodio will be public; real corpora and identifying/derived reports stay
private. Designed during Epoch 1 because both whisper and EPUB validation need it.

- Public, committed: a single designated corpora root in the repo (path TBD, e.g.
  `fixtures/test-books`; ai-garden's `test-books/` is the seed, epub-only for now). Simple
  documented rule (Daniel): placing a file under that committed root IS the declaration
  that it is safe/legal to expose on GitHub - the location is the contract, no per-fixture
  license ceremony. Also public: unit/integration tests that run without private data;
  schemas, report generators, benchmark runners; small synthetic/public golden outputs.
- Private, local: raw audiobook+ebook corpora and full generated reports live outside
  tracked Git content (a gitignored `data/` subtree, still inside the worktree); a gitignored local config (or env
  vars) maps logical corpus names to paths (`.env.example`, never absolute paths).
- Central locations via monorepo-wide config (Daniel): ONE central place for corpora -
  public and private, audiobooks and ebooks - plus one top-level `reports/` for public
  generated artifacts (at first just the whisper benchmark; maybe an epub-validate run on
  test-books). A monorepo-wide config maps logical names to physical locations (committed
  public corpora root, gitignored private `data/`, `reports/`, optional external).
  Subprojects consume this config; they do NOT hardcode paths or invent per-app env vars.
  Per-output policy may still evolve per subproject.
- Gating: adapt whisper's existing `RUN_E2E_TESTS=1 bun test` pattern. Two distinct
  concepts that must not be conflated: long E2E tests vs private-corpora access - they may
  need separate gates. `bun run ci` operates only on public fixtures and is the GitHub
  Actions gate.
- Identity (decided, pragmatic): if a report is private, its filenames are private too;
  public summaries omit filenames (and titles where easy). Keep this proportionate - NOT a
  strict security program. Current corpora metadata is already public in ai-garden; the
  goal is to be slightly better going forward, not to retrofit. A deliberate promotion step
  produces any public summary; a full private report is never auto-copied into the repo.
  Heavy sanitization tooling (per-field scrub tests, SHA-fingerprint handling) is optional,
  added only if a real need appears.

## Doc and agent structure (Epoch 0)

A starting point, documented as adaptable, with hints for the future - not a finished
framework. Simpler than a full architecture/decisions/development tree (Daniel: drop the
heavy `decisions/` + `development/` split).

- `AGENTS.md` - canonical, short normative instructions; links to deeper docs.
- `CLAUDE.md` - thin pointer/import only; never restates instructions.
- `README.md` - product, capabilities, entry points (for humans).
- `docs/` - durable plain-markdown knowledge (bun usage, styling, CI contract, workspace
  conventions, private-data rules, ai-harness notes), ported from
  `experiments/{BUN_TANSTACK,STYLING,MARKDOWN,WORKSPACE}.md`.
- `thoughts/` - the working model already used in experiments (elixir_one,
  bookfinder-opencode): `plans/`, `research/`, `tickets/`, `reviews/`. Where in-progress
  work and this consolidation plan live and get discharged.
- `provenance.md` - central clean-port lineage (see Port strategy).
- No ADR/decision bureaucracy (Codex): durable decisions live contextually in
  `docs/<subject>.md`, superseded rather than rewritten when they change. `thoughts/` is
  experimental working space, not a system of record.
- OPEN (Daniel): whether `thoughts/` holds only a few active plans, or also longer-term
  issues/todos - pick the home for long-term issues/todos when the need is concrete.

The consolidation plan is a bootstrap/context artifact: once prosodio is seeded it moves
into `thoughts/plans/`, is progressively discharged into durable docs, and is eventually
archived. It does not remain the permanent architecture manual.

## Handoff (single source of truth)

Exactly ONE authoritative copy of this plan exists at any moment - never two.

- Now -> handoff: `ai-garden/plans/CONSOLIDATING-prosodio.md` is the sole authority. All
  edits happen here.
- Stale duplicate to clean up: an out-of-date copy exists at
  `prosodio/thoughts/plans/CONSOLIDATING-prosodio.md` from the earlier (failed) bootstrap.
  It is NOT authoritative. It gets removed/overwritten when the prosodio scaffold is
  re-seeded git-init-first. Do not edit it; do not treat it as real.
- Handoff event (the one moment it moves): when prosodio is seeded git-init-first AND its
  markdown gates G1-G4 pass. Then, in one step: move this doc into
  `prosodio/thoughts/plans/`, reflow it with prosodio's prettier (proseWrap @ 100), confirm
  it passes the gates, and commit it there.
- After handoff: prosodio's copy is the SOLE authority; the ai-garden copy is replaced by a
  one-line pointer to the new home (not a second living copy). All further edits, and the
  progressive discharge into `docs/*.md`, happen in prosodio only.

## AI harness enablement (empirical compatibility program)

Frame harness support as an evolving compatibility program, not a one-time neutral design
(Daniel: exploratory, expected to evolve).

- `AGENTS.md` canonical; harness-specific files are minimal adapters/pointers.
- Durable technical knowledge in plain `docs/*.md`.
- Skills added only for repeated workflows with evidence they help; portable workflow docs
  remain without the skill.
- MCP config documented per harness (storage/semantics not portable).

First acceptance check (intentionally modest): in a clean session, Claude Code and Codex
both discover the repo instructions, identify the same root CI command and private-data
restriction, and each make a small fixture-backed change and run the authoritative checks
without contradictory instructions. More ambitious evaluation (skills, subagents, MCP
equivalence) is added from observed failures, not predicted up front.

## Decision state model

State and validation are independent (replaces the earlier coarse "unmarked = assumption"
rule). For consequential items the decision log / decision records record:

- State: decided | provisional | proposed | open | deferred | superseded.
- Evidence: verified source, or explicit "not yet validated".
- Rationale: why this choice currently wins.
- Revisit-when: a concrete trigger (a second consumer, a failed browser-bundle check,
  measured incompatibility), not merely "later".

This need not appear on every bullet - it belongs in the decision log and focused decision
records. For revisitable tool choices the shape is: requirement + current best choice +
selection criteria (the Axis-2 swap-checklist) + revisit trigger. The format/lint seed is
the worked exemplar.

## Epoch 0-1 decisions (resolved or deferred this pass)

These gated Epochs 0-1; all are now settled or deliberately deferred to port time:

- Format/lint seed: DECIDED (provisional) - prettier + eslint incl markdown (see decision
  log / Axis 2).
- License: DECIDED - MIT.
- Whisper public contract: DEFERRED - judged by Daniel at port time (port as-is, make it
  run, adjust paths).
- Private regression-report storage: RESOLVED as a pattern - monorepo-wide location config
  (logical name -> `reports/` | `data/` | external); per-subproject policy settled when
  each lands.
- Corpus identity: RESOLVED (pragmatic) - private report implies private filenames; public
  summaries omit filenames/titles where easy; proportionate, not a strict program.
- Public-fixture rule: RESOLVED - a single committed corpora root (path TBD) is by
  convention the publishable set; placing a file there declares it safe to expose. No
  per-fixture license ceremony.

## Verification

This is a planning/bootstrap artifact, not code. Done means: self-contained and
codex-reviewable without external context; every component carries a state/verdict (some
remain ASSESS by design); the five axes, the epochs, and the open decisions are current;
and there are no hidden planning artifacts.
