# Deno Workspaces Monorepo

A Deno workspace with shared packages and multiple apps.

## Structure

| Path             | Description                              |
| ---------------- | ---------------------------------------- |
| `packages/vtt/`  | VTT parsing library (`@deno-one/vtt`)    |
| `packages/epub/` | EPUB handling library (`@deno-one/epub`) |
| `apps/cli/`      | CLI app using yargs                      |
| `apps/web/`      | Web app using Fresh + Tailwind           |

## Quick Start

```bash
# CLI examples (using -A for simplicity in dev)
deno run -A apps/cli/cli.ts time 3661.5
deno run -A apps/cli/cli.ts --help

# Web app (Fresh)
cd apps/web && deno task dev
```

## Tasks

```bash
deno task          # List all tasks
deno task ci       # Format + lint + check + test
deno task fmt      # Format code
deno task check    # Type check (recursive)
deno task test     # Run tests (recursive)
deno task outdated # Check for outdated deps (recursive)
```

## Add a New Package

```bash
mkdir -p packages/foo
echo '{"name":"@deno-one/foo","version":"0.1.0","exports":"./foo.ts"}' > packages/foo/deno.json
touch packages/foo/foo.ts
```

Import anywhere: `import { bar } from "@deno-one/foo";`

## Manage Dependencies

```bash
deno add @std/path           # Add to root (shared)
cd packages/vtt && deno add  # Add to specific member
deno outdated -r             # Check for updates (all members)
deno outdated -r --update    # Update versions
```

## VSCode

Install **Deno** extension (denoland.vscode-deno).
