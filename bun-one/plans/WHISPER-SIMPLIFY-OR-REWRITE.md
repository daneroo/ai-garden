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

Our goal is to transform this subproject (`bon-one/apps/whisper/` )

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

This master plan coordinates all whisper simplification work. Individual phases may have their own detailed sub-plans in this directory.

### Phase 0: Document Current State (COMPLETE when README exists)

- Extract architecture gems from V5 plan (Core Flow diagram, cache formats, etc.)
- Document current capabilities and constraints
- Create comprehensive README.md with analysis sections
- User annotates: what's working well vs pain points
- Checkpoint: README reviewed and approved

### Phase 1: Analyze and Decide Strategy (COMPLETE when strategy chosen)

Based on user feedback in README:

- Identify top 3 pain points
- Evaluate: incremental refactor vs partial rewrite vs clean rewrite
- Assess risk: what could we lose? What tests protect us?
- Define success criteria: how do we know we're improving?
- Choose strategy and create Phase 2 sub-plan
- Checkpoint: Strategy documented and approved

### Phase 2+: Execute Transformation (Strategy-dependent)

Possible strategies:

**Strategy A: Prototype-First (Recommended for Radical Change)**

- Build simplified version alongside existing code (e.g., simpler.ts)
- Prove new approach works with subset of features
- Gradually migrate tests and features to new implementation
- Switch over when parity reached
- Benefits: Low risk, can compare directly, easy to abandon
- Sub-plan: `WHISPER-PROTOTYPE-PLAN.md`

**Strategy B: Incremental Simplification (Safer but Slower)**

- Pick one module to simplify (e.g., segmentation.ts → inline)
- Refactor, ensure tests pass
- Repeat with next module
- Benefits: Always working, gradual improvement
- Risks: May not achieve radical simplification goal
- Sub-plan: `WHISPER-INCREMENTAL-PLAN.md`

**Strategy C: Clean Rewrite (Highest Risk)**

- Design new architecture from scratch
- Implement alongside old code (new directory?)
- Port tests incrementally
- Switch over when feature-complete
- Benefits: Clean slate, optimal design
- Risks: Feature loss, bugs, time investment
- Sub-plan: `WHISPER-REWRITE-PLAN.md`

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

All sub-plans live in `bun-one/plans/` beside this master plan:

Strategy-specific plans:
- `bun-one/plans/WHISPER-PROTOTYPE-PLAN.md`
- `bun-one/plans/WHISPER-INCREMENTAL-PLAN.md`
- `bun-one/plans/WHISPER-REWRITE-PLAN.md`

Feature implementation details:
- `bun-one/plans/WHISPER-CACHE-IMPL.md`
- `bun-one/plans/WHISPER-STITCH-IMPL.md`

Versioned iterations:
- `bun-one/plans/WHISPER-SIMPLIFY-OR-REWRITE-v1.0.md`
- `bun-one/plans/WHISPER-SIMPLIFY-OR-REWRITE-v2.0.md`

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
