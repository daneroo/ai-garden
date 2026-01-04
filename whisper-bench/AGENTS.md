# whisper-bench

This directory (/whisper-bench) is part of a monorepo, so make sure you are int
the proper directory when running commands

## Code Formatting, Linting, Type checking, and Testing

Every time you perform an edit, should should run the following commands to
ensure code quality:

- `deno fmt` : format all code (and .md files)
- `deno task ci` : run all checks (lint, fmt, test)

## Code Structure

**Calling code precedes called code:**

```txt
// ENTRY POINT
if (import.meta.main) {
  await main();
}

// MAIN
async function main(): Promise<void> {
  // Phase 1, 2, ...
  await phase1();
  await phase2();
}

async function phase1(): Promise<void> {
  // Phase 1
}
```

