---
type: feature
priority: medium
created: 2026-01-14T00:00:00Z
status: closed
tags: [opencode, mcp, elixir_one, config]
keywords: [Context7, Tidewave, MCP server, opencode config, elixir_one]
patterns:
  [
    mcp server config,
    experiment config section,
    opencode.json schema,
    experiment docs updates,
  ]
---

# FEATURE-001: Add Context7 and Tidewave MCP servers for elixir_one

## Description

Add Context7 and Tidewave MCP server entries to the project opencode configuration so the elixir_one experiment can use them.

## Context

The elixir_one experiment needs additional MCP servers to provide better context for developers. The configuration should live in the repo-level opencode config and be scoped to the elixir_one experiment.

## Requirements

### Functional Requirements

- Add Context7 MCP server entry scoped to elixir_one.
- Add Tidewave MCP server entry scoped to elixir_one.
- Update elixir_one documentation with setup-only notes.

### Non-Functional Requirements

- Use the latest available versions for Context7 and Tidewave.
- No additional performance, security, or scalability constraints.

## Current State

The repo-level opencode config does not include Context7 or Tidewave for elixir_one.

## Desired State

The repo-level opencode config includes Context7 and Tidewave entries under the elixir_one experiment section, and elixir_one docs note the setup requirements.

## Research Context

### Keywords to Search

- opencode config - locate MCP server configuration schema
- MCP server - identify existing MCP server entries
- elixir_one - find experiment-specific config blocks
- Context7 - expected server identifier
- Tidewave - expected server identifier

### Patterns to Investigate

- mcp server config - how command/args/env are defined
- experiment config section - how experiments scope servers
- opencode.json schema - required fields/structure
- experiment docs updates - where setup notes live

### Key Decisions Made

- Use repo-level config at `/Users/daniel/Code/iMetrical/ai-garden/opencode/.opencode/opencode.json` - project-specific settings
- Scope changes to elixir_one only - do not affect other experiments
- Add setup-only documentation - no usage guidance or runtime wiring
- No tests or health checks - config/docs only

## Success Criteria

### Automated Verification

- [ ] No automated checks specified

### Manual Verification

- [ ] Context7 and Tidewave appear under the elixir_one section in `.opencode/opencode.json`
- [ ] elixir_one documentation includes setup notes for the new servers

## Related Information

- Experiment directory: `experiments/elixir_one`

## Notes

- Config field details for each server will be determined during research.
- Context7 config hint:

  - `$schema`: `https://opencode.ai/config.json`
  - MCP snippet:

    ```json
    {
      "$schema": "https://opencode.ai/config.json",
      "mcp": {
        "context7": {
          "type": "local",
          "command": [
            "npx",
            "-y",
            "@upstash/context7-mcp",
            "--api-key",
            "YOUR_API_KEY"
          ],
          "enabled": true
        }
      }
    }
    ```

- Tidewave config hints:

  - Option A (direct SSE):

    ```json
    {
      "$schema": "https://opencode.ai/config.json",
      "mcp": {
        "tidewave": {
          "type": "remote",
          "url": "http://localhost:4000/tidewave/mcp",
          "enabled": true
        }
      }
    }
    ```

  - Option B (MCP proxy, recommended by Tidewave docs):

    ```json
    {
      "$schema": "https://opencode.ai/config.json",
      "mcp": {
        "tidewave": {
          "type": "local",
          "command": [
            "/path/to/mcp-proxy",
            "http://localhost:4000/tidewave/mcp"
          ],
          "enabled": true
        }
      }
    }
    ```

- Out of scope: runtime feature wiring, tests, or other experiment changes.
