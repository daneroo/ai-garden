---
date: 2026-01-14T15:15:00Z
topic: OpenCode Configuration and Markdown Enforcement
tags: opencode, configuration, markdown, enforcement, research
last_updated: 2026-01-14T15:15:00Z
---

## Ticket Synopsis

The user requires strict "continual enforcement" of Markdown formatting
(`deno fmt`) and linting (`markdownlint-cli2`) by OpenCode itself. The user
suggested checking for an OpenCode-specific configuration (e.g., `opencode.json`
or `.opencode/config.json`) that might allow defining formatter hooks.

## Summary

- **OpenCode Config**: I found a `.opencode` directory in the parent folder
  (`../../.opencode`), but it appears to contain agent definitions and npm
  modules (`@opencode-ai/sdk`), NOT a `config.json` or `opencode.json` file.
- **Enforcement Strategy**: Since no native OpenCode configuration file for
  formatters was found in the standard locations, the primary enforcement
  mechanism remains:
  1. **Strict CI/Scripts**: As planned (package.json scripts).
  2. **Explicit Instruction**: `AGENTS.md` must contain a "System Prompt" style
     directive telling the agent: _"You MUST run `bun run check:md` after every
     file edit."_
  3. **Local Config**: We can try creating a `.opencode/config.json` in the
     _current_ project directory based on the user's schema to see if the
     environment picks it up, but we cannot rely on it without confirmation.

## Detailed Findings

### `.opencode` Discovery

The parent directory `../../.opencode` exists but seems to be a
structural/scaffold directory, not a runtime configuration for the active agent
session in the way the user described. It contains:

- `agent/`: Definitions for agents like `codebase-analyzer`.
- `command/`: Definitions for commands like `research`.
- `node_modules/`: SDKs.

It **does not** contain a `config.json` that matches the user's schema.

### User's Schema

The user provided this schema:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "formatter": { ... }
}
```

This suggests a feature that might be available but unused.

### Proposed Solution

1. **Create `.opencode/config.json`**: We will create this file in the **current
   experiment directory** (`.opencode/config.json`) with the requested
   configuration. Even if experimental, it aligns with the user's request.
2. **Backup Mechanism**: `AGENTS.md` instructions will be the "hard" enforcement
   layer.

## Merging CLAUDE.md

- **Content to Move**:
  - `Use Bun instead of Node.js` (General Rule)
  - `APIs` (Specific replacements like `Bun.serve` vs `express`)
  - `Testing` (`bun:test` patterns)
  - `Frontend` (HTML imports)
- **Target**: `AGENTS.md` under a new `## Technical Standards` section.

## Next Steps

Proceed to **Plan** to:

1. Create `.opencode/config.json`.
2. Update `package.json` with scripts.
3. Merge `CLAUDE.md` to `AGENTS.md`.
4. Delete `CLAUDE.md`.
