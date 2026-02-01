# Experiments Organization

## Context

This repository is a large monorepo in the middle of consolidation.

At this stage, only these top-level directories are treated as "consolidated"
and actively curated:

- `agents/` - agents (runners) plus harnesses, tooling, workflows (Codex,
  OpenCode, Kilo, Claude, OpenCode+agentic-cli, etc.)
- `plans/` - cross-project planning and meta-docs (this directory)
- `bun-one/` - TypeScript/Bun sub-monorepo (in-progress consolidation target)
- `deno-one/` - Deno sub-monorepo (in-progress consolidation target)

Everything else at the repo root is considered "legacy" for now: not necessarily
dead, just not yet placed into the consolidated homes above.

The core requirement is a place to put experiments that is:

- Not tool-shaped (not specific to an agent like OpenCode vs Codex vs Claude,
  etc.)
- Separate from consolidated codebases (`bun-one/`, `deno-one/`)
- Separate from the legacy root
- Life-cycle: experiments are not permanent; for feature or process evaluation

This document proposes an organization that keeps experiments agent-agnostic
while still allowing any agent/harness to drop its own preferred artifacts into
an experiment directory.

## Terms

- **Agent (Runner)**: the concrete program you run that hosts the AI session and
  can act on the repo (tools/files/UX).
  - Examples: Codex CLI, OpenCode, Claude Desktop, Kilo, etc.
  - Note: this is a local definition for this repo; in other contexts "agent"
    may mean something else (sub-agents, planners, etc.).
- **Harness (Workflow/Loop)**: the repeatable process layered on top of an
  agent; it may be implemented by a plugin/kit and may generate its own
  artifacts.
  - Examples: agentic-cli's
    `/ticket -> /research -> /plan -> /execute -> /review
    -> /commit`,
    "Ralph Wiggum" loops, oh-my-opencode conventions, etc.
- **Experiment**: a small, time-boxed project that may evaluate both a code idea
  and an agent/harness combination.

## Decision: Add A Top-Level `experiments/`

Add a new top-level directory:

- `experiments/` - agent-agnostic experiment workspaces

Rationale:

- The primary organizing axis should be the experiment (the problem/project),
  not the agent (the tool).
- The same experiment can be attempted with multiple agents/harnesses over time
  without moving it. (How to structure multi-agent attempts within a single
  experiment is TBD—practice will inform conventions.)
- `agents/` stays dedicated to agent setup and harness/workflow docs, not
  project workspaces.

## Directory Structure

### Top-Level

```text
ai-garden/
  agents/
  plans/
  bun-one/
  deno-one/
  experiments/          # New: experiment workspaces (agent-agnostic)
  ... and remaining legacy project-dirs
```

### Experiment Workspaces

Each experiment is a subdirectory:

- `experiments/<YYYY-MM-DD>-<slug>/` (recommended naming; not enforced)

The only repository-level invariant is:

- `experiments/.../README.md` (required)

Everything else inside an experiment directory is optional and may vary by
agent/harness.

Examples of optional, agent- or harness-specific artifacts that may appear:

- `AGENTS.md` (Codex-style)
- `CLAUDE.md` (Claude-style)
- `thoughts/` (OpenCode + agentic-cli-style)

## README Recommendations

The experiment README is the integration layer across agents and harnesses.

Recommended README sections:

- **Name and date**: title matches the directory name.
- **Harness / workflow goal**: what is being evaluated about the process.
- **Problem / code goal**: what the experiment is building or testing.

## Target Organization or repository

- `experiments/` contains the project workspaces used for rapid iteration and
  agent/harness evaluation.
- `agents/` contains agent setup plus harness/workflow docs and reusable
  tooling.
  - Agent docs can recommend how to create an experiment, but they should point
    to `experiments/` as the workspace location.
- `bun-one/` and `deno-one/` are distinct top-level sub-monorepos/workspaces
  containing consolidated codebases (separate from the legacy root pile).

## Migration Plan of Existing OpenCode Experiment / Docs

Some existing harnesses already describe experiment isolation (for example,
OpenCode + agentic-cli under `agents/opencode/`).

## Tasks

These are the concrete actions this plan enables. We are not executing them in
this document; this is the checklist for later work.

### Phase 1 - Create A Shared Experiments Home

- Create `experiments/README.md`.
  - Include the parts of this document that should remain true after execution
    (Context, Terms, and the minimal structure expectations).
- Move existing experiment directories from `agents/opencode/experiments/` to
  `experiments/` (no refactors yet; preserve each experiment as-is).
- Review the final README.md for comleteness and simplicity - Requires Approval
- This review is a gate for proceeding to Phase 2.

### Phase 2 - Consolidate Experiment Docs (Optional / Likely)

- Evaluate whether any of the following should move into `experiments/` as
  shared guidance (and be consolidated/renamed), or remain under
  `agents/opencode/` as OpenCode-specific docs:
  - `agents/opencode/AGENTS.md` — **Examine placement and impact**: The behavior
    and placement of `AGENTS.md` within the new structure is currently
    undefined. Evaluate whether it stays agent-specific, moves to `experiments/`
    as shared guidance, or becomes a per-experiment artifact. Consider impact on
    existing experiments and agent/harness conventions.
  - `agents/opencode/ELIXIR.md` — **Park**: language/stack profile, no clear
    home yet (not experiment, not agent). Preserve for now.
  - `agents/opencode/EXPERIMENTS.md` — **Move**: experiment idea menu (PRD-like
    fodder), agent-agnostic → `experiments/IDEAS.md`
  - `agents/opencode/META-PLAN.MD` — **Merge**: generic workflow →
    `experiments/README.md`; agentic-cli specifics stay in `agents/opencode/`
- Address `thoughts/` directories: These are artifacts of the agentic-cli
  process and appear both at `agents/opencode/thoughts/` and within specific
  experiments. Preserve them but determine whether they should stay
  agent-specific or become part of the shared experiment structure.

### Phase 3 - Refactor / Simplify

- Review what now lives under `experiments/` after Phase 1 and simplify
  structure, naming, and duplication based on what actually gets used.
