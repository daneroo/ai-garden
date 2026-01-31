# META-PLAN: OpenCode/Agentic-CLI Experiment Workflow

## Purpose

Provide a repeatable, teachable workflow for running learning experiments with
`opencode` + `agentic-cli`.

Each experiment is isolated in its own subdirectory to ensure clean separation
and focused learning.

## Directory Strategy

- Location: All experiments reside in
  `./experiments/<YYYY-MM-DD>-<short-name>/`.
- Isolation: Keep all code, configuration, notes, and outputs strictly inside
  that directory.
- Hygiene: Do not modify unrelated directories or root configuration during an
  experiment unless the goal explicitly requires it.

## Start an Experiment (Create the Workspace)

- Pick an experiment name. e.g. bookfinder
- Scaffold: Create the directory and minimal structure:
  - Create the directory `./experiments/<YYYY-MM-DD>-<short-name>/`
  - Create README.md with
    - the experiment name as level 1 header (#)
    - Create `thoughts/` subdirectory for tickets/plans/reviews
- Open a new session of opencode in that directory
  - Use the agentic-cli command: /ticket to initiate the first ticket
  - After that is done propose the rest of the flow for that ticket
    - /research, /plan, /execute, /commit, /review
