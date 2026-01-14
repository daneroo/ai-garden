# Manual E2E Run

## Manifest Generation

### Command

```
bun run src/cli.ts --source tests/fixtures --algo sha256 --json --output thoughts/manifest.jsonl
```

### Stdout

```
```

### Stderr

```
Hashing 1 files...
Scan summary | start=2026-01-14T16:27:58.856Z | end=2026-01-14T16:27:58.862Z | files=1 | bytes=12 | mismatches=0 | missing=0 | extra=0
```

## Verify Mode

### Command

```
bun run src/cli.ts --source tests/fixtures --algo sha256 --verify thoughts/manifest.jsonl
```

### Stdout

```
```

### Stderr

```
Hashing 1 files...
Verifying 1 files...
Verify summary | start=2026-01-14T16:27:58.896Z | end=2026-01-14T16:27:58.902Z | files=1 | bytes=12 | mismatches=0 | missing=0 | extra=0
```
