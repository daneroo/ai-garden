# bookfinder

Audiobook scanner CLI tool. Recursively scans directories for audio files and
extracts metadata using ffprobe.

## Requirements

### Tech Stack / Runtime

- **Bun** must be used as the runtime (not Node.js)

### CLI Interface

- Use **Commander** (NOT Yargs) for argument parsing
- Flags:
  - `--rootpath <path>` - Root directory to scan (required)
  - `--json` - Output JSON instead of human-readable table

### File Scanning

- Recursively scan for extensions: `.m4b`, `.mp3`
- Parallel processing with concurrency limit of **8**
- Skip hidden files and directories
- Sort output by relative path ascending before printing

### Metadata Extraction

Use `ffprobe` to extract:

- **Duration** (seconds, formatted as HH:MM:SS in table output)
- **Bitrate** (kbps)
- **Codec** (audio codec name)
- **Title** tag (if present)
- **Artist** tag (if present)
- File path (relative to rootpath)
- File size

### Output Formats

**Table (default):**

- Columns: File, Duration, Bitrate, Codec, Title
- Truncate long paths, align columns
- Show summary: total files, total duration

**JSON (`--json` flag):**

- Array of objects with all metadata fields
- Pretty-printed with 2-space indentation
- `--json` prints a single JSON array to stdout (not NDJSON)

### Error Handling

- Skip files where ffprobe fails, log warning to stderr
- Continue processing remaining files
- Exit code 0 on success, 1 on fatal error

### package.json Scripts

```json
{
  "scripts": {
    "lint": "eslint .",
    "check": "tsc --noEmit",
    "test": "vitest run",
    "fmt": "prettier --write .",
    "fmt:check": "prettier --check ."
  }
}
```

### Dependencies

- `commander` - CLI argument parsing
- `ffprobe` (system dependency) - must be installed and in PATH

### Implementation Notes

- Use `Promise.all` with concurrency limiting for parallel ffprobe calls
- Parse ffprobe JSON output (`-print_format json`)
- Handle ffprobe timeout (30s per file)
