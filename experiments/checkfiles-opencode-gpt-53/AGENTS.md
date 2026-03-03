# AGENTS.md

## CI Loop (Required after every edit)

- Run `bun run ci`
- If formatting/checks fail, run `bun run fmt`
- Rerun `bun run ci`
- Do not mark phase/task complete until CI is green

## Dependencies

- Add dependencies with `bun add` / `bun add -d` (never edit `package.json`
  directly)

## Scope

- Only modify files inside `experiments/checkfiles-opencode-gpt-53/` unless the
  user explicitly asks otherwise.
