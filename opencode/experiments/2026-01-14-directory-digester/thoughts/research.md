# Research Notes

## Summary

- No existing CLI or hashing implementation found in the local repo.
- Bun provides `Bun.CryptoHasher` for `sha1`/`sha256` with incremental updates and hex output.
- CLI argument parsing can use `util.parseArgs` with `Bun.argv`.

## External Docs

- `Bun.CryptoHasher` supports `sha1` and `sha256`, accepts `string`/`TypedArray`/`ArrayBuffer`, and returns hex via `digest("hex")`.
- Bun also exposes `createHash` from `node:crypto` for compatibility.
- `util.parseArgs` is recommended for CLI flags with `Bun.argv` input.

## Source Links

- https://bun.com/docs/runtime/hashing.md
- https://bun.com/docs/guides/process/argv.md

## Local Context

- Ticket requirements: `experiments/2026-01-14-directory-digester/thoughts/tickets/feature_directory_digester.md`.
- Experiment constraints: Bun runtime, 1 hour timebox, simple unit test, manual E2E log.

## Open Questions

- Whether to use `Bun.CryptoHasher` or `node:crypto` for hashing implementation.
- Confirm if `blake3` should be implemented via dependency or skipped as stretch goal.
