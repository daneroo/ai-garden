---
date: 2026-01-15T01:12:58Z
git_commit: f8596013494522757e73a79f6170ebf72fe389f2
branch: main
repository: /Users/daniel/Code/iMetrical/ai-garden
topic: "Context7 + Tidewave MCP config for elixir_one"
tags: [research, opencode, mcp, elixir_one]
last_updated: 2026-01-15T01:12:58Z
---

## Ticket Synopsis

Add Context7 and Tidewave MCP server entries to the OpenCode config scoped to the elixir_one experiment, and update elixir_one setup documentation.

## Summary

- The OpenCode config file does not exist in the current opencode context; we will need to create one under `.opencode/`.
- Existing OpenCode config usage in this repo is experiment-scoped at `.opencode/config.json` (JSON, not JSONC), but the user wants `.opencode/opencode.jsonc` to allow comments.
- elixir_one already calls out MCP installation in its README TODO section.

## Detailed Findings

### OpenCode config locations
- The opencode context `.opencode/` directory contains command/agent scaffolding and node_modules, but no config file to extend. (`.opencode/package.json:1`)
- The only active config example in this repo is experiment-scoped at `experiments/2026-01-14-bookfinder/.opencode/config.json`. (`experiments/2026-01-14-bookfinder/.opencode/config.json:1`)
- The inactive `oh-my-opencode` config shows `$schema` usage with JSONC comments, but it is explicitly not active for this workflow. (`oh-my-opencode/config/opencode.jsonc:1`)

### elixir_one documentation context
- The README already lists “Install MCPs Context7, Tidewave” as a TODO, which can be converted into setup guidance. (`experiments/elixir_one/README.md:7`)

## Code References
- `.opencode/package.json:1` - confirms `.opencode/` exists without config.
- `experiments/2026-01-14-bookfinder/.opencode/config.json:1` - example OpenCode config file location and schema usage.
- `oh-my-opencode/config/opencode.jsonc:1` - JSONC schema example (inactive).
- `experiments/elixir_one/README.md:7` - existing MCP TODO.

## Architecture Insights

- OpenCode configuration in this repo is currently local to experiments (`.opencode/config.json`) rather than global; for elixir_one we will introduce a config file at the opencode context root (`/Users/daniel/Code/iMetrical/ai-garden/opencode/.opencode/opencode.jsonc`) as requested.

## Historical Context (from thoughts/)

- `experiments/2026-01-14-bookfinder/thoughts/research/2026-01-14_opencode_config.md` - prior research confirms `.opencode/` in the parent repo is scaffold-only and suggests creating local config files when needed.
- `experiments/2026-01-14-bookfinder/thoughts/plans/merge_docs_fmt.md` - references `.opencode/config.json` as an expected config location.

## Related Research

- `experiments/2026-01-14-bookfinder/thoughts/research/2026-01-14_opencode_config.md`

## Open Questions

- Confirm if the new config file should include only MCP settings or also other opencode context defaults.
- Decide whether to include both Tidewave options with comments or pick a single default entry.
