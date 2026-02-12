# Agent Guidelines for Experiments

Reference for agent behavior within experiment directories.

## Rules

- Directory Isolation: All experiments must live under
  `experiments/<slug>-<variant>/`.
- Scope Enforcement: Do NOT modify files outside the active experiment directory
  unless explicitly requested by the user.
- Model Constraints:
  - No Claude: Do not assume Claude availability.
- Configuration: Each experiment directory MUST have its own `AGENTS.md` to
  define local context and rules.

## Note

`AGENTS.md` is agent-specific naming. Other agents may use different conventions
(e.g., `CLAUDE.md`). This document is preserved as reference material for
OpenCode/Codex-style workflows.
