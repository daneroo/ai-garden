# Converting to Typescript

Context:

- I want NO tsconfig file
- I want minimal changes to package.json

## Step 1

- [x] create a branch ts
- [x] prior validation
  - [x] should have no errors
    - [x] `time node index.mjs -p compare > snapshot/pre-ts-migration-compare.md`
    - [x] `time node index.mjs -p epubjs > snapshot/pre-ts-migration-epubjs.md`
    - [x] `time node index.mjs -p lingo > snapshot/pre-ts-migration-lingo.md`
- [x] convert all file to type script, by just (git mv) renaming files to .ts
  - [x] modify index.ts top level await to IIFE
  - [x] adjust imports
  - [x] added sort to findBookPaths to make it deterministic under deno
- [x] use deno for running TypeScript
  - [x] verify deno works
    - [x] `time deno run -A index.ts -p compare > snapshot/post-ts-migration-compare.md`
    - [x] `time deno run -A index.ts -p epubjs > snapshot/post-ts-migration-epubjs.md`
    - [x] `time deno run -A index.ts -p lingo > snapshot/post-ts-migration-lingo.md`
  - [x] verify digests: `sha1sum snapshot/p*-ts-migration*.md | sort`
- replace browser evaluate with external js file
- [x] LATER: move back to pnpx tsx (after resolving browser context issues)

## Step 2: Type Safety and Refactoring

- [x] Add basic type definitions
  - [x] `pnpm add -D @types/node @types/yargs`
- [ ] Add proper TypeScript types
  - [x] index.ts
  - [x] lib/types.ts
  - [x] lib/showToc.ts
  - [x] lib/epub-parser-lingo.ts
  - [x] lib/epubjs-playwright.ts
    - [x] separate lib/epubjs-browser.js
- [x] Re-implement `@root/walk` in typescript : digests match
- [x] Replace walk with `fast-glob`: digests match
- [ ] playwright ts mitigations
  - [x] replace size test with buffer.byteLength > 75MiB (not b64len>100MiB)
  - [x] replace page.goto('about:blank') with page.setContent w/ 3 scripts
    - [x] move on page.on(console) after setContent
  - [x] replace base64 with ArrayBuffer/setInputFiles
    - [x] rename parseEpubFromInputFiles
    - [x] parallel checksum with uploadWithBase64Buffer and uploadWithSetInputFiles
    - [x] parseEpubFromInputFiles called with implicit ArrayBuffer reference

## TODO

```bash
pnpx tsx playwrightMaxSize.ts | gum format
deno run -A playwrightMaxSize.ts | gum format
```

## Temporary testing snippets

digest invariants:

```bash
time deno run -A index.ts -p compare > snapshot/post-ts-migration-compare.md # 697.771s .. 669.124s
time deno run -A index.ts -p lingo > snapshot/post-ts-migration-lingo.md # 474.263s
time deno run -A index.ts -p epubjs > snapshot/post-ts-migration-epubjs.md # 200.668s .. 165.635s
# everything now works with tsx
time pnpx tsx index.ts -p compare > snapshot/post-ts-migration-compare-tsx.md # 278.498s .. 231.761s
time pnpx tsx index.ts -p lingo > snapshot/post-ts-migration-lingo-tsx.md # 99.617s
time pnpx tsx index.ts -p epubjs > snapshot/post-ts-migration-epubjs-tsx.md # 189.700s .. 126.255s


> sha1sum snapshot/p*-ts-migration*.md | sort
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/post-ts-migration-lingo-tsx.md
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/post-ts-migration-lingo.md
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/pre-ts-migration-lingo.md
e519384c9d85d336865b2956d40c52a939f6849a  snapshot/post-ts-migration-compare-tsx.md
e519384c9d85d336865b2956d40c52a939f6849a  snapshot/post-ts-migration-compare.md
e519384c9d85d336865b2956d40c52a939f6849a  snapshot/pre-ts-migration-compare.md
f2762ee222faab8a32d300f6274778aa4b763fe6  snapshot/post-ts-migration-epubjs-tsx.md
f2762ee222faab8a32d300f6274778aa4b763fe6  snapshot/post-ts-migration-epubjs.md
f2762ee222faab8a32d300f6274778aa4b763fe6  snapshot/pre-ts-migration-epubjs.mds

# After I removed the size restriction for base64 encoding
#  pre is unchanged, of course, lingi is also unchanged
> sha1sum snapshot/pre*-ts-migration*.md | sort
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/pre-ts-migration-lingo.md
e519384c9d85d336865b2956d40c52a939f6849a  snapshot/pre-ts-migration-compare.md
f2762ee222faab8a32d300f6274778aa4b763fe6  snapshot/pre-ts-migration-epubjs.md

> sha1sum snapshot/post*-ts-migration*.md | sort
3a706cf62485f751c0fe04c328e6c64985a5244f  snapshot/post-ts-migration-epubjs-tsx.md
3a706cf62485f751c0fe04c328e6c64985a5244f  snapshot/post-ts-migration-epubjs.md
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/post-ts-migration-lingo-tsx.md
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/post-ts-migration-lingo.md
ad7ebb6050d9c2817e3f52b0fa61a6e9a84825b9  snapshot/post-ts-migration-compare-tsx.md
ad7ebb6050d9c2817e3f52b0fa61a6e9a84825b9  snapshot/post-ts-migration-compare.md
```
