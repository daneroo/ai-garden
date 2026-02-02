# ai-garden

AI/LLM experimentation monorepo.

This repository is in the middle of consolidation. We're organizing scattered
experiments and projects into coherent workspaces.

## TODO

_Warning:_ Keep λ < μ or unbounded growth.

- [TODO Inbox](./plans/README.md)
- [Legacy](./README-legacy.md)

## Structure

At this stage, only these top-level directories are actively curated:

- [`agents/`](agents/README.md) - AI runners (Codex, OpenCode, Kilo, Claude,
  etc.) plus harnesses, tooling, and workflows
- [`plans/`](plans/README.md) - Cross-project planning and meta-docs - like for
  consolidation
- [`bun-one/`](bun-one/README.md) - TypeScript/Bun consolidated workspace
  (in-progress)
- [`deno-one/`](deno-one/README.md) - Deno consolidated workspace (in-progress)
- [`experiments/`](experiments/README.md) - Agent-agnostic experiment workspaces

Everything else at the repo root is considered "legacy": not necessarily dead,
just not yet placed into the consolidated homes above.

```text
ai-garden/
  agents/           # AI runners + harnesses
  plans/            # Planning docs
  bun-one/          # TypeScript/Bun workspace
  deno-one/         # Deno workspace
  experiments/      # Experiment workspaces (agent-agnostic)
  ...               # Legacy projects (being triaged)
```

## Getting Started

- **Running experiments**: See [experiments/README.md](experiments/README.md)
- **Agent setup**: See [agents/README.md](agents/README.md)
- **Planning docs**: See [plans/README.md](plans/README.md)

## Legacy

The other top level directories need to be accounted for: moved, merged,
removed. This is the basis for future cleanup.

See [README-legacy.md](README-legacy.md) for historical notes and
pre-consolidation TODOs.
