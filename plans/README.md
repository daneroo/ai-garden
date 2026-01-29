# AI Garden Plans

## TODO Inbox

These are _TODOs_ that need to be added in the right place. The document below
should give guidance

- [ ] Could we use `tts/qwen3-tts` for long-form narration (epub)?

## Roadmap

### Agentic Harness Research

The goal here is agentic harnesses, tools, and workflows

- `clawdbot/`
- `opencode/`
- `claude/`

### Per Environment Consolidation

Language-specific sub-monorepos, centered around code organization

- `bun-one/`: TypeScript & Bun tools
- `deno-one/`: Deno tools

## Organization

Organizing agentic tool experimentation and planning.

```text
ai-garden/
  plans/ (this dir)                    # High level planning & cross-project meta
    ├── CONSOLIDATING-whisper*.md      # Active : Consolidation plans (repo-wide concerns)
    └── WHISPER-MIGRATION.md           # Active : Migration details
  bun-one/
    └── plans/                         # Delegated plans for `bun-one` sub-monorepo
  deno-one/
    └── plans/                         # Plans for `deno-one` sub-monorepo
```
