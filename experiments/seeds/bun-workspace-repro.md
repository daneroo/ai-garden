# Bun Workspace Reproduction Requirements

**Note:** WIP Not tested yet; we wight start with just tanstack-start and
worskapce later

A task to recreate the core architecture of the `bun-one` monorepo: a shared
workspace with a strongly-typed web app, shared UI components, and server-side
logic.

## Goal

Create a Bun Monorepo containing:

- `packages/vtt`: A shared TypeScript library (Universal Logic)
- `packages/server-ffprobe`: A shared TypeScript library (Server-Only Logic)
- `components/counter`: A shared React component library (Client-Compatible UI)
- `apps/tan-reader`: A TanStack Start application that consumes all of the above

## Workflow / CI

- Each experiment created from this seed should include a local `AGENTS.md`
- Each experiment should include a `PLAN.md` with milestones and a Session Audit
  Trail
- `bun run ci` must pass at the root level, validating all members of the
  workspace.

**CI Script Definition:** The root `package.json` must implement `ci` as a
composite of these scripts:

```json
{
  "scripts": {
    "lint": "eslint .",
    "check": "tsc --noEmit",
    "test": "bun test",
    "fmt": "prettier --check .",
    "ci": "bun run fmt && bun run lint && bun run check && bun run test"
  }
}
```

## Tech Stack

- Runtime: Bun
- Framework: TanStack Start (for the web app)
- Server: Nitro (via TanStack Start `preset: "bun"`)
- Styling: Tailwind CSS v4 + DaisyUI (Semantic Theming)

## Architecture Specs

### 1. Workspace Structure

Start with a standard Bun workspace layout:

```text
root/
├── package.json (workspaces: ["apps/*", "packages/*", "components/*"])
├── packages/    (universal and server libraries)
├── components/  (React UI libraries)
└── apps/        (Deployable applications)
```

### 2. `packages/vtt` (Universal Logic)

Create a package `@workspace/vtt` that exports utilities.

- Function A: `formatTimestamp(seconds: number): string` (Universal - pure
  logic)
- Function B: `scanDirectory(path: string): Promise<string[]>` (Server-Side -
  uses `node:fs`)
- Implementation: Exports both. Consumers (apps) must import the correct ones
  for their environment, or via Server Functions.

### 3. `packages/server-ffprobe` (Server-Only Logic)

Create a package `@workspace/server-ffprobe` that uses `Bun.spawn` to run
`ffprobe`.

- Function: `probeFile(filePath: string): Promise<Metadata>`
- Requirement: Must use `ffprobe` (assumed to be in PATH) with
  `-print_format json`.
- Metadata extracted:
  - Duration (seconds)
  - Bitrate (kbps)
  - Codec (audio codec name)
  - Title tag
  - Artist tag
  - File size

### 4. `components/counter` (Client UI)

Create a package `@workspace/counter` that exports a React component.

- Component: `<Counter initial={0} />`
- Styling: Must use Tailwind CSS classes.
- Interactivity: Client-side state (useState) to increment/decrement.
- Requirement: Must NOT bundle React; declare it as a peer dependency.

### 5. `apps/tan-reader` (The App)

Create a TanStack Start application.

- Configuration:
  - configured with `nitro({ preset: "bun" })` in `vite.config.ts`
  - configured to consume workspace dependencies
- Styling:
  - Install Tailwind CSS v4 and **DaisyUI**
  - Crucial: Configure Tailwind to scan `../../components/counter` for classes
    (using `@source` in CSS)
- Features:
  - Route `/`: A landing page measuring the "Repo Health" (just a static
    dashboard)
  - Server Function: A function that calls `@workspace/vtt` to list files, then
    calls `@workspace/server-ffprobe` for each file to get metadata.
  - Client Usage: Import and use `formatTimestamp` from `@workspace/vtt` to
    display the duration.
  - Component Usage: Import and render `<Counter />` from `@workspace/counter`
    on the page.

## Success Criteria

1. Uniform CI: `bun run ci` at the root runs types, lint, and tests for all 3
   packages
2. Server Functionality: Web app displays real metadata (duration/codec) fetched
   from the server.
3. Universal Usage: The web app successfully uses `formatTimestamp` on the
   client side.
4. Shared UI: The counter works and is styled correctly (proving Tailwind config
   across workspace boundaries works)
5. DaisyUI Integrated: The web app uses DaisyUI themes (e.g., `btn btn-primary`)
   effectively

## Implementation Steps (Suggested)

1. Scaffold: `bun init` root, then create the 4 directories
2. Shared Logic: Implement `@workspace/vtt` and `@workspace/server-ffprobe`
3. Shared UI: Implement `@workspace/counter`
4. Web App: Scaffold TanStack Start using the verified CLI command:
   ```bash
   bunx @tanstack/cli create apps/tan-reader \
     --framework React \
     --package-manager bun \
     --tailwind \
     --add-ons nitro \
     --no-git \
     --no-interactive
   ```
   (This implicitly adds `start` mode, adds `nitro` config, and sets up
   Tailwind).

5. **Configuration Fix**: Manually edit `apps/tan-reader/vite.config.ts` to set
   the Nitro preset:
   ```ts
   // ...
   nitro({ preset: "bun" }),
   // ...
   ```
   (The CLI defaults to generic `nitro()`, which is insufficient for Bun).

6. Integration: Import the packages into the web app and prove they work

## Stretch Goals (Future - Out of Scope)

- Adding a `starlight` documentation app
- Adding a `vite` SPA app
- Adding `storybook` for component development
- Consolidating `eslint` and `prettier` config at the root
