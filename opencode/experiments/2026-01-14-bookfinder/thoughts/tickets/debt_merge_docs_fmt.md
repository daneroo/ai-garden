---
type: debt
priority: medium
created: 2026-01-14T14:00:00Z
created_by: Antigravity
status: reviewed
tags: [documentation, bun, prettier, markdown, cleanup]
keywords: [CLAUDE.md, AGENTS.md, prettier, bunx prettier, markdown formatting]
patterns: [documentation structure, package.json scripts, ci pipeline]
---

# DEBT-001: Consolidate Documentation and Enforce Markdown Standards

## Description

Merge the project-specific technical guidelines from `CLAUDE.md` into the
experiment's `AGENTS.md` to create a single source of truth. Crucially,
implement robust Markdown formatting using `deno fmt` and linting using
`markdownlint-cli2`, ensuring these standards are strictly enforced via CI
scripts and documented in `AGENTS.md`.

## Context

Currently, technical rules are split, and Markdown quality is not enforced
despite parent `AGENTS.md` guidelines. The user explicitly requested `deno fmt`
for Markdown and `markdownlint` to ensure consistency.

## Requirements

### Functional Requirements

- **Merge Documentation**:
  - Integrate `CLAUDE.md` sections into `AGENTS.md`.
  - Delete `CLAUDE.md`.
- **Markdown Formatting**:
  - Use **`deno fmt`** specifically for Markdown files (`deno fmt **/*.md`).
- **Markdown Linting**:
  - Use **`markdownlint-cli2`** to enforce rules (e.g., headers, lists).
  - Ensure configuration aligns with parent `AGENTS.md` rules.

### Non-Functional Requirements

- **Enforcement**:
  - Add `fmt:md`, `lint:md`, and `check:md` scripts to `package.json`.
  - Update `ci` script to fail if Markdown is invalid or unformatted.
  - Update `AGENTS.md` to explicitly state: "Run `bun run fmt:md` and
    `bun run lint:md` on every markdown file change."
  - **OpenCode Mandate**: `AGENTS.md` must specifically instruct the AI Agent
    (OpenCode) to run these format/lint commands **proactively** whenever it
    modifies or creates a Markdown file, ensuring self-correction before asking
    for review.
  - **OpenCode Configuration**: Research and implement if possible an OpenCode
    configuration (e.g., `opencode.json` or `.opencode/config.json`) to enforce
    formatters at the tool level. The user provided an example schema:

    ```json
    {
      "$schema": "https://opencode.ai/config.json",
      "formatter": {
        "custom-markdown-formatter": {
          "command": ["deno", "fmt", "$FILE"],
          "extensions": [".md"]
        }
      }
    }
    ```

## Current State

- `CLAUDE.md`: Exists, needs merging.
- `AGENTS.md`: Exists, needs updates.
- Deno: Installed (`2.6.4`).
- `markdownlint`: Not configured locally yet.

## Desired State

- Single `AGENTS.md` with strict rules.
- `package.json` having robust markdown scripts.
- CI pipeline rejecting bad markdown.

## Research Context

### Keywords to Search

- deno fmt markdown - specific flags.
- markdownlint-cli2 - bun usage.

### Key Decisions Made

- **Formatter**: `deno fmt` (user request).
- **Linter**: `markdownlint-cli2` (parent rule).
- **Enforcement**: Via `package.json` scripts and `ci`.

## Success Criteria

### Automated Verification

- [ ] `bun run fmt:md` formats markdown files.
- [ ] `bun run lint:md` runs markdownlint.
- [ ] `bun run ci` includes these checks.

### Manual Verification

- [ ] `AGENTS.md` clearly states the rules.
- [ ] Markdown files are consistently formatted.
