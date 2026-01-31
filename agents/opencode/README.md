# OpenCode + agentic-cli Installation Guide

This document describes installing OpenCode with Google Antigravity OAuth and
OpenAI OAuth.

## TODO

- [ ] Try opencode desktop app
- [ ] opencode config
      [custom formatter for markdown](https://opencode.ai/docs/formatters/#custom-formatters) -
      use deno?!

## Current State

As of 2026-01-14, I removed [oh-my-opencode](./oh-my-opencode/README.md) in
favor of [agentic-cli](./agentic-cli/README.md) - bun global install

## MCP Servers

### [Context7](https://context7.com/)

For Up-to-date docs Content7 is really good so we have added it to the global
`~/.opencode/opencode.jsonc` config. (And also to our current VSCode clone
Antigravity.) While you can use it without an API KEY, it is recommended to use
one for better performance. But there is a question of where to put the secret.
I have decided that my user-global `~/.opencode/opencode.jsonc` is secure enough
for this low value key, which I can rotate any time. IT is also possible to
store the key in an environment variable e.g. `CONTEXT7_API_KEY` but there is no
convenient way to set those on invocation.

### [Tidewave](https://tidewave.ai/)

Seems like this is only meant to be used by the Tidewave IDE/App, and not in
OpenCode or Antigravity.

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
