# OpenCode + Oh-My-OpenCode Installation Guide

This document describes installing OpenCode with the oh-my-opencode plugin when
using Google Antigravity OAuth (which provides Claude models) and OpenAI OAuth.

## Reverting Using Antigravity Claude Models

- plan B:
  - comment out google/antigravity-claude-\* models
    - `scp -p opencode.json opencode-bak.json`
    - `mv opencode.json opencode.jsonc`
  - swap Sisyphus.model
    - from "google/antigravity-claude-opus-4-5-thinking"
    - to "google/antigravity-gemini-3-pro-high"

## Model Definition Lifecycle (SOLVED)

### Key Finding

**Antigravity models are NOT auto-generated or fetched from any API.** They must
be **manually copied** from the opencode-antigravity-auth README into your
config.

### Source Chain

| Component                     | Role                        | Writes Models?                                |
| ----------------------------- | --------------------------- | --------------------------------------------- |
| **opencode-antigravity-auth** | OAuth + request transformer | NO - only reads `provider.models` from config |
| **oh-my-opencode v2.14.0**    | Installer/config manager    | YES - but only Gemini + OpenAI (NO Claude)    |
| **OpenCode core**             | Fetches from models.dev     | YES - but no `antigravity-*` models there     |

### Authoritative Source for Antigravity Models

The **only source** for `antigravity-claude-*` and `antigravity-gemini-*` model
definitions is the **opencode-antigravity-auth README**:

- GitHub:
  https://github.com/NoeFabris/opencode-antigravity-auth#available-models
- Local (if installed):
  `~/.asdf/installs/nodejs/*/lib/node_modules/opencode-antigravity-auth/README.md`

Look for the "Full models configuration (copy-paste ready)" section.

### How to Update Models

When new models are released:

1. Check the plugin's README for updated model definitions
2. Manually merge new models into `~/.config/opencode/opencode.json` under
   `provider.google.models`

Or use the README's LLM agent prompt:

```
Install the opencode-antigravity-auth plugin and add the Antigravity model
definitions to ~/.config/opencode/opencode.json by following:
https://raw.githubusercontent.com/NoeFabris/opencode-antigravity-auth/dev/README.md
```

### Why oh-my-opencode Deletes Claude Models

oh-my-opencode v2.14.0's `addProviderConfig()` function in
`src/cli/config-manager.ts` **replaces** `provider.google.models` entirely with
its hardcoded list (which contains only Gemini models, not Claude).

**Workaround**: Always re-add Claude models after running
`oh-my-opencode install`.

## Overview

- **OpenCode**: <https://opencode.ai/docs>
- **oh-my-opencode**: <https://github.com/code-yeongyu/oh-my-opencode>
  - npm package: `oh-my-opencode` (v2.14.0 stable, v3.0.0-beta.5 in repo)
- **opencode-antigravity-auth**:
  <https://github.com/NoeFabris/opencode-antigravity-auth>
- **opencode-openai-codex-auth**:
  <https://github.com/numman-ali/opencode-openai-codex-auth>

## Installation Steps

### 1. Install OpenCode

```bash
brew install anomalyco/tap/opencode
```

### 2. Authenticate with Providers

```bash
opencode auth login
# Select Google -> OAuth with Google (Antigravity)
# Select OpenAI -> ChatGPT Plus/Pro (Codex Subscription)
```

After authentication, verify your available models:

```bash
opencode models | grep -i claude
```

You should see Claude models provided via Google Antigravity:

```txt
google/antigravity-claude-opus-4-5-thinking
google/antigravity-claude-sonnet-4-5
google/antigravity-claude-sonnet-4-5-thinking
```

**Save this list before proceeding** - you'll need it if the next step
overwrites your model configuration.

### 3. Install oh-my-opencode

```bash
bunx oh-my-opencode install --no-tui --claude=no --chatgpt=yes --gemini=yes
```

Flag options:

- `--claude=no|yes|max20` - Direct Claude subscription (not via Antigravity)
- `--chatgpt=yes|no` - ChatGPT Plus/Pro subscription
- `--gemini=yes|no` - Google Gemini integration

## Known Issue: Claude Models Deleted

**Problem**: The oh-my-opencode installer overwrites
`~/.config/opencode/opencode.json`, removing any Claude models that were
configured via the `opencode-antigravity-auth` plugin.

After running the installer, `opencode models | grep -i claude` returns nothing.

