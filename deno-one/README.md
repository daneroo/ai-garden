# Deno Workspaces Monorepo

A Deno workspace with shared packages and multiple apps.

## Structure

| Path             | Description                              |
| ---------------- | ---------------------------------------- |
| `packages/vtt/`  | VTT parsing library (`@deno-one/vtt`)    |
| `packages/epub/` | EPUB handling library (`@deno-one/epub`) |
| `apps/cli/`      | CLI app using yargs                      |
| `apps/web/`      | **Prosody** (Fresh 2.0 Web App)          |

## Quick Start

```bash
# CLI examples (using -A for simplicity in dev)
deno run -A apps/cli/cli.ts time 3661.5
deno run -A apps/cli/cli.ts --help

# Prosody (Web App)
## development (with Islands)
cd apps/web && deno task dev
## production
cd apps/web && deno task start
```

### Prosody (`apps/web`)

A web application using Fresh 2.0 with Islands (interactive components).

#### Architecture: Zero NPM, Zero Vite

We wanted client-side interactivity (Islands) **without** the usual Node/Vite
toolchain explosion. Here's how we achieved it:

| Constraint          | Solution                                                              |
| ------------------- | --------------------------------------------------------------------- |
| No `node_modules`   | All imports via JSR (`jsr:@fresh/core`) or Deno specifiers            |
| No `vite.config.ts` | Use Fresh's built-in `Builder` from `fresh/dev` (Deno-native bundler) |
| No `package.json`   | Only `deno.jsonc` for tasks and imports                               |
| Islands hydration   | `dev.ts` uses `Builder.listen()` to JIT-compile island components     |

#### Key Files

| File            | Purpose                                                  |
| --------------- | -------------------------------------------------------- |
| `main.tsx`      | App routes and SSR (exports `app`)                       |
| `dev.ts`        | Development server (Builder + file watching)             |
| `prod.ts`       | Production server (Builder without watching)             |
| `routes/*.tsx`  | Server-rendered page components                          |
| `islands/*.tsx` | Client-side interactive components (hydrated in browser) |

#### Why `dev.ts` is Necessary

<!-- deno-fmt-ignore-file -->

```ts ignore
// dev.ts - Required for Islands (Fresh's Builder bundles client-side JS)
import { Builder } from "fresh/dev";
import { app } from "./main.tsx";

const builder = new Builder();
await builder.listen(() => Promise.resolve(app));
```

- **Without `dev.ts`**: `deno serve main.tsx` renders SSR but islands are dead
  (no client JS).
- **With `dev.ts`**: `Builder` compiles `islands/*.tsx` into browser bundles
  automatically.

#### Island Constraints

Islands cannot import modules that use Node APIs (like `node:fs/promises`). If
your island needs logic from a server-side library, **inline it** or create a
browser-safe version.

Example: We inlined `vttTimeToSeconds()` in `VttViewer.tsx` to avoid importing
`@deno-one/vtt` (which uses `node:fs`).

#### Tasks

| Environment | Task              | Command                            | Description                         |
| :---------- | :---------------- | :--------------------------------- | :---------------------------------- |
| Development | `deno task dev`   | `deno run -A --env --watch dev.ts` | Builder + file watching + Islands   |
| Production  | `deno task start` | `deno run -A --env prod.ts`        | Builder + Islands (no file watcher) |

#### Compiler Options

Fresh Islands require `jsxPrecompileSkipElements` in `deno.jsonc`:

```jsonc
"compilerOptions": {
  "jsx": "precompile",
  "jsxImportSource": "preact",
  "jsxPrecompileSkipElements": ["a", "img", "source", "body", "html", "head", "title", "meta", "script", "link", "style", "base", "noscript", "template"]
}
```

This tells Deno's JSX compiler to skip certain elements that Fresh handles
specially.

## Monorepo Tasks

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
