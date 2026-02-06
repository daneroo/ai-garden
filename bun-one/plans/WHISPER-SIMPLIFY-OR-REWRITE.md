# Whisper Simplify or Rewrite Plan

Follows [WHISPER-TASK-REFACTOR-v5-PLAN.md](./WHISPER-TASK-REFACTOR-v5-PLAN.md)
and earlier plans

I want to simplify drastically the code for this cli

## Background

I have written at least four versions of this script

- `<repo>` - large monorepo of many ai related subprojects
  - some of which a (sub)-monorepos/workspaces: `bun-one`, `deno-one`
- `<repo>/whisper-sh` - to be sunsetted when our work is done
  - `whisper-sh/whisper.sh` 396 lines
  - `whisper-sh/whisper.mjs` 729 lines
- `<repo>/whisper-bench/` to be sunsetted when our work is done
- `<repo>/whisper-bench/**/ts` 2631 lines
- **`<repo>/bun-one/apps/whisper  (this one)`** 3216 lines (after
  simplification)

Many attempts have been made at refactoring, to preserve our considerable
feature set, testing and scripts, but this has not been satisfactory, i.e. too
incremental! I think we a need much more radical approach.

Because of my long experience I am always skeptical of a rewrite! (loosing
features, introducing new complexity and bugs...)

The facts are we have a cli tool, that largely does what is required, but we are
unhappy with the state of the artifacts. This is a home project, that will be
long lived, And a large part of our objectives is to write high quality code
that is understandable and testable. A secondary goal is to properly leverage
the use of agentic work clothes as we are doing now.

## Goal

Our goal is to transform this sub-project (`bon-one/apps/whisper/`)

To that end we should restate and document clearly it
Objectives/Architecture/Usage

SO we need to achieve a process of progressive planning that will avoid previous
pitfalls

- Over ambitious - so plans were not able the be complete
- Did not achieve

So we need an overarching plan, but its different phases need to be flexible and
incremental so we can continue until we meet success!

- Document Current and/or Desired state of Problem/Requirements/Architecture
  - There is a lot of great information in my previous plans, not all of it is
    accurate, but we should captyre some of its gem: an example is the
    `## Core Flow` in
    [WHISPER-TASK-REFACTOR-v5-PLAN](./WHISPER-TASK-REFACTOR-v5-PLAN.md);
    actually that is a great document with lots of good info
  - The permanent part of this should land in anew [README](../README.md)
- Decide on strategy for amelioration -rewrite of parts?
  - preserve and grow completeness and quality
  - establish that we are converging to a "better" solution

## The Process: Iterative Documentation → Analysis → Transformation

This master plan coordinates all whisper simplification work. Individual phases
may have their own detailed sub-plans in this directory.

### Phase 0: Document Current State (COMPLETE when README exists)

- Extract architecture gems from V5 plan (Core Flow diagram, cache formats,
  etc.)
- Document current capabilities and constraints
- Create comprehensive README.md with analysis sections
- User annotates: what's working well vs pain points
- Checkpoint: README reviewed and approved

### Phase 1: Analyze and Decide Strategy (COMPLETE)

Top 3 pain points identified:

- Sanity: Process complexity (though now documented)
- Code complexity: Works but too complex
- Over-architecture: Too involved for such a simple problem

Evaluation: Ship of Theseus approach

- Incremental rewrite AND refactor simultaneously
- Reimplement app in place, side-by-side with existing code
- New implementation: `whispernu.ts` + `libnu/*.ts`
- Old code stays in place (safety net)

Risk assessment:

- Minimal: Current working code exists, is tested, cannot lose it
- Main risk: Getting lost in new process and having to abandon
- Mitigation: Keep old code runnable throughout

Success criteria (subjective evaluation):

- Successful iteration of process
- Simplicity preserved, augmented, or achieved in each step
- Fewer interface types (target: reduce from 22)
- Simpler design and architecture

Strategy chosen: **Theseus** (progressive replacement in-situ)

Checkpoint: Phase 1 documented → See `WHISPER-SIMPLIFY-OR-REWRITE-v1.md`

### Phase 2+: Execute Transformation - Theseus Strategy

**Theseus: Progressive Replacement In-Situ**

Implementation approach:

- Create `whispernu.ts` (new main entry point)
- Create `libnu/*.ts` (new implementation modules)
- Keep existing `whisper.ts` and `lib/*.ts` untouched
- Both versions coexist during transition
- Incrementally prove new approach, migrate features
- Replace old with new piece by piece
- Remove old code only when new code achieves parity

Benefits:

- Low risk: can compare directly, old code always runnable
- Easy to abandon: just delete `nu` files
- Progressive: can ship improvements incrementally
- Testable: both implementations can run same tests

Iteration process:

- Define next feature/module to port
- Implement in `libnu/`
- Write/adapt tests
- Run CI, demo script
- Commit checkpoint
- Document iteration in sub-plan if complex (e.g., `v1.1`, `v1.2`)
- Repeat

### Invariants (Every Phase, Every Checkpoint)

Before considering any phase complete:

- `bun run ci` passes (format, lint, type-check, tests)
- `bun run fmt` applied
- `./scripts/demo/demo.sh` passes
- Changes committed with clear message
- If tests are removed, document why (obsolete? superseded?)
- Never break: caching, VTT output format, 37h segment limit

### Rollback Strategy

If any phase fails or gets stuck:

- Keep old code until new code proves itself
- Prototypes can be abandoned (mark with comments/renames)
- Document what was learned before abandoning
- Update this master plan with "what didn't work and why"

### Sub-Plan Naming Convention

Linear versioning: `WHISPER-SIMPLIFY-OR-REWRITE-v{major}.{minor}.md`

Examples:

- `WHISPER-SIMPLIFY-OR-REWRITE-v1.md` (Phase 1 checkpoint)
- `WHISPER-SIMPLIFY-OR-REWRITE-v1.1.md` (iteration details, if needed)
- `WHISPER-SIMPLIFY-OR-REWRITE-v2.md` (Phase 2 checkpoint)

All sub-plans must link back to this master plan

## Deferred Tasks carried over from previous plans

- Consider re-adding `--start` (doubtful)
- Write `.vtt` Provenance metadata as part of frascribe task -> including
  segments
- Make stitch a proper Task (uniform task list: N\*(wav+transcribe)+stitch)
- Extract `runTask`/monitors to `lib/spawn.ts`
- Artifact directory reorganization
- Second use case: short word/phrase transcription (separate entrypoint)
- Metadata flow improvement (segments write own provenance)
