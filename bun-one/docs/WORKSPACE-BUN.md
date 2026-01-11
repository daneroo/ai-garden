# Bun Workspaces Monorepo Guide

A reference guide for setting up Bun workspaces with shared libraries, shared UI
components, CLI tools, and web applications.

## Overview

Bun workspaces allow multiple packages to coexist in a monorepo with shared
dependencies and unified tooling. This guide documents the patterns used to
build this workspace.

**Core Requirements:**

- Shared TypeScript libraries consumable by all workspace members
- Shared React components with proper JSX/TSX compilation
- Multiple CLI applications using shared packages
- Multiple web applications (deferred to Phase 5)

---

## Initial Setup

### Create Directory Structure

```bash
mkdir -p bun-one/docs bun-one/packages bun-one/apps
cd bun-one
```

### Initialize Root Package

```bash
bun init -y
```

This creates a basic `package.json`. We then configure workspaces:

```bash
# Edit package.json to add workspaces
# (shown in Root Workspace Configuration section)
```

---

## Directory Structure

```text
bun-one/
├── package.json          # Root workspace configuration
├── bun.lock              # Shared lockfile for all members
├── tsconfig.json         # Shared TypeScript base config
├── eslint.config.js      # ESLint v9 flat config
├── packages/             # Shared libraries
│   └── vtt/              # VTT parsing library
│       ├── package.json
│       ├── vtt.ts
│       └── vtt.test.ts
├── components/           # Shared React components
│   └── timer/
│       ├── package.json
│       ├── Timer.tsx
│       └── Timer.test.tsx
└── apps/                 # Applications
    ├── cli/              # Command-line tool
    │   ├── package.json
    │   └── cli.ts
    └── web/              # Web application (Deferred)
        └── ...
```

**Conventions:**

- `packages/` — Shared TypeScript libraries and React components
- `apps/` — Runnable applications (CLI, web servers, etc.)

---

## Root Workspace Configuration

The root `package.json` defines workspace membership, shared dependencies, and
common tasks.

### Creating the Root package.json

```bash
cd bun-one
bun init -y
```

Then edit `package.json` to configure workspaces:

```json
{
  "name": "bun-one",
  "private": true,
  "workspaces": ["packages/*", "components/*", "apps/*"],
  "scripts": {
    "test": "bun test",
    "check": "tsc --noEmit",
    "fmt": "bunx prettier --write .",
    "fmt:check": "bunx prettier --check .",
    "lint": "bunx eslint .",
    "ci": "bun run fmt:check && bun run lint && bun run check && bun run test",
    "clean-reinstall": "rm -rf node_modules **/node_modules && bun install",
    "outdated": "bun outdated -r"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5"
  }
}
```

## Testing Strategy

### Unit Tests (Logic)

- Use standard `bun test`.
- No extra config needed.
- Example: `packages/vtt`

### Component Tests (React)

- Use **React Testing Library** (`@testing-library/react`).
- **Review Requirement**: Bun is a server-side runtime, so it has no DOM. RTL
  _requires_ a DOM to render components.
- **Solution**: Use `happy-dom` (lighter/faster than jsdom) to simulate the
  browser environment.
- **Configuration**: Per-file setup using dynamic imports to ensure `happy-dom`
  is registered before React Testing Library initializes. This prevents global
  pollution of the test environment.

```typescript
// Timer.test.tsx
GlobalRegistrator.register();
const { render } = await import("@testing-library/react");
```

## Continuous Integration

The `ci` script runs the full quality gate:

```json
"ci": "bun run fmt:check && bun run lint && bun run check && bun run test"
```

### Maintenance Scripts

- `clean-reinstall`: Removes all `node_modules` directories and reinstalls.
  Preserves `bun.lock` (safe reset).
- `outdated`: Checks for outdated packages recursively across all workspace
  members (`-r` flag).

### Installing Dev Dependencies

```bash
bun add -d typescript @types/bun
```

### Workspace Members

The `"workspaces"` array uses glob patterns to include directories. Each member
must have its own `package.json` with at minimum a `name` field.

---

## TypeScript Configuration

### Root tsconfig.json

```bash
# Create base TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "types": ["bun-types"]
  }
}
EOF
```

Individual packages can extend this config as needed.

---

## Web Application Integration

### Creating a Web App with Shared Components

```bash
# From workspace root
bun create vite apps/my-app --template react-ts --no-interactive

# Add workspace dependency (manually edit package.json)
# "dependencies": { "@bun-one/timer": "workspace:*" }

# Install from workspace root (resolves workspace: protocol)
bun install

# Run dev server
cd apps/my-app && bun run dev
```

> **Note**: `bun add @scope/pkg` tries npm first. For workspace deps, manually
> add `"workspace:*"` to package.json and run `bun install` from root.

---

## Package Configuration

### Library Package (`packages/`)

Create a new package:

```bash
mkdir -p packages/vtt
cd packages/vtt
bun init -y
```

Edit `package.json`:

```json
{
  "name": "@bun-one/vtt",
  "version": "0.1.0",
  "main": "./vtt.ts",
  "types": "./vtt.ts"
}
```

### Importing Workspace Members

Any workspace member can import from another using the package name after
declaring the dependency:

```bash
# In apps/cli
bun add @bun-one/vtt
```

This adds to `package.json`:

```json
{
  "dependencies": {
    "@bun-one/vtt": "workspace:*"
  }
}
```

Import in code:

```ts
import { parseVtt } from "@bun-one/vtt";
```

---

## Adding Dependencies

### Add to Root (Shared)

```bash
cd bun-one
bun add -d typescript @types/bun
```

### Add to Specific Package

```bash
cd packages/vtt
bun add some-package
```

Or use the `--filter` flag from root:

```bash
bun add some-package --filter @bun-one/vtt
```

---

## Development Workflow

### Common Tasks

```bash
# From workspace root
bun install           # Install all dependencies
bun test              # Run all tests
bun run fmt           # Format all code
bun run ci            # Run full CI pipeline

# Maintenance
bun run outdated      # Check recursively (uses `bun outdated -r`)
bun run clean-reinstall # Purge node_modules and reinstall (Safe: preserves bun.lock)

# Run CLI
bun run apps/cli/cli.ts --help

# Run specific package tests
bun test packages/vtt
```

---

## Summary

| Concern             | Solution                                 |
| ------------------- | ---------------------------------------- |
| Shared dependencies | Root `devDependencies` in `package.json` |
| Package imports     | `workspace:*` protocol in `dependencies` |
| JSX compilation     | `jsx: "react-jsx"` in `tsconfig.json`    |
| Unified workflow    | Root-level scripts in `package.json`     |
| Testing             | `bun test` (built-in test runner)        |
