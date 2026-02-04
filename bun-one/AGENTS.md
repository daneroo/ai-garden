# bun-one

Bun workspaces monorepo.

## Workflow

- Use `bun` commands, not npm or pnpm
- Run `bun run ci` from this directory after changes
- Run `bun run fmt` if CI fails on formatting

## Structure

- packages/ - Shared TypeScript libraries
- components/ - Shared React components
- apps/ - Applications (cli, whisper, vite-one, etc.)

## Documentation

- docs/WORKSPACE-BUN.md - Detailed workspace setup guide

## Code Formatting, Linting, Type checking, and Testing

Every time you perform an edit, should should run the following commands to
ensure code quality:

- `bun run fmt` : format all code (and .md files)
- `bun run ci` : run all checks (lint, fmt, check, test)

## Code Structure

**Calling code precedes called code:**

```txt
// ENTRY POINT
if (import.meta.main) {
  await main();
}

// MAIN
async function main(): Promise<void> {
  await tokenize();
  await buildIndex();
  await findAnchors();
  await score();
}

async function tokenize(): Promise<void> {
  // Convert cues to words
}
```

## Markdown Rules

- Prefer unnumbered lists (numbered list, and sections make editing much harder)
- No emojis unless directed
- Avoid excessive bolding - because makes reading raw markdown burdensome
