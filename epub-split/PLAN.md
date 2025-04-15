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
  - [x] added sort to findBookPaths/walk to make it deterministic under deno
- [x] use deno for running TypeScript
  - [x] verify deno works
    - [x] `time deno run -A index.ts -p compare > snapshot/post-ts-migration-compare.md`
    - [x] `time deno run -A index.ts -p epubjs > snapshot/post-ts-migration-epubjs.md`
    - [x] `time deno run -A index.ts -p lingo > snapshot/post-ts-migration-lingo.md`
  - [x] verify digests: `sha1sum snapshot/p*-ts-migration*.md | sort`
- [ ] LATER: move back to pnpx tsx (after resolving browser context issues)

## Step 2: Type Safety and Refactoring

- [ ] Add proper TypeScript types
  - [ ] Define interfaces for book parsing results
  - [ ] Add type definitions for external modules
  - [ ] Add proper return types to functions
- [ ] playwright ts mitigations

## Temporary testing snippets

```bash
time deno run -A index.ts -p compare > snapshot/post-ts-migration-compare.md # 697.771s
time deno run -A index.ts -p epubjs > snapshot/post-ts-migration-epubjs.md # 200.668s
time deno run -A index.ts -p lingo > snapshot/post-ts-migration-lingo.md # 474.263s
# only lingo still works under tsx
time pnpx tsx index.ts -p lingo > snapshot/post-ts-migration-lingo-tsx.md # 107.413s


>  sha1sum snapshot/p*-ts-migration*.md | sort
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/post-ts-migration-lingo-tsx.md
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/post-ts-migration-lingo.md
8f2992db726d47a3a26f9b0126d9bc14ac51ac59  snapshot/pre-ts-migration-lingo.md
e519384c9d85d336865b2956d40c52a939f6849a  snapshot/post-ts-migration-compare.md
e519384c9d85d336865b2956d40c52a939f6849a  snapshot/pre-ts-migration-compare.md
f2762ee222faab8a32d300f6274778aa4b763fe6  snapshot/post-ts-migration-epubjs.md
f2762ee222faab8a32d300f6274778aa4b763fe6  snapshot/pre-ts-migration-epubjs.md
```
