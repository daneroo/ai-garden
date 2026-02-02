# Bun-One Retrospective

**Date:** 2026-02-02 **Status:** Proof of Concept Complete

You have successfully established a Bun-based Monorepo that demonstrates code
sharing across three distinct modern web architectures.

## 1. The Structure

You moved away from isolated projects into a unified workspace:

- packages/: Pure logic libraries (e.g., `@bun-one/vtt`)
- components/: Shared React UI libraries (e.g., `@bun-one/timer`)
- apps/: Applications consuming these packages.

## 2. What You Accomplished (The "One" Stack)

You proved that a single component (`Timer`) and a single logic library (`vtt`)
can be consumed by three different meta-frameworks simultaneously.

Here is exactly what you used to start each app and how you modified it:

### `vite-one` (Vite SPA)

- Starter: `bun create vite apps/vite-one --template react-ts`
- Modifications:
  - Tailwind: Added `tailwindcss` v4 + `@tailwindcss/vite`.
  - DaisyUI: Added `daisyui` v5 beta.
  - Workspace: Added dependency `"@bun-one/timer": "workspace:*"` to
    `package.json`.
  - Code: Created `Home.tsx`, `About.tsx` (Timeline demo), and `Logo.tsx` (SVG
    art).
- Key Features: Tailwind 4 + DaisyUI 5 Beta. Showcases pure client-side
  component sharing.

### `tan-one` (TanStack Start)

- Starter: `bun create @tanstack/start@latest tan-one`
- Modifications:
  - Nitro: Added `nitro` with `{ preset: "bun" }` in `app.config.ts`.
  - Workspace: Added dependencies (`@bun-one/vtt`, `@bun-one/timer`).
  - Server Functions: Implemented `src/lib/vtt-server.ts` to expose VTT logic.
  - Layout: Modified `src/routes/__root.tsx` to include a global `<Header />`.
- Key Features: Server Functions. Uses `vtt` logic on the server to read
  filesystem dates and sends summaries to client. **Missing:** DaisyUI (uses
  standard Tailwind).

### `starlight` (Documentation)

- Starter: `bun create astro apps/starlight --template starlight/tailwind`
- Modifications:
  - React: Installed `@astrojs/react` to render interactive components.
  - Tailwind: Configured via `@astrojs/starlight-tailwind`.
  - Workspace: Added `"@bun-one/timer": "workspace:*"`.
  - Content: Created `src/content/docs/guides/timer.mdx` embedding the
    `<Timer />`.
- Key Features: MDX Integration. Renders the interactive `Timer` component
  directly inside documentation pages.
- Missing: DaisyUI (uses Starlight's default theme + Tailwind).

## 3. Package Inventory

### Shared Code

- `@bun-one/timer` (`components/timer`):
  - A robust, styled React component.
  - Demonstrates sharing UI + Tailwind styles across apps.
- `@bun-one/vtt` (`packages/vtt`):
  - Core business logic for parsing/summarizing VTT files.
  - Exports server-specific utilities (`readVtt` using `node:fs`) and shared
    utilities (`formatTimestamp`).

### Fully Functional CLI

- `@bun-one/whisper` (`apps/whisper`):
  - Status: Feature-complete CLI wrapper for `whisper.cpp`.
  - Features: Parallel execution, benchmarking, VTT generation, and alignment
    analysis.
  - Refactor Opportunity: currently contains a _duplicate_ implementation of the
    VTT logic found in `@bun-one/vtt`. The next logical step is to replace
    `apps/whisper/lib/vtt.ts` with imports from the shared package.

### Skeletons / In-Progress

- `@bun-one/epub` (`packages/epub`): A basic library skeleton.

## 4. Evidence & Verification

How we determined the lineage of your changes:

- Architectural Intent: Verified against your log in `docs/WORKSPACE-BUN.md`
  (lines 199, 234, 392).
- TanStack Start Origin: Confirmed by `apps/tan-one/vite.config.ts` containing
  the manual `nitro({ preset: "bun" })` addition, matching your manual setup
  notes.
- Vite Evolution: Confirmed by `apps/vite-one/package.json` containing
  `@tailwindcss/vite` (v4 beta) and `daisyui` (v5 beta)—libraries _not_ present
  in the standard React starter.
- Component Sharing: Verified by
  `apps/starlight/src/content/docs/guides/timer.mdx` which explicitly imports
  `{ Timer } from "@bun-one/timer"`, proving the cross-workspace consumption.

## 5. Conclusion

You haven't just "done experiments"—you have successfully validated the
architecture.

You now have a working platform where:

1. You can write business logic once (`packages/*`).
2. You can write UI components once (`components/*`).
3. You can deploy them to Documentation (Starlight), Dashboards (TanStack), or
   SPAs (Vite) without code duplication.
