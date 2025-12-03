---
trigger: always_on
---

# Project Instructions

## Tech Stack
- **Runtime**: Bun (use `bun run`, `bun install`, etc.)
- **Language**: TypeScript (single file scripts preferred for this project)
- **No Build Step**: Run TypeScript files directly with Bun.

## Project Structure
- `validate-chapters.ts`: Main script for validating audiobook chapters.
- `metadata.json`: Chapter metadata.
- `*.m4b`: Audiobook files.

## Guidelines
- Avoid unnecessary config files (`tsconfig.json`, etc.) unless strictly needed.
- Keep scripts self-contained.
- Use `bun` for all execution.
