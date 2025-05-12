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

pnpx tsx index.ts -p lingo -r space > snapshot/parser-validation-space-lingo.md;
pnpx tsx index.ts -p lingo -r drop > snapshot/parser-validation-drop-lingo.md;

```

## Compare

- [ ] compare Manifest
- [ ] compare Spine
- [x] compare TOC

```bash
pnpx tsx index.ts -p lingo -r space > snapshot/manifest-space-lingo.md;
pnpx tsx index.ts -p epubjs -r space > snapshot/manifest-space-epubjs.md;

pnpx tsx index.ts -p lingo -r drop > snapshot/manifest-drop-lingo.md;
pnpx tsx index.ts -p epubjs -r drop > snapshot/manifest-drop-epubjs.md;


pnpx tsx index.ts -p compare -r space -v > snapshot/manifest-space-compare-manifest.md;
pnpx tsx index.ts -p compare -r drop -v > snapshot/manifest-drop-compare-manifest.md;

pnpx tsx index.ts -p compare -r space > snapshot/manifest-space-compare-toc.md;
pnpx tsx index.ts -p compare -r space > snapshot/manifest-space-compare-all.md;


```

## Next Steps

- [ ] Enhance showParserValidation - to exclude all known warning types - that will be our record
  - [x] add filtering/detection logic for each warning and error type
    - [x] metadata.missing.id (lingo)
  - [x] refine the parser handling error/warning accumulation - fallthrough/exception test
    - [ ] remove lingo console.warn capture
- [ ] Combine manifest, toc, spine into Book
- [ ] add spine to ParserResult.Book
  - implement in lingo
  - implement in epubjs
