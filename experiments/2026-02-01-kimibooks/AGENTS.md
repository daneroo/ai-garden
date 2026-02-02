# AGENTS.md - Kimibooks

Experiment: 2026-02-01-kimibooks | Agent: OpenCode | Created: 2026-02-01

Rules:

- Work ONLY in experiments/2026-02-01-kimibooks/
- Run bun run ci after each milestone, fix failures before proceeding
- Add deps with bun add (runtime) or bun add -d (dev), never edit package.json directly
- Runtime: Bun (never Node.js), Language: TypeScript
- CLI: Commander (not Yargs), TUI: OpenTUI (@opentui/core, @opentui/react, react)
- Testing: Vitest, use TypeScript strict mode
- No console.log in production (use stderr for warnings)
- Handle errors gracefully, never crash on individual file failures
- Do NOT commit unless explicitly asked
- Test with Malazan subset (10 books), use --limit N for quick iterations
- Final validation with full 882-book library

Context: Audiobook scanner CLI based on bookfinder.md seed. Scans /Volumes/Space/Reading/audiobooks/, extracts metadata via ffprobe, provides interactive TUI with sorting/scrolling or JSON output.
