# OpenCode + agentic-cli Installation Guide

This document describes installing OpenCode with Google Antigravity OAuth and
OpenAI OAuth.

## TODO

- [ ] Try Desktop App
- [ ] opencode config
      [custom formatter for markdown](https://opencode.ai/docs/formatters/#custom-formatters) -
      use deno?!

## Current State

As of 2026-01-14, I removed [oh-my-opencode](./oh-my-opencode/README.md) in
favor of [agentic-cli](./agentic-cli/README.md)

## Antigravity OAuth

Fetch the list of models from
<https://github.com/NoeFabris/opencode-antigravity-auth#available-models>

### Antigravity Claude Models

The Claude models caused immediate rate limiting errors, and caused quota limit
delay of >3 days, so we ended up disabling them.

- comment out google/antigravity-claude-\* models
  - `scp -p opencode.json opencode-bak.json`
  - `mv opencode.json opencode.jsonc`

## Installation

### 1. Install OpenCode

```bash
brew install anomalyco/tap/opencode
```

### 2. Authenticate with Providers

```bash
opencode auth login
# Select Google -> OAuth with Google (Antigravity)
# Select OpenAI -> ChatGPT Plus/Pro (Codex Subscription)

# Check authentication
opencode auth list
```

After authentication, verify your available models:

```bash
opencode models
```

## References

- [OpenCode Documentation](https://opencode.ai/docs)
- [agentic-cli](https://github.com/Cluster444/agentic/tree/master)
- [oh-my-opencode GitHub](https://github.com/code-yeongyu/oh-my-opencode)
- [opencode-antigravity-auth](https://github.com/NoeFabris/opencode-antigravity-auth)
- [opencode-openai-codex-auth](https://github.com/numman-ali/opencode-openai-codex-auth)
