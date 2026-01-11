# Bun Workspaces Monorepo

A Bun workspace with shared packages and multiple apps.

## Directory Structure

See `docs/WORKSPACE-BUN.md` for a detailed directory structure.

- `packages`: libraries like `vtt`
- `components`: UI components like `timer`
- `apps`: cli and (future) web apps

## Usage

```bash
# Monorepo Tasks
bun run ci           # Format + lint + check + test
bun run fmt          # Format code
bun run check        # Type check (recursive)
bun test             # Run tests (recursive)

# CLI Example
bun run apps/cli/cli.ts time 3661.5
bun run apps/cli/cli.ts --help

# Vite Web App
(cd apps/vite-one && bun run dev)
```

## Add a New Package

```bash
mkdir -p packages/foo
cd packages/foo
bun init -y
# Edit package.json name to @bun-one/foo
```

Import anywhere: `import { bar } from "@bun-one/foo";`

## Manage Dependencies

```bash
bun add -d typescript        # Add to root (shared)
bun add foo --filter @bun-one/vtt  # Add to specific member
# or cd into directory
cd packages/vtt && bun add foo
```
