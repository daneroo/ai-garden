# Global Agent Guidelines

**Purpose**  
Global guidance for experiments in this repository using `opencode` + `oh-my-opencode`.

## Rules

- Directory Isolation: All experiments must live under `./experiments/<YYYY-MM-DD>-<name>/`.
- Scope Enforcement: Do NOT modify files outside the active experiment directory unless explicitly requested by the user.
- Model Constraints:
  - No Claude: Do not assume Claude availability.
  - Primary Models: Use OpenAI (Oracle) and Gemini (Standard/Flash) as configured in `opencode.jsonc`.
- Configuration: Each experiment directory MUST have its own `AGENTS.md` to define local context and rules.

## Markdown Guidelines

- Make markdown content **markdownlint friendly**.
- Use unnumbered lists (`-`) instead of numbered lists (`1.`) to ease editing.
- Use **bold** and _italics_ sparingly (exceptions only, not for every list item).

## Standard Workflow

- Initialize: Create `README.md` (Goal), `AGENTS.md` (Rules), and `notes/` (Docs).
- Research:
  - `@oracle` → Architecture & Strategy.
  - `@librarian` → External Docs & Examples.
  - `@explore` → Local Codebase Patterns.
- Execute: Build incrementally within the experiment directory.
- Document: Record decisions and results in the `notes/` directory.

## Reminder

Always check the local `AGENTS.md` of the current experiment for specific overrides.
