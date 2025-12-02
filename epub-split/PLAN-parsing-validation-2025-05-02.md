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
  for pp in lingo epubjs; do
      pnpx tsx index.ts -p $pp -r $rr > data/reports/parser-validation-$rr-$pp.md;
      # pnpx tsx index.ts -p $pp -r $rr -v > data/reports/parser-validation-$rr-$pp-v.md;
  done
done
```

## Lingo - Useable or not?

- Can I just replace these files?
- Let wait for spine to decide

| Parser | throw-initEpubFile | empty-manifest | total |
|--------|-------------------:|---------------:|------:|
| space  |                  6 |              9 |   441 |
| drop   |                  9 |             12 |   559 |

## Compare

- [x] compare Manifest
- [ ] compare Spine
- [x] compare TOC

```bash
pnpx tsx index.ts -p compare -r space -v > data/reports/manifest-space-compare.md;
pnpx tsx index.ts -p compare -r drop -v > data/reports/manifest-drop-compare.md;

# pnpx tsx index.ts -p compare -r space > data/reports/manifest-space-compare-toc.md;
# pnpx tsx index.ts -p compare -r space > data/reports/manifest-space-compare-all.md;


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
