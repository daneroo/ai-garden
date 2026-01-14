---
date: 2026-01-14T14:45:00Z
topic: Documentation Consolidation and Markdown Enforcement
tags: documentation, markdown, deno, markdownlint, ci
last_updated: 2026-01-14T14:45:00Z
---

# Documentation Consolidation and Markdown Enforcement Research

## Ticket Synopsis

The goal is to merge `CLAUDE.md` into `AGENTS.md` and enforce strict Markdown
standards using `deno fmt` (formatting) and `markdownlint-cli2` (linting). The
user explicitly requested these tools and emphasized "continual enforcement"
beyond just pre-commit hooks.

## Summary

- **Formatting**: `deno fmt` works excellently for Markdown, fixing table
  alignment and spacing automatically.
- **Linting**: `markdownlint-cli2` successfully identifies structural issues
  (missing blank lines, header levels, line lengths).
- **Enforcement**: We will implement a multi-layered approach:
  1. **Scripts**: Add `fmt:md` and `lint:md` to `package.json`.
  2. **CI**: Update the `ci` script to include these checks
     (`bun run fmt:md --check` and `bun run lint:md`).
  3. **Documentation**: Update `AGENTS.md` to explicitly require these checks
     for every change.

## Detailed Findings

### Deno Formatting (`deno fmt`)

- **Command**: `deno fmt **/*.md`
- **Check Mode**: `deno fmt --check **/*.md` (returns error code 1 if
  unformatted)
- **Behavior**: It reformats text wrapping (80 chars by default, configurable),
  standardizes lists, and aligns tables.
- **Pros**: Fast, opinionated (less bikeshedding), standard in modern JS/TS/Deno
  ecosystems.

### Markdown Linting (`markdownlint-cli2`)

- **Command**: `bunx markdownlint-cli2 "**/*.md"`
- **Configuration**: Looks for `.markdownlint.yaml` or similar. We should create
  one to match the parent `AGENTS.md` rules (e.g., `MD013` line length might
  need adjusting if Deno wraps differently, or we align Deno config).
- **Issues Found**: The current ticket file violated several rules (MD022 blanks
  around headings, MD032 blanks around lists, MD013 line length).
- **Resolution**: `deno fmt` fixes many of these automatically (wrapping lines,
  adding whitespace). `markdownlint` catches the semantic/structural ones.

### Integration Strategy

We will add the following to `package.json`:

```json
{
  "scripts": {
    "fmt:md": "deno fmt **/*.md",
    "lint:md": "bunx markdownlint-cli2 \"**/*.md\"",
    "check:md": "deno fmt --check **/*.md && bunx markdownlint-cli2 \"**/*.md\"",
    "ci": "bun run lint && bun run check && bun run test && bun run check:md"
  }
}
```

This ensures that running `bun run ci` (which should be the standard
verification step) validates Markdown quality alongside code quality.

## Architecture Insights

- **Tooling Overlap**: Deno is used solely for formatting Markdown here, while
  Biome handles TS/JS. This separation is clean.
- **Configuration**: We likely need a `deno.json` to configure line width if the
  default (80) is too aggressive for the user's taste, though 80 is standard. We
  definitely need `.markdownlint.yaml` to disable `MD013` (line length) if we
  trust Deno to handle wrapping, or ensure they agree. Ideally, let Deno handle
  wrapping and disable/relax MD013 in lint.

## Open Questions

- **Line Length**: `deno fmt` defaults to 80. `markdownlint` defaults to 80.
  Sometimes links/URLs break this.
  - _Decision_: We will configure `markdownlint` to ignore line length
    (`MD013: false`) and let `deno fmt` handle the wrapping authority. This
    prevents conflicts.

## Next Steps

Proceed to **Plan** phase to execute the merge and script setup.
