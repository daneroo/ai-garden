# bookplayer-codex-gpt-5.3-codex

Local-first web app experiment for browsing strict audiobook/ebook pairs and
reading while listening.

- Seed: `experiments/seeds/bookplayer.md`
- Harness: `codex-gpt-5.3-codex`
- Stack: Bun, TanStack Start (React), Nitro, TypeScript, Tailwind CSS 4, epubjs

## Status

Phase 1 bootstrap in progress.

## Development

```bash
bun install
bun run dev
bun run ci
```

## CI Pipeline

`bun run ci` runs: `fmt:check`, `lint`, `check`, `test`, `build`.
