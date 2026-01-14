# Bun CLI Project

A production-ready CLI scaffold using Bun, TypeScript, Yargs, and Biome.

## Features

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Arguments**: [Yargs](https://yargs.js.org/)
- **Linting/Formatting**: [Biome](https://biomejs.dev/)
- **Testing**: Native `bun test`

## Getting Started

### Installation

```bash
bun install
```

### Development

Run the CLI in development mode:

```bash
bun start
# or with arguments
bun start --name Universe
```

Watch mode for rapid development:

```bash
bun run dev
```

### Testing

Run the automated test suite:

```bash
bun test
```

### Linting & Formatting

Check for issues:

```bash
bun run lint
```

Auto-fix issues:

```bash
bun run format
```

## Project Structure

- `src/index.ts`: Main entry point
- `tests/index.test.ts`: Integration tests
- `biome.json`: Tooling configuration
