# Experiments

Agent-agnostic experiment workspaces for this monorepo.

- Problem-first: Organize by experiment (problem/project), not by agent (tool).
- Isolated from consolidated code: Experiments live here, not in `bun-one/` or
  `deno-one/`, etc
- Isolated from legacy root: Separate from the unorganized project pile.
- Temporary by design: Experiments are for evaluation, not permanent homes.

## Terms

- Agent (Runner): The program hosting the AI session (Codex CLI, OpenCode,
  Claude Desktop, Kilo, etc.).
- Harness (Workflow/Loop): Repeatable process layered on an agent (agentic-cli's
  `/ticket → /commit` flow, oh-my-opencode, etc.).
- Experiment: Time-boxed project evaluating a code idea and/or agent/harness.

## Directory Structure

Each experiment is a subdirectory:

- `<YYYY-MM-DD>-<slug>/` (recommended naming; not enforced)
  - `README.md`: required
  - Harness artifact:`AGENTS.md`,`CLAUDE.md`, `thoughts/`,.. unproscribed (yet)
- `seeds/<slug>.md`: reusable idea specs (1 seed → many experiments)

### README Recommendations

- Name and date: Title matches directory name.
- Harness/workflow goal: What process is being evaluated.
- Problem/code goal: What the experiment builds or tests.
