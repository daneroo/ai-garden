# META-PLAN: OpenCode/Oh-My-OpenCode Experiment Workflow

**Purpose**  
Provide a repeatable, teachable workflow for running learning experiments with `opencode` + various kits in this repository.
Each experiment is isolated in its own subdirectory to ensure clean separation and focused learning.

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

## Use the agentic-cli for
