# Deno Workspaces Monorepo Guide

A reference guide for setting up Deno workspaces with shared libraries, shared
UI components, CLI tools, and web applications.

## Overview

Deno workspaces allow multiple packages to coexist in a monorepo with shared
dependencies and unified tooling. This guide documents patterns that emerged
from solving a specific set of constraints:

**Core Requirements:**

- Shared TypeScript libraries consumable by all workspace members
- Shared Preact components with proper JSX compilation
- A CLI application using shared packages
- A Fresh 2.0 web application with interactive islands

**Nice-to-Haves:**

- Tailwind CSS v4 with tree-shaking across all sources
- Unified development workflow and CI pipeline

---

## Directory Structure

```text
monorepo/
├── deno.jsonc          # Root workspace configuration
├── deno.lock           # Shared lockfile for all members
├── packages/           # Shared libraries (pure TypeScript)
│   ├── vtt/
│   │   ├── deno.json
│   │   ├── vtt.ts
│   │   └── vtt_test.ts
│   └── epub/
├── components/         # Shared UI components (Preact/JSX)
│   └── timer/
│       ├── deno.jsonc
│       ├── Timer.tsx
│       └── Timer_test.tsx
└── apps/               # Applications
    ├── cli/            # Command-line tools
    │   ├── deno.jsonc
    │   └── cli.ts
    └── web/            # Fresh web application
        ├── deno.jsonc
        ├── server.ts
        └── ...
```

**Conventions:**

- `packages/` — Pure TypeScript libraries with no UI dependencies
- `components/` — Preact components that can be shared across web apps
- `apps/` — Runnable applications (CLI, web servers, etc.)

---

## Root Workspace Configuration

The root `deno.jsonc` defines workspace membership, shared dependencies, and
common tasks.

```jsonc
{
  "workspace": ["./packages/*", "./components/*", "./apps/*"],

  // Required for npm packages that need binary resolution (e.g., Tailwind CLI)
  // See "npm Compatibility" section for important caveats.
  "nodeModulesDir": "auto",

  // Shared imports inherited by all workspace members
  "imports": {
    "@std/assert": "jsr:@std/assert@1",
    "@std/path": "jsr:@std/path@1",
    "preact": "npm:preact@^10.22.0",
    "preact/hooks": "npm:preact@^10.22.0/hooks",
    "tailwindcss": "npm:tailwindcss@^4.1.18"
  },

  // Tasks available from the workspace root
  "tasks": {
    "fmt": "deno fmt",
    "fmt:check": "deno fmt --check",
    "lint": "deno lint",
    "check": "deno check -r",
    "test": "deno test --doc",
    "outdated": "deno outdated -r",
    "ci": "deno task fmt:check && deno task lint && deno task check && deno task test"
  }
}
```

### Workspace Members

The `"workspace"` array uses glob patterns to include directories. Each member
must have its own `deno.json` or `deno.jsonc` with at minimum a `name` field.

### Shared Imports

Dependencies declared in the root `imports` are inherited by all members. This
ensures version consistency across the monorepo—particularly important for
frameworks like Preact where multiple versions cause runtime errors.

### Tasks

Some Deno commands are naturally recursive (e.g., `deno fmt`, `deno lint`),
while others require the `-r` flag (e.g., `deno check -r`, `deno outdated -r`).
All tasks are declared at the root for a uniform workflow.

---

## Package Configuration

Workspace members need minimal configuration.

### Library Package (`packages/`)

```json
{
  "name": "@deno-one/vtt",
  "version": "0.1.0",
  "exports": "./vtt.ts"
}
```

The `name` field enables importing via `import { foo } from "@deno-one/vtt"`.
The `exports` field defines the package entry point.

### Component Package (`components/`)

Components using JSX need compiler options:

```jsonc
{
  "name": "@deno-one/timer",
  "version": "0.1.0",
  "exports": "./Timer.tsx",
  // Preact is inherited from root imports
  "compilerOptions": {
    "jsx": "precompile",
    "jsxImportSource": "preact"
  }
}
```

### Importing Workspace Members

Any workspace member can import from another using the package name:

```ts ignore
import { parseVtt } from "@deno-one/vtt";
import { Timer } from "@deno-one/timer";
```

No file paths or import maps needed—Deno resolves these automatically.

---

## npm Compatibility and nodeModulesDir

> [!IMPORTANT]
> The `nodeModulesDir` setting requires careful consideration. It enables npm
> package binary resolution but can cause conflicts with certain build tools.

```jsonc
{
  "nodeModulesDir": "auto"
}
```

**When it's required:**

