# Global MCP Configuration

Required on all harnesses: `context7` and `playwright`.

## Quick Prove Prompt

`Use Context7 to fetch the latest TanStack Start server-route docs, then use Playwright MCP to open https://tanstack.com/ and take a screenshot.`

## Codex

```bash
# list
codex mcp list

# add
codex mcp add context7 -- npx -y @upstash/context7-mcp
codex mcp add playwright -- npx -y @playwright/mcp@latest

# list (verify)
codex mcp list

# prove (run as prompts in Codex)
# Use Context7 to fetch latest TanStack Start server route docs.
# Use Playwright MCP to open https://tanstack.com/ and take a screenshot.
```

## Claude Code

```bash
# list
claude mcp list

# add
claude mcp add --scope user --transport stdio context7 -- npx -y @upstash/context7-mcp
claude mcp add --scope user --transport stdio playwright -- npx -y @playwright/mcp@latest

# list (verify)
claude mcp list

# prove (run as prompts in Claude)
# Use Context7 to fetch latest TanStack Start server route docs.
# Use Playwright MCP to open https://tanstack.com/ and take a screenshot.
```

## OpenCode

```bash
# list
opencode mcp list

# add (interactive)
opencode mcp add

# list (verify)
opencode mcp list

# prove (run as prompts in OpenCode)
# Use Context7 to fetch latest TanStack Start server route docs.
# Use Playwright MCP to open https://tanstack.com/ and take a screenshot.
```

Config example (`~/.config/opencode/opencode.json` or `.jsonc`):

```jsonc
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      },
      "enabled": true
    },
    "playwright": {
      "type": "local",
      "command": ["npx", "-y", "@playwright/mcp@latest"],
      "enabled": true
    }
  }
}
```
