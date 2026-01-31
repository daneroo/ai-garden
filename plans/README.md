# AI Garden Plans

## TODO Inbox

These are _TODOs_ that need to be added in the right place. The document below
should give guidance

- [x] Agent workspaces and loops - [agents/README.md](../agents/README.md)
- [ ] tanstack in astro
- [ ] opentui (bun) - tui-pubsub/directory-digester
- [ ] Smart Band Transition: Honor
      [Band 6 -> Xiaomi Mi Band 10](../smart-band/README.md)
- [ ] dotfiles: mise, yadm/bare-repo,stow,chezmois,zsh
- [ ] Restate the problem of alignment of the reference audio to the text
- [ ] Could we use `tts/qwen3-tts` for long-form narration (epub)?

## Roadmap

### Agentic Harness Research

The goal here is agentic harnesses, tools, and workflows

- `openclaw/`
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
