# Agent Directives

## Workflow

**CI-Driven Development**: After completing each meaningful task or phase, run:

```bash
bun run ci
```

Fix any failures before proceeding to the next phase.

## Tooling Rules

- **Runtime**: Bun (not Node.js)
- **Package Manager**: Bun's built-in package manager
- **Module System**: ESM (type: "module" in package.json)
- **TypeScript**: Strict mode enabled
- **CLI Framework**: Commander
- **TUI Framework**: OpenTUI
- **Metadata Tool**: ffprobe (from ffmpeg package)

## Code Standards

- Prefer named exports over default exports
- Use TypeScript strict mode
- Handle errors gracefully with user-friendly messages
- Follow functional programming patterns where appropriate
- Keep functions focused and composable

## Testing

- Write tests for core logic (scanning, metadata extraction)
- Use Bun's built-in test runner
- Ensure tests pass before marking milestones complete
