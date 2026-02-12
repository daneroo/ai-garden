# AI Garden Plans

## TODO Inbox

These are _TODOs_ that need to be added in the right place. The document below
should give guidance

- [`bun-one`](../bun-one/plans/) has it's own plans
- [ ] Smart Band Transition: Honor
      [Band 6 -> Xiaomi Mi Band 10](../smart-band/README.md)
- [ ] Agent workspaces and loops - [agents/README.md](../agents/README.md)
  - [ ] Started making docs subdirs - experiments move to `/experiments`
- [ ] tanstack in astro
- [ ] dotfiles: mise, yadm/bare-repo,stow,chezmois,zsh
- [ ] Restate the problem of alignment of the reference audio to the text
- [ ] Could we use `tts/qwen3-tts` for long-form narration (epub)?
  - [ ] make a case for dizzy, skel, kenny, and dan

## Organization

Organizing agentic tool experimentation and planning.

- [`agents/`](../agents/README.md) — Agentic harnesses, tools, and workflows
  (Kilo, OpenClaw, OpenCode)
- [`bun-one/`](../bun-one/README.md) — TypeScript & Bun (sub)-monorepo
- [`deno-one/`](../deno-one/README.md) — Deno (sub)-monorepo
- [`experiments/`](../experiments/README.md) - Agent-agnostic experiment
  workspaces

```text
ai-garden/
  plans/ (this dir)                    # High level planning & cross-project meta
    ├── CONSOLIDATING-whisper*.md      # Active : Consolidation plans (repo-wide concerns)
    └── WHISPER-MIGRATION.md           # Active : Migration details
  agents/                              # Agent workspaces and experimentation
    ├── kilo/
    ├── openclaw/
    ├── opencode/
  bun-one/
    └── plans/                         # Delegated plans for `bun-one` sub-monorepo
  deno-one/
    └── plans/                         # Plans for `deno-one` sub-monorepo
```
