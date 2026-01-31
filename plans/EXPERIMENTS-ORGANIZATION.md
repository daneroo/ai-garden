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

We also want to run many small experiments:

- Some experiments are about a code/product idea.
- Many experiments are also (or primarily) about evaluating an agent and its
  harness (process / "gen process evaluation") against that kind of work.

The core requirement is a place to put experiments that is:

- Not tool-shaped (not specific to an agent like OpenCode vs Codex vs Claude,
  etc.)
- Separate from consolidated codebases (`bun-one/`, `deno-one/`)
- Separate from the legacy root

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
  without moving it.
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

- `experiments/<YYYY-MM-DD>-<slug>/`

The only repository-level invariant is:

- `experiments/<YYYY-MM-DD>-<slug>/README.md` (required)

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
- `bun-one/` and `deno-one/` contain consolidated codebases.
  - Experiments should not "half-live" there; once promoted, they belong there.

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

### Phase 2 - Consolidate Experiment Docs (Optional / Likely)

- Evaluate whether any of the following should move into `experiments/` as
  shared guidance (and be consolidated/renamed), or remain under
  `agents/opencode/` as OpenCode-specific docs:
  - `agents/opencode/AGENTS.md`
  - `agents/opencode/ELIXIR.md`
  - `agents/opencode/EXPERIMENTS.md`
  - `agents/opencode/META-PLAN.MD`

### Phase 3 - Refactor / Simplify

- Review what now lives under `experiments/` after Phase 1 and simplify
  structure, naming, and duplication based on what actually gets used.
