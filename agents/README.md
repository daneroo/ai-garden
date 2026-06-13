# Agent workspaces and loops

I consolidating and researching my agentic development workflow. I currently
use:

- engine: Antigravity, opencode, claude-code, codex, kilo-code
- subscriptions: Claude Pro, ChatGPTPlus, Google AI Pro, OPenCode Zen,
  openclaw(clawdbot)
- top models: across different subs: opus-4.5 (Claude Pro,Antigravity), Kimi
  K2.5, openai/gpt-5.2-[codex], and their lesser brethren
- agentic harnesses I have tried:
  - [agentic-cli](https://github.com/Cluster444/agentic) over opencode
  - [oh-my-opencode/sysiphus](https://github.com/code-yeongyu/oh-my-opencode)
    over opencode

## Global MCP Baseline

Shared MCP setup for OpenCode, Codex, and Claude Code is documented in
[`./MCP.md`](./MCP.md).

Use that doc for:

- listing configured MCP servers
- adding `context7` and `playwright`
- running smoke tests before web UI work

Specific info for each agent

- [ ] [T3 codes](https://t3.codes/) - `npx t3` works too!
- [ ] [maruel/cais-xyz/md](https://github.com/caic-xyz/md)
- [ ] [Crush](https://github.com/charmbracelet/crush)
- [ ] [Pi Monorepo](https://github.com/badlogic/pi-mono) - [Pi](https://pi.dev/)
- [ ] [Open Agent/Sandboxed](https://sandboxed.sh/) - Sam author as v
  - [ ] [Ralph Wiggum Loop](https://github.com/Th0rgal/open-ralph-wiggum)
- [x] [Kilo](./kilo/README.md): Not so much - deleted
- [x] [Hermes](./hermes/README.md) - NousResearch
- [ ] Amp - installed and delete from Antigravity - Later
- [x] [OpenClaw](./openclaw/README.md) - deprecated
- [OpenCode](./opencode/README.md)
- [ ] [Codex](./codex/README.md)
- [x] [Claude](./claude/README.md) - deprecated

## TODO

- [ ] migrate from openclaw to hermes
- [ ] create `claude/` and `codex/`

## References

- <https://www.aihero.dev/tips-for-ai-coding-with-ralph-wiggum>
- <https://docs.docker.com/ai/sandboxes/>
- <https://github.com/maruel/md>
