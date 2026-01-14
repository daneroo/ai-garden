# Scaffold Enhanced Bun TypeScript CLI Implementation Plan

## Overview

This plan establishes a robust foundation for a Bun-based command-line interface
(CLI) tool. We will move beyond the basic `bun init` by integrating **Yargs**
for argument parsing, **Biome** for modern linting/formatting, and a structured
testing environment using Bun's native test runner.

## Current State Analysis

- **Directory**: The current directory is clean (contains only agent docs).
- **Missing**: No `package.json`, `tsconfig.json`, or source code exists.
- **Goal**: Transform this empty state into a production-ready "Hello World" CLI
  scaffold.

## Desired End State

A complete project structure:

- `src/index.ts`: Entry point with `yargs` logic.
- `tests/index.test.ts`: Automated tests verifying CLI output.
- `biome.json`: Strict linting and formatting rules.
- `package.json`: Scripts for dev, test, and lint.
- `README.md`: Clear instructions for usage and development.

### Key Discoveries

- **Runtime**: Bun is the target runtime.
- **Library**: Yargs is preferred over Commander for this project.
- **Testing**: Bun's built-in runner (`bun test`) is sufficient and faster than
  external runners.

## What We're NOT Doing

- **Complex Features**: We are implementing a "Hello World" example, not a full
  business application.
- **CI/CD**: Setting up GitHub Actions is out of scope for this initial
  scaffold.
- **Distribution**: Publishing to npm is not part of this immediate task.

## Implementation Approach

We will follow a standard sequential approach:

1. **Initialize**: Generate base config.
2. **Dependencies**: Install runtime and dev dependencies.
3. **Core Logic**: Implement the CLI with Yargs.
4. **Tooling**: Configure Biome and Tests.

---

## Phase 1: Project Initialization & Dependencies

### Phase 1 Overview

Bootstrap the project with Bun and install necessary packages.

### Phase 1 Changes Required

#### 1. Initialize Project

**Action**: Run `bun init -y` to generate `package.json` and `tsconfig.json`.

#### 2. Install Dependencies

**Action**: Install production and dev dependencies.

- **Prod**: `yargs`
- **Dev**: `@types/yargs`, `@types/bun`, `@biomejs/biome`

#### 3. Git Configuration

**File**: `.gitignore` **Changes**: Add standard ignores for Node/Bun projects.

```text
node_modules
dist
.env
.DS_Store
*.lock
!bun.lockb
```

### Success Criteria

#### Automated Verification

- [x] `bun test` passes.
- [x] `bun run lint` passes (no errors).

#### Manual Verification

- [x] `README.md` is accurate and helpful.

---

## Testing Strategy

### Unit Tests

- **Target**: `tests/index.test.ts`
- **Scope**: Verify the CLI accepts arguments and outputs text correctly.
- **Mechanism**: Integration-style test using `Bun.spawn` to treat the CLI as a
  black box.

### Manual Testing Steps

1. Run `bun start` -> Verify "Hello World!".
2. Run `bun start --name User` -> Verify "Hello User!".
3. Run `bun run lint` -> Verify no errors.

## References

- Ticket: `thoughts/tickets/feature_scaffold_bun_cli.md`
- Research: `thoughts/research/2026-01-14_scaffold_bun_cli.md`
