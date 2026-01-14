# META-PLAN: OpenCode/Oh-My-OpenCode Experiment Workflow

**Purpose**  
Provide a repeatable, teachable workflow for running learning experiments with `opencode` + `oh-my-opencode` in this repository. Each experiment is isolated in its own subdirectory to ensure clean separation and focused learning.

## Directory Strategy

- Location: All experiments reside in `./experiments/<YYYY-MM-DD>-<short-name>/`.
- Isolation: Keep all code, configuration, notes, and outputs strictly inside that directory.
- Hygiene: Do not modify unrelated directories or root configuration during an experiment unless the goal explicitly requires it.

## Start an Experiment (Create the Workspace)

- Define: Pick an experiment name and a clear goal (e.g., "tiny CLI tool to test arg parsing").
- Scaffold: Create the directory and minimal structure:
  - `README.md`: Describes the purpose, success criteria, and constraints.
  - `AGENTS.md`: Experiment-specific rules (overrides or additions to root AGENTS.md).
  - `notes/`: Directory for logs, architectural decisions, and learnings.
- Configure: Add an `AGENTS.md` in the experiment folder containing:
  - Goal: One sentence describing what we are building/learning.
  - Constraints: Timebox, target environment, specific tools to use/avoid.
  - Scope: "Only modify files under this directory."
  - Validation: How we will verify success (e.g., "CLI prints version").

## Configure Context for Oh-My-OpenCode

- Model Check: Confirm we are using OpenAI (Oracle) + Gemini (Frontend/Docs) as per root `opencode.jsonc`. No Claude.
- Agent Roles:
  - `@oracle`: Use for high-level architecture, stack choice, and trade-off analysis.
  - `@librarian`: Use to find external documentation, library comparisons, and usage examples.
  - `@explore`: Use to scan this repo for patterns or similar existing code (if any).

## Discovery Phase (Before Coding)

- Research:
  - Ask `@oracle` for 2–3 stack options suitable for the goal (listing pros/cons).
  - Ask `@librarian` for examples of specific libraries if chosen.
- Decision:
  - Select the stack/approach based on goals and constraints.
  - Document the decision in `README.md` or `notes/decision.md`.

## Planning Phase

- Draft Plan: Write a short execution plan in the experiment's `notes/` or `README.md`.
  - 3–6 clear, checkable steps.
  - Define "Done" for each step.
- Review: Ensure the plan is feasible within the timebox.

## Build Phase

- Implement: Execute the plan in small increments.
- Focus: Use agents for specific, targeted tasks (e.g., "Generate boilerplate for X", "Write a test for Y").
- Containment: Ensure all generated files land in the experiment directory.

## Validation Phase

- Verify: Run the minimal verification steps (build, test, `--help` output).
- Record: Detailed results in `notes/results.md` (what worked, what failed).

## Retrospective Phase

- Reflect: Summarize key learnings in `notes/retro.md`.
- Iterate: If a better workflow or pattern emerges, update this `META-PLAN.MD` to improve future experiments.
