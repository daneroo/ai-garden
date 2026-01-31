# Context7 + Tidewave MCP Configuration Implementation Plan

## Overview

Create a new OpenCode context config at `.opencode/opencode.jsonc` with MCP entries for Context7 and Tidewave (Option A), and update elixir_one setup documentation.

## Current State Analysis

- No config exists at `opencode/.opencode/opencode.jsonc` (new file).
- `experiments/elixir_one/README.md` currently lists MCP installation as a TODO. (`experiments/elixir_one/README.md:7`)

## Desired End State

- `.opencode/opencode.jsonc` exists with `$schema` and MCP entries for `context7` and `tidewave`.
- Context7 API key is provided via `{env:CONTEXT7_API_KEY}` and explained in comments.
- `experiments/elixir_one/README.md` contains setup-only MCP notes (no runtime wiring).

### Key Discoveries:

- `experiments/elixir_one/README.md:7` already references MCP installation.
- Example OpenCode config format exists in `experiments/2026-01-14-bookfinder/.opencode/config.json:1`.

## What We're NOT Doing

- No runtime feature wiring or code changes.
- No tests or health checks.
- No Tidewave MCP proxy configuration (Option B).

## Implementation Approach

Create a JSONC config file at the opencode context root with MCP definitions, using inline comments for environment variable usage, then replace the README TODO with setup guidance.

## Phase 1: Add OpenCode MCP Config

### Overview

Create the new JSONC config file in `.opencode/` with Context7 and Tidewave entries.

### Changes Required:

#### 1. OpenCode Config

**File**: `opencode/.opencode/opencode.jsonc`
**Changes**: Create a JSONC config containing `$schema`, `mcp.context7`, and `mcp.tidewave` entries using `{env:CONTEXT7_API_KEY}` and the Tidewave direct SSE URL.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "local",
      // Set CONTEXT7_API_KEY in your shell; OpenCode will substitute {env:...}
      "command": [
        "npx",
        "-y",
        "@upstash/context7-mcp",
        "--api-key",
        "{env:CONTEXT7_API_KEY}"
      ],
      "enabled": true
    },
    "tidewave": {
      "type": "remote",
      "url": "http://localhost:4000/tidewave/mcp",
      "enabled": true
    }
  }
}
```

### Success Criteria:

#### Automated Verification:

- [x] File exists: `opencode/.opencode/opencode.jsonc`

#### Manual Verification:

- [x] Context7 uses `{env:CONTEXT7_API_KEY}`.
- [x] Tidewave uses the direct SSE URL.

---

## Phase 2: Update elixir_one README

### Overview

Replace the MCP TODO entry with setup-only notes.

### Changes Required:

#### 1. README setup notes

**File**: `experiments/elixir_one/README.md`
**Changes**: Replace the TODO section with MCP setup notes, including the env var and config path.

### Success Criteria:

#### Automated Verification:

- [x] README updated with setup notes.

#### Manual Verification:

- [x] Notes mention `.opencode/opencode.jsonc` and `CONTEXT7_API_KEY`.

---

## Testing Strategy

### Manual Testing Steps:

- Confirm `opencode/.opencode/opencode.jsonc` parses as JSONC.
- Confirm README setup notes are clear and scoped to configuration only.

## Performance Considerations

None.

## Migration Notes

None.

## References

- Original ticket: `thoughts/tickets/feature_context7_tidewave_elixir_one.md`
- Related research: `thoughts/research/2026-01-15_context7_tidewave_opencode_config.md`
- Existing README: `experiments/elixir_one/README.md:7`
