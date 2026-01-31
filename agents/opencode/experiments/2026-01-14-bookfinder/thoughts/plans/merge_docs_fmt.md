# Documentation & Enforcement Implementation Plan

## Overview

This plan consolidates project documentation by merging `CLAUDE.md` into
`AGENTS.md`, implements strict Markdown quality control using `deno fmt` and
`markdownlint-cli2`, and configures OpenCode-specific tooling to enforce these
standards proactively.

## Current State Analysis

- **Documentation**: Split between `CLAUDE.md` (tech rules) and `AGENTS.md`
  (agent rules).
- **Tooling**: Basic `package.json` scripts exist, but no specific Markdown
  enforcement.
- **OpenCode Config**: No local OpenCode configuration exists to enforce
  formatters at the tool level.
- **Goal**: A unified documentation source and "continual enforcement" of
  Markdown standards.

## Desired End State

- **Documentation**: `AGENTS.md` is the single source of truth. `CLAUDE.md` is
  deleted.
- **Enforcement Layer 1 (Native)**: `.opencode/config.json` exists with
  formatter hooks.
- **Enforcement Layer 2 (Scripts/CI)**: `package.json` has `fmt:md`, `lint:md`,
  `check:md` scripts hooked into `ci`.
- **Enforcement Layer 3 (Instruction)**: `AGENTS.md` explicitly mandates
  self-correction by the agent.

## Implementation Approach

1. **Configure**: Create `.opencode/config.json` and `.markdownlint.yaml`.
2. **Scripts**: Add scripts to `package.json`.
3. **Merge**: Integrate `CLAUDE.md` content into `AGENTS.md` and delete the old
   file.
4. **Verify**: Run CI and verify the new configuration.

---

## Phase 1 Configuration & Tooling

### Phase 1 Overview

Set up the linting/formatting configuration and OpenCode hooks.

### Phase 1 Changes Required

#### 1. OpenCode Configuration

**File**: `.opencode/config.json` **Action**: Create file with formatter
definitions.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "formatter": {
    "custom-markdown-formatter": {
      "command": ["deno", "fmt", "$FILE"],
      "extensions": [".md"]
    }
  }
}
```

#### 2. Markdownlint Configuration

**File**: `.markdownlint.yaml` **Action**: Create file to ignore node_modules
and align with Deno.

```yaml
# Ignore line length (MD013) as we rely on Deno fmt for wrapping
MD013: false
# Ignore node_modules
globs:
  - "!node_modules/**/*"
```

#### 3. Package Scripts

**File**: `package.json` **Action**: Add Markdown specific scripts and update
`ci`.

```json
{
  "scripts": {
    "fmt:md": "deno fmt **/*.md",
    "lint:md": "bunx markdownlint-cli2 \"**/*.md\"",
    "check:md": "deno fmt --check **/*.md && bunx markdownlint-cli2 \"**/*.md\"",
    "ci": "bun run lint && bun run check && bun run check:md && bun run test"
  }
}
```

### Phase 1 Success Criteria

- [ ] `bun run lint:md` runs without checking `node_modules`.
- [ ] `bun run check:md` validates formatting.
- [ ] `.opencode/config.json` exists.

---

## Phase 2 Documentation Consolidation

### Phase 2 Overview

Merge `CLAUDE.md` content into `AGENTS.md` and delete the old file.

### Phase 2 Changes Required

#### 1. Update AGENTS.md

**File**: `AGENTS.md` **Changes**:

- Append a "## Technical Guidelines" section.
- Copy relevant sections from `CLAUDE.md`:
  - "Use Bun instead of Node.js" rules.
  - "APIs" (Bun.serve, etc.).
  - "Testing" patterns.
  - "Frontend" notes.
- Add a new "## Enforcement" section:
  > **Crucial**: Run `bun run fmt:md` and `bun run lint:md` on every markdown
  > file change. The CI pipeline will fail if these are not clean. You must
  > self-correct any Markdown issues immediately.

#### 2. Delete CLAUDE.md

**Action**: `rm CLAUDE.md`

#### 3. Format

**Action**: Run `bun run fmt:md` to ensure the new `AGENTS.md` is compliant.

### Phase 2 Success Criteria

- [ ] `AGENTS.md` contains all technical rules.
- [ ] `CLAUDE.md` is gone.
- [ ] `bun run check:md` passes.

---

## Phase 3 Validation

### Phase 3 Overview

Verify the entire pipeline works as expected.

### Phase 3 Steps

1. Run `bun run ci`.
2. Check that `deno fmt` is working (files should remain formatted).

### Phase 3 Success Criteria

- [ ] `bun run ci` passes green.
