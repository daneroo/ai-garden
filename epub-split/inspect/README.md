# EPUB Inspect

Three-path EPUB inspection experiment covering the complete `test`, `drop`,
and `space` corpora.

## Setup

```bash
bun install
```

## Run

```bash
bun run inspect
```

The run processes every configured root and parser path and replaces the
current reports only after successful completion.

See:

- [DESIGN-three-parser-inspect-2026-06-19.md](DESIGN-three-parser-inspect-2026-06-19.md)
  for the architecture, evidence model, and feasibility-gate rationale.
- [PLAN-three-parser-inspect-2026-06-19.md](PLAN-three-parser-inspect-2026-06-19.md)
  for implementation, evidence, review, and approval status.
