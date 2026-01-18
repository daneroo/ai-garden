# Agent Context & Instructions

## Project Context

- Repository Type: Monorepo
- Current Workspace: `bun-one/apps/vite-one`
- Runtime: [Bun](https://bun.sh) (v1.x)
- Framework: React + Vite + TypeScript

Use only bun commands, not npm or pnpm.

## Workflow Rules

- Verification: ALWAYS run `bun run ci` after making any code or markdown
  modifications to ensure integrity.
- Formatting: If `bun run ci` fails due to formatting, run `bun run fmt` to fix
  it automatically.
- Scripts: Use `bun run <script>` for all package.json scripts.

## Markdown Rules

- Avoid spurious bolding in markdown files.
- Do not use numbered lists; use bullet points instead.
- Do not use emojis unless directed to do so. utf8 symbols are ok.

## Key Paths

- Root: `<repo-root>/bun-one/apps/vite-one` (This is the effective root for this
  sub-project)