- npm packages with CLI binaries (e.g., `@tailwindcss/cli`)
- Packages that expect a `node_modules` structure

**Known issues:**

- Causes conflicts with Fresh's Vite-based build mode
- We deliberately chose Fresh's non-Vite mode to avoid this conflict

**Recommendation:** Only enable `nodeModulesDir` when specifically required, and
prefer JSR packages when available.

---

## Fresh 2.0 Web Application

Fresh 2.0 offers two build strategies:

1. **Vite mode** — Uses Vite for bundling, enables vite plugins
2. **Standard mode** — No Vite, simpler setup, direct Deno execution

We use **standard mode** (no Vite) for simplicity and to avoid conflicts with
`nodeModulesDir`. However, this mode lacks plugin support for Tailwind CSS v4,
requiring a manual integration approach.

### App Configuration

```jsonc
{
  "tasks": {
    "dev": "deno run -A --env --watch server.ts --watch",
    "start": "deno run -A --env server.ts"
  },
  "imports": {
    "fresh": "jsr:@fresh/core@^2.0.0"
  },
  "compilerOptions": {
    "jsx": "precompile",
    "jsxImportSource": "preact",
    "jsxPrecompileSkipElements": [
      "a",
      "img",
      "source",
      "body",
      "html",
      "head",
      "title",
      "meta",
      "script",
      "link",
      "style",
      "base",
      "noscript",
      "template"
    ]
  }
}
```

The `jsxPrecompileSkipElements` array is required for Fresh Islands to hydrate
correctly.

### Unified Server Entry Point

Instead of separate `dev.ts` and `prod.ts` files, a single `server.ts` handles
both modes and manages the Tailwind build process. The entry point:

1. Spawns the Tailwind CLI (watch mode for dev, single build for production)
2. Starts the Fresh server via the `Builder` API

This pattern acts as a lightweight build orchestrator, bridging the gap left by
the absence of Vite plugins.

---

## Tailwind CSS v4 Integration

Tailwind v4 requires a build step to compile and tree-shake CSS. Without Vite
plugin support, we manage this manually.

### Source Configuration

The input CSS file (`tailwind.src.css`) acts as configuration:

```css
@import "tailwindcss";

/* Local app sources */
@source "../routes";
@source "../islands";

/* External workspace sources */
@source "../../../components";
```

The `@source` directive tells Tailwind where to scan for class usage. This must
include paths to shared components outside the app directory.

### Build Process

The `server.ts` entry point spawns the Tailwind CLI:

- **Development:** `--watch` flag for continuous recompilation
- **Production:** Single optimized build before server start

The compiled output (`tailwind.dist.css`) is written to the `static/` directory
and served as a static asset.

---

## Dependency Management

### Adding Dependencies

```bash
# Add to root (shared across all members)
deno add @std/path

# Add to specific member
cd packages/vtt && deno add jsr:@std/streams
```

### Checking for Updates

```bash
# Check all workspace members
deno outdated -r

# Update all dependencies
deno outdated -r --update
```

---

## Development Workflow

### Common Tasks

```bash
# From workspace root
deno task          # List all available tasks
deno task fmt      # Format all code
deno task ci       # Run full CI pipeline (fmt + lint + check + test)
deno task outdated # Check for dependency updates

# Run CLI
deno run -A apps/cli/cli.ts --help

# Run web app (from apps/web directory)
cd apps/web
deno task dev      # Development with watch mode
deno task start    # Production build and serve
```

### CI Pipeline

The `ci` task runs all checks in sequence:

```bash
deno task fmt:check && deno task lint && deno task check && deno task test
```

This ensures code is formatted, passes linting, type-checks, and all tests pass.

---

## Adding a New Package

```bash
# Create package directory and config
mkdir -p packages/foo
cat > packages/foo/deno.json << 'EOF'
{
  "name": "@deno-one/foo",
  "version": "0.1.0",
  "exports": "./foo.ts"
}
EOF
touch packages/foo/foo.ts
```

The package is automatically included via the `./packages/*` workspace glob.

---

## Summary

| Concern                  | Solution                                      |
| ------------------------ | --------------------------------------------- |
| Shared dependencies      | Root `imports` in `deno.jsonc`                |
| Package imports          | `@namespace/package` via workspace resolution |
| JSX compilation          | `compilerOptions` per member needing JSX      |
| npm binary packages      | `nodeModulesDir: "auto"` (use sparingly)      |
| Fresh without Vite       | Standard mode + manual Tailwind orchestration |
| Tailwind source scanning | `@source` directives in input CSS             |
| Unified workflow         | Root-level tasks with recursive flags         |
