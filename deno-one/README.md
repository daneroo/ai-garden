# Deno Workspaces Monorepo

A Deno workspace with shared packages and multiple apps.

## Structure

| Path             | Description                              |
| ---------------- | ---------------------------------------- |
| `packages/vtt/`  | VTT parsing library (`@deno-one/vtt`)    |
| `packages/epub/` | EPUB handling library (`@deno-one/epub`) |
| `apps/cli/`      | CLI app using yargs                      |
| `apps/web/`      | **Prosody** (Fresh 2.0 Native Web App)   |

## Quick Start

```bash
# CLI examples (using -A for simplicity in dev)
deno run -A apps/cli/cli.ts time 3661.5
deno run -A apps/cli/cli.ts --help

# Prosody (Web App)
## development
cd apps/web && deno task dev
## production
cd apps/web && deno task start
```

### Prosody (`apps/web`)

An SSR-Only web application using Fresh 2.0 Native Mode.

- Zero NPM: Uses JSR imports (`jsr:@fresh/core`) exclusively. No `node_modules`.
- JSR: Leverages the Deno-native package registry for security and performance.
- No Build Step: Uses Deno's JIT compilation for Server-Side Rendering.
- Architecture:
  - Native: Uses `jsr:@fresh/core` directly with `deno serve`.
  - SSR Only: Client-side hydration (Islands) is disabled because Fresh 2.0
    requires Vite for bundling. Since we mandated "No Vite/NPM", we accept the
    SSR Only constraint.

#### Tasks (Development vs. Production)

| Environment | Task              | Command                       | Description                                      |
| :---------- | :---------------- | :---------------------------- | :----------------------------------------------- |
| Development | `deno task dev`   | `deno serve --watch main.tsx` | Runs server with file watcher for hot reloading. |
| Production  | `deno task start` | `deno serve main.tsx`         | Runs server in production mode.                  |

> Note: This architecture is intentionally minimalist. By avoiding the build
> step (Vite), we gain simplicity but trade off client-side interactivity
> (Islands).

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

Install Deno extension (denoland.vscode-deno).
