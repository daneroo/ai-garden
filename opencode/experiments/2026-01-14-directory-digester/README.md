# Directory Digester Experiment

## Goal

Build a CLI tool that recursively scans a directory and calculates file digests for integrity verification.

## TODO

- Consider adding `blake3` support as a stretch goal.

## Success Criteria

- CLI computes digests for all files in a directory tree.
- Supports `sha1` and `sha256` with a stretch goal for `blake3`.
- Outputs JSONL entries with `path`, `digest`, `size`, and `mtime`.
- Includes a simple unit test and a manual E2E run log.

## Usage

```
bun run src/cli.ts --help
```

### Help Output

```
Directory Digester

Usage:
  bun run src/cli.ts --source <dir> --algo <sha1|sha256> --json [--output <file>]
  bun run src/cli.ts --source <dir> --algo <sha1|sha256> --verify <manifest.jsonl>

Options:
  --source   Directory to scan
  --algo     Digest algorithm (sha1, sha256)
  --json     Emit JSONL manifest output
  --output   Write manifest to file instead of stdout
  --verify   Verify against manifest JSONL file
  --help     Show this help
```

## Constraints

- Timebox: 1 hour.
- Runtime: Bun.
- Scope: Only modify files within this experiment directory.
