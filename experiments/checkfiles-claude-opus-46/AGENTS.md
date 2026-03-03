# AGENTS.md

## CI Loop (Required after every edit)

- Run `bun run ci`
- If formatting/checks fail, run `bun run fmt`
- Rerun `bun run ci`
- Do not mark phase/task complete until CI is green

## Dependencies

- Add dependencies with `bun add` / `bun add -d` (never edit package.json
  directly)

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
