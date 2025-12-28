# AI Agent Rules: whisper-bench

## Tech Stack

- Runtime: Deno (v2.x)
- Language: TypeScript (Node-prefix imports required)
- Tooling:
  - the agent should always: `deno fmt && deno task ci`
  - Look at tasks in @deno.json for other tooling commands

## Project Architecture

- Core Logic: Located in lib/
- Main Entry: main.ts
- Output: Summary to STDOUT, detailed progress to STDERR
- Directories Volatile and temporary - git ignored:
  - data/samples/: Source audio files
  - data/work/: Per-run logs and intermediate artifacts
  - data/output/: Final production results (VTT)

## Agent Directives

- Progress Reporting:
  - Always use lib/progress.ts
  - All progress and task-specific logs belong on STDERR
  - Use a single updating line with \r
  - Only the final report persists with a newline

- Process and File Management:
  - Spawn: Use node:child_process via spawn
  - Paths: Always use absolute paths for tool arguments
  - Cleanup: Ensure temporary work files in data/work/ are organized by
    timestamped directories

- Execution Standard:
  - Prioritize deno task commands defined in deno.json
  - ALWAYS run 'deno fmt' before 'deno task ci' when validating code
  - Run deno fmt and deno lint after modifying code
  - Prefer Deno standards over Bun, npm, or pnpm
