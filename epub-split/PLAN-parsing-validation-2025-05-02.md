# Parsing - Validation Centric

## Context

We realize that our approach so far has been ad-hoc. That our progressive parsing with accumulated errors has not been a good approach.

Additionally we have learned much about the two parsers we are using, (epubjs and lingo) and will perhaps finally write our own.

For the moment however we will attempt to unify the approach to validation and comparison around schema validation (using zod).

## Current State

- Gather information about where we are currently performing validation
  - in both parsers, as indicated by the `ParserResult` interface, we gather warnings and errors
- Categorize errors/warnings
  - all errors are from lingo (I think because epubjs, I turn them into warnings)
  - most warnings are 'Warning: No element with id' from lingo
  - all other warnings are about missing images

### Evaluation

```bash
for rr in drop space; do
  for pp in epubjs lingo; do
      pnpx tsx index.ts -p $pp -r $rr > snapshot/parser-validation-$rr-$pp.md;
  done
done
```

This is a categorization of the warnings and errors by parser and verbosity level.

```bash
grep -h ' Warning:' snapshot/* #480 lines
grep -h ' Warning:' snapshot/* |grep 'No element with id' # 417 lines - all from lingo
grep -h ' Warning:' snapshot/* | grep -v 'No element with id' # 9 lines - from both parsers
grep -h ' Error:' snapshot/* # 16 lines - all from lingo
```

## Next Steps

- [ ] Enhance showParserValidation - to exclude all known warning types - that will be our record
  - [ ] add filtering/detection logic for each warning and error type
- [ ] Combine manifest, toc, spine into Book
- [ ] add spine to ParserResult.Book
  - implement in lingo
  - implement in epubjs
