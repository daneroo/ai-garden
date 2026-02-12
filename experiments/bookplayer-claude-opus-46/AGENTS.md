# AGENTS.md

## Workflow

- Run `bun run ci` after each phase to verify nothing is broken.
- CI pipeline: fmt:check, lint, check (tsc --noEmit), test (vitest), build.

## Tooling

- Runtime: Bun (use `bun --bun` prefix for vite commands)
- Framework: TanStack Start (file-based routing in src/routes/)
- Language: TypeScript (strict mode)
- Styling: Tailwind CSS 4
- Testing: Vitest + Testing Library

## Code Standards

- Functional components, no class components
- Use TanStack Router's loader for data fetching
- Server functions via `createServerFn` for server-side logic
- Prefer named exports

## Doc Validation

Before coding scaffold-sensitive details (routing, server functions, plugins),
query the latest TanStack Start docs to confirm current API patterns.
