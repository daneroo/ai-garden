# bookplayer-agy-opus46

Web-based audiobook player with synchronized epub display.

- **Seed**: [bookplayer](../seeds/bookplayer.md)
- **Harness**: antigravity/opus-46
- **Stack**: TanStack Start, React 19, Bun, Nitro, Tailwind CSS 4, epub.js

## Status

Phase 2: Library Scanner & Indexer (complete)

## Development

```bash
bun install
bun run dev       # start dev server on port 3000
bun run ci        # full CI pipeline
```

## CI Pipeline

`bun run ci` runs: fmt:check, lint, check (tsc), test
