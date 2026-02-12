# bookplayer-claude-opus-46

Web-based audiobook player with synchronized epub display.

- **Seed**: [bookplayer](../seeds/bookplayer/)
- **Harness**: claude/opus-46
- **Stack**: TanStack Start, React 19, Bun, Tailwind CSS 4, epub.js

## Status

Phase 1: Bootstrap (complete)

## Development

```bash
bun install
bun run dev       # start dev server on port 3000
bun run ci        # full CI pipeline
```

## CI Pipeline

`bun run ci` runs: fmt:check, lint, check (tsc), test, build
