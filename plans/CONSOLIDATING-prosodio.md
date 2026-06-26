# Consolidating: prosodio

Status: planning (no code moved yet). This is the single source of truth for the
prosodio consolidation. It is meant to be reviewed by Daniel and by a second agent
(codex). Keep everything here - no hidden or external artifacts.

How to read this: unless a claim is explicitly marked VALIDATED, treat it as an
assumption to be checked, not a decision. Several early entries were written by Claude
asserting quality or structure it had not verified (flagged inline as ASSUME / NOT
SPECIFIED). The doc's first job is to enumerate those so they can be validated.

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

This effort is planning-only. No code is created or moved until this plan is approved.
Seeding the repo is a later, separate effort, out of scope here.

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

## Open questions

- prosodio short-term goals / north star - currently unstated. Drives v1 scope and the
  player re-spec.
- Axis 2 tooling forks (see that section): format/lint stack, schema lib, per-app
  type-check strategy, shared-data home.
- Axis 4 harness enablement (see that section): single-source AGENTS.md mechanism,
  portable MCP config, the "tested with two harnesses" acceptance gate (Claude Code + Codex).
- Axis 5 IDE alignment (see that section): single source of truth for tool versions;
  whether to build a drift check. Resolving the Axis 2 format/lint fork settles most of it.
- Canonical epub parser - chosen from epub-validate's findings.

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
- `data/` is conventionally volatile and `.gitignored` - so it is NOT the home for test
  fixtures or generated reports (those need different homes; see open questions).
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
  # possible 4th category for runtime/backend-bound code - see Axis 2 isolation note
  data/                    # volatile, .gitignored - NOT test fixtures or reports
  plans/                   # AI-accessible planning docs (docs/? plans/archive/? - open)
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

Open layout questions:

- Which parser adapter(s) become the production default vs validation-only? (Resolved by
  epub-validate's findings against the real corpus.)
- Does transcription split into `packages/transcription`, or stay inside `apps/transcribe`?
- Home for test fixtures / sample books - NOT `data/` (volatile/gitignored); fixtures may
  need versioning.
- Home for epub-validate reports - they need git history for human regression assessment
  across schema evolution, but should not leak into a public repo (tension to resolve).
- Is top-level `plans/` the right home for AI-accessible planning docs? Should there also
  be a `docs/` folder, and/or a `plans/archive/` for completed work?
- A 4th top-level category for runtime/backend-bound code (see Axis 2 isolation)?

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
  - markdown handling including embedded code blocks (deno fmt's notable strength).
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
  - status: keep prettier+eslint for now. Biome is interesting (single tool, would help
    Axis 5) but too risky at this point (Daniel). deno fmt is attractive - it even formats
    embedded code inside markdown, which prettier does not - but mixing the deno formatter
    into a bun toolchain is likely infeasible now. Expected to change over time.
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
  - implication: possibly a 4th top-level dir (alongside apps/packages/components) for
    backend/runtime-bound code, or another mechanism guaranteeing the separation - the
    same discipline already used to keep React components cleanly separated. (open)
- Shared data
  - baseline: `data/` at workspace root, volatile/gitignored
  - status: OPEN - fixtures and reports need non-`data/` homes (see Axis 1 open questions).
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
- `whisper-bench/`, `whisper-sh/` - REFERENCE
  - Superseded leftovers of the mature whisper app, never removed. Nothing to port;
    benchmark-method notes only. Also ai-garden cleanup candidates (remove from old repo).
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

Open questions:

- Mechanism for keeping the single AGENTS.md source and generated per-harness pointers
  in sync (symlink, generator script, or a one-line import directive).
- Minimum portable MCP config approach across the harnesses Daniel actually uses.
- What "tested with two harnesses" concretely means as an acceptance gate.

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

## Migration order

Dependency-ordered; each step gated by a validation criterion before the next begins.

- `vtt` - clean port; tests green.
- epub split - decompose epub-validate into `epub-contract` + parser packages + the
  validation app; run it to pick the production-default parser.
- `whisper` - port the ASR pipeline (dedupe vtt); e2e transcription matches.
- alignment - design fresh against the pipeline contract (the research track).
- player - re-spec against prosodio's short-term goals, then port from the winner.
- finder / tts / search - deferred capabilities, scheduled after the core proves out.

## Per-component migration specs

To be filled in once axes 1 and 2 are agreed. One subsection per PORT / PORT+DECIDE /
REVISIT component, each with: verdict recap, target slot (axis 1), tooling
normalization (axis 2), acceptance criteria, and provenance pointer.

## Milestones / epochs (deferred requirements)

Captured so they are not lost, explicitly deferred so they do not block the move. These
resolve incrementally inside prosodio once it exists, not here.

- IDE config alignment (Axis 5) - deferred; likely larger than the whole port.
- Axis 2 tooling forks - format/lint stack, schema lib, per-app type-check strategy -
  delayed; bun-one defaults stand in until revisited.
- Config-footprint minimization - prefer defaults, consolidate dotfiles over time.
- Per-component migration specs - filled in as each component is actually read.
- Unified validation abstraction - reconcile nx-audiobook `validators` with
  epub-validate's schema into one reusable capability (opportunity, delayed).

## First safe step (proposed, not executed)

Goal: a minimal prosodio repo that can host its own incremental objectives, with no
decisions baked in that we have chosen to delay.

Proposed first step (to confirm, not yet run):

- Create the sibling repo and `git init`.
- Stand up a minimal Bun workspace using bun-one's config as provisional defaults
  (root `package.json` workspaces, `tsconfig.json`, lint/format) - explicitly marked
  provisional, not endorsed.
- Copy this plan into `prosodio/plans/` as the context bridge, so the context survives
  the move.
- Port no components yet. The first component port becomes prosodio's own first
  objective, decided incrementally there.

Why this is safe: it is additive (a new repo), reverses by deletion, commits to none of
the delayed forks, and produces the "minimal setup" that lets prosodio take over its own
direction. Open: whether the seed copies bun-one config wholesale or starts barer
(delayed).

## Process / next steps

- Agree the four-axis framing and the baselines (bun-one for 1/2, experiments/ for 4).
- Resolve the axis-2 open tooling forks (or explicitly defer each).
- Design the axis-4 harness-enablement layer (it gates how every agent works in the repo).
- Pin prosodio's short-term goals - unblocks v1 scope and the player re-spec.
- Fill in per-component migration specs.
- Later, separate effort: seed the repo and begin the ordered migration.

## Verification

This is a planning artifact, not code. Done means: this file is self-contained, codex
can review it without external context, every component has a verdict, the three axes
and their open decisions are current, and there are no hidden artifacts.
