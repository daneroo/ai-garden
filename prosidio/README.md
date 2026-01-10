# Deno Workspaces Monorepo

A Deno workspace with shared packages and multiple apps.

## TODO

- [x] fix linting for `prosidio/apps/web/static/tailwind.dist.css` ✓
- [x] ~~Decide if we want to keep excluding: "exclude": ["./docs"]~~ → Using
      `ignore` attribute on exemplar code blocks instead ✓
- [x] rename deno-one to prosidio ✓
  - [x] update all src/references to use prosidio
- [x] Consolidate/refactor docs - create docs/WORKSPACE-MONOREPO.md this should
      include most of the fresh/tailwind shenanigans we figured out as well as
      the dependencies management, and directory structure and tasks conventions
- [x] make a distinct `packages/` sibling directory for `components/`
  - [x] make the `deno-one/apps/web/styles/tailwind.src.css` refer to all those
        components
- [x] Move Timer to components

## Directory Structure

- `packages`: libraries like `vtt` and `epub`
- `apps`: both cli and web apps

## Usage

```bash
# Monorepo Tasks
deno task          # List all tasks
deno task ci       # Format + lint + check + test
deno task fmt      # Format code
deno task check    # Type check (recursive)
deno task test     # Run tests (recursive)
deno task outdated # Check for outdated deps (recursive)

# CLI Example (using -A for simplicity in dev)
deno run -A apps/cli/cli.ts time 3661.5
deno run -A apps/cli/cli.ts --help

# Prosodio (Web App) - Development (Islands + Tailwind Watcher)
(cd apps/web && deno task dev)

# Prosodio (Web App) - Production (Build + Serve)
(cd apps/web && deno task start)
```

### Prosodio (`apps/web`)

A web application using Fresh 2.0 with Islands (interactive components) and
Tailwind CSS v4.

#### Architecture: Deno Native + Manual Tailwind v4

We use the "Native" Fresh strategy (avoiding Vite) for simplicity. However,
because native plugins don't yet support Tailwind v4, we use a custom
`server.ts` entry point.

> See `apps/web/server.ts` for detailed architectural documentation and
> rationale.

## Add a New Package

```bash
mkdir -p packages/foo
echo '{"name":"@prosidio/foo","version":"0.1.0","exports":"./foo.ts"}' > packages/foo/deno.json
touch packages/foo/foo.ts
```

Import anywhere: `import { bar } from "@prosidio/foo";`

## Manage Dependencies

```bash
deno add @std/path           # Add to root (shared)
cd packages/vtt && deno add  # Add to specific member
deno outdated -r             # Check for updates (all members)
deno outdated -r --update    # Update versions
```