**Root Cause**: The oh-my-opencode installer writes its own
`provider.google.models` configuration, which only includes Gemini models. The
Claude model definitions from `opencode-antigravity-auth` are lost.

**Solution**: Manually restore the Claude model definitions by adding them to
`~/.config/opencode/opencode.json` under `provider.google.models`.

The correct configuration comes from the
[opencode-antigravity-auth README](https://github.com/NoeFabris/opencode-antigravity-auth):

```json
{
  "provider": {
    "google": {
      "models": {
        "antigravity-claude-opus-4-5-thinking": {
          "name": "Claude Opus 4.5 Thinking (Antigravity)",
          "limit": { "context": 200000, "output": 64000 },
          "modalities": {
            "input": ["text", "image", "pdf"],
            "output": ["text"]
          },
          "variants": {
            "low": { "thinkingConfig": { "thinkingBudget": 8192 } },
            "max": { "thinkingConfig": { "thinkingBudget": 32768 } }
          }
        },
        "antigravity-claude-sonnet-4-5": {
          "name": "Claude Sonnet 4.5 (Antigravity)",
          "limit": { "context": 200000, "output": 64000 },
          "modalities": {
            "input": ["text", "image", "pdf"],
            "output": ["text"]
          }
        },
        "antigravity-claude-sonnet-4-5-thinking": {
          "name": "Claude Sonnet 4.5 Thinking (Antigravity)",
          "limit": { "context": 200000, "output": 64000 },
          "modalities": {
            "input": ["text", "image", "pdf"],
            "output": ["text"]
          },
          "variants": {
            "low": { "thinkingConfig": { "thinkingBudget": 8192 } },
            "max": { "thinkingConfig": { "thinkingBudget": 32768 } }
          }
        }
      }
    }
  }
}
```

### 4. Configure oh-my-opencode Agents

Since you have Claude via Antigravity, update
`~/.config/opencode/oh-my-opencode.json` to use Claude Opus for Sisyphus (the
main orchestrator):

```json
{
  "$schema": "https://raw.githubusercontent.com/code-yeongyu/oh-my-opencode/master/assets/oh-my-opencode.schema.json",
  "google_auth": false,
  "agents": {
    "Sisyphus": {
      "model": "google/antigravity-claude-opus-4-5-thinking"
    },
    "oracle": {
      "model": "openai/gpt-5.2"
    },
    "librarian": {
      "model": "opencode/glm-4.7-free"
    },
    "explore": {
      "model": "google/antigravity-gemini-3-flash"
    },
    "frontend-ui-ux-engineer": {
      "model": "google/antigravity-gemini-3-pro-high"
    },
    "document-writer": {
      "model": "google/antigravity-gemini-3-flash"
    },
    "multimodal-looker": {
      "model": "google/antigravity-gemini-3-flash"
    }
  }
}
```

Note: The installer defaults Sisyphus to `opencode/glm-4.7-free` because it
assumes no Claude access when `--claude=no` is passed. It doesn't account for
Claude being available via Google Antigravity OAuth.

## Final Configuration

### Plugins (`~/.config/opencode/opencode.json`)

```json
{
  "plugin": [
    "opencode-antigravity-auth@beta",
    "oh-my-opencode",
    "opencode-openai-codex-auth"
  ]
}
```

### Agent Model Assignments

| Agent             | Model                                         | Purpose                   |
| ----------------- | --------------------------------------------- | ------------------------- |
| Sisyphus          | `google/antigravity-claude-opus-4-5-thinking` | Main orchestrator         |
| Oracle            | `openai/gpt-5.2`                              | Architecture, debugging   |
| Librarian         | `opencode/glm-4.7-free`                       | Documentation (cheap)     |
| Explore           | `google/antigravity-gemini-3-flash`           | Fast codebase exploration |
| Frontend UI/UX    | `google/antigravity-gemini-3-pro-high`        | UI/UX development         |
| Document Writer   | `google/antigravity-gemini-3-flash`           | Technical writing         |
| Multimodal Looker | `google/antigravity-gemini-3-flash`           | Image/PDF analysis        |

## Verification

```bash
# Check OpenCode version
opencode --version

# Verify Claude models are available
opencode models | grep -i claude

# Check authentication
opencode auth list
```

## References

- [OpenCode Documentation](https://opencode.ai/docs)
- [oh-my-opencode GitHub](https://github.com/code-yeongyu/oh-my-opencode)
- [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth)
- [opencode-openai-codex-auth](https://github.com/numman-ali/opencode-openai-codex-auth)
