# Parsing - Validation Centric

## Context

We realize that our approach so far has been ad-hoc. That our progressive parsing with accumulated errors has not been a good approach.

Additionally we have learned much about the two parsers we are using, (epubjs and lingo) and will perhaps finally write our own.

For the moment however we will attempt to unify the approach to validation and comparison around schema validation (using zod).

## Current State

- Gather information about where we are currently performing validation
  - in both parsers, as indicated by the `ParserResult` interface, we gather warnings and errors

### Evaluation

```bash
for rr in drop space; do
  for pp in epubjs lingo; do
      pnpx tsx index.ts -p $pp -r $rr > snapshot/parser-validation-$rr-$pp.md;
  done
done
```
