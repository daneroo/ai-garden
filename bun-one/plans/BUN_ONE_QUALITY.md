# Bun One Quality Ongoing Plan

Tracks ongoing work for the monorepo-local `@bun-one/quality` package and the
`bun-one-quality` CLI.

Goal: stop thinking about formatter/linter/tool wiring. One local-only command
suite that is portable across workspaces/repos.

## Context

Current state (root scripts):

- `fmt`: `bunx prettier --write .`
- `fmt:check`: `bunx prettier --check .`
- `lint`: `bunx eslint .`
- `check`: `tsc --noEmit`
- `test`: `bun test`
- `test:e2e`: `RUN_E2E_TESTS=1 bun test`
- `ci`: `fmt:check && lint && check && test`

Pain points:

- Markdown table formatting (width/alignment/wrapping) is not acceptable with
  Prettier alone.
- Too many dotfiles/config sprawl.
- Workspaces/nested packages multiply the “where does config live?” problem.
- Requirement: local only. No SaaS, no tiers, no cloud/CI platform dependencies.

## Goals

- Single reusable package `@bun-one/quality` that contains:
  - All configuration (prefer JSONC with schemas where possible)
  - A CLI entry point (`bun-one-quality`) that runs the toolchain
  - Minimal and stable root `package.json` scripts

- Fix Markdown table formatting by using dprint for Markdown (`.md`/`.mdx`).
- Preserve existing semantics:
  - `test:e2e` remains `RUN_E2E_TESTS=1 bun test`.
  - `ci` remains local and deterministic.

## Non-Goals

- Not trying to replace the underlying tools (Prettier/ESLint/TypeScript/Bun
  test).
- Not trying to introduce a new build system or CI platform.
- Not trying to auto-run in editors; that can be added later.

## Success Criteria

- `bun run quality` and `bun run quality:check` exist at repo root and do not
  require any other repo-level dotfiles.
- `bun run quality` fixes:
  - code formatting (Prettier)
  - Markdown tables (dprint)
  - lint autofix where applicable (ESLint `--fix`)

- `bun run quality:check` checks the same without modifying files.
- `bun run ci` runs (local only):
  - `quality:check`
  - `typecheck`
  - `test`
  - optionally `test:e2e` via explicit separate command

- Running from monorepo root formats/lints across nested workspaces without
  per-package scripts.
- Moving `packages/quality` to another repo requires only:
  - adding it as a workspace package
  - adding 3–6 root scripts that call `bunx bun-one-quality ...`

## Implementation Plan

Before checking any box: `bun run ci` must pass.

### Issue: Create `@bun-one/quality` workspace package

- Goal: add the package skeleton and CLI wiring.

- [ ] Create `packages/quality/` with:
  - `package.json` (`name=@bun-one/quality`, `type=module`, `bin` entry)
  - `bin/quality.mjs`
  - `config/` directory

- [ ] Add root `devDependencies` (tool versions pinned here):
  - `prettier`, `eslint`, `typescript`, `dprint`, (optional) `markdownlint-cli2`
  - `@bun-one/quality: workspace:*`

- [ ] Add root scripts (minimal):
  - `quality`: `bunx bun-one-quality fix`
  - `quality:check`: `bunx bun-one-quality check`
  - `ci`: `bunx bun-one-quality ci`

### Issue: Markdown table formatting via dprint

- Goal: tables behave like `deno fmt` for Markdown.

- [ ] Add `config/dprint.jsonc` with `$schema` and markdown plugin.

- [ ] Implement `bun-one-quality fix` to run:
  - `bunx dprint fmt "**/*.{md,mdx}" -c <pkg>/config/dprint.jsonc`

- [ ] Implement `bun-one-quality check` to run:
  - `bunx dprint check "**/*.{md,mdx}" -c <pkg>/config/dprint.jsonc`

- [ ] Add a regression test markdown file under `packages/quality/fixtures/`:
  - include at least one “ugly table” that should be stabilized by dprint

### Issue: Preserve existing repo semantics

- Goal: match today’s behavior.

- [ ] Implement CLI subcommands:
  - `typecheck` => `bunx tsc --noEmit`
  - `test` => `bun test`
  - `test:e2e` => `RUN_E2E_TESTS=1 bun test`
  - `ci` => `check + typecheck + test` (no implicit e2e)

### Issue: ESLint and Prettier configs live in the package

- Goal: keep config out of repo root.

- [ ] Add `config/prettier.jsonc` with schema.

- [ ] Add `config/eslint.config.mjs` (flat config, minimal ignores).

- [ ] Update CLI:
  - `fix` runs `prettier --write . --config <pkg>/config/prettier.jsonc`
  - `check` runs `prettier --check . --config <pkg>/config/prettier.jsonc`
  - `fix` runs `eslint . --config <pkg>/config/eslint.config.mjs --fix`
  - `check` runs `eslint . --config <pkg>/config/eslint.config.mjs`

### Issue: Optional markdownlint integration

- Goal: lint markdown without fighting dprint.

- [ ] Add `config/markdownlint.jsonc` with schema.

- [ ] Decide if markdownlint runs by default:
  - default ON, but trivially disabled via optional override mechanism

- [ ] Implement:
  - `bunx markdownlint-cli2 "**/*.{md,mdx}" --config <pkg>/config/markdownlint.jsonc`

- [ ] Ensure rules do not conflict with dprint’s formatting decisions.

### Issue: Minimal customization mechanism

- Goal: allow per-repo overrides without config sprawl.

- [ ] Add support for optional root override file:
  - `quality.config.jsonc` (single file, optional)

- [ ] Supported overrides (minimal):
  - `paths.mdGlob`, `paths.codeRoot` (default `.`)
  - `tools.markdownlint` boolean
  - `prettier.printWidth` and `dprint.lineWidth`

- [ ] Confirm behavior when override is absent: defaults only.

## Testing Strategy

### Smoke tests

- [ ] `bun run quality:check` on a clean tree returns exit code 0.
- [ ] Introduce a known formatting change in a markdown table; `bun run quality`
      fixes it.
- [ ] Introduce a known lint issue; `bun run quality` fixes it (if ESLint
      autofixable).

### Determinism tests

- [ ] Run `bun run quality` twice; second run produces no diffs.
- [ ] Run on nested workspaces; verify it formats/lints across the tree.

### Fixture tests

- [ ] Add `fixtures/markdown-tables.md` containing:
  - thin-column tables
  - long text cells
  - alignment markers

- [ ] Document expected stabilization (no churn on repeated runs).

## Backlog

- Add `--only md|code|lint|test|typecheck` flags to CLI.
- Add `--changed` mode (git diff-based) for faster local runs.
- Add `--cwd` support if invoked from a workspace subdir.
- CUE helper (Go) + validate/gen + diff
- Track `oxlint / oxfmt` from <https://oxc.rs/>
- Add editor integration guidance (VS Code) but keep it optional.
- Consider replacing ESLint invocation with a narrower scope if performance
  becomes an issue.
