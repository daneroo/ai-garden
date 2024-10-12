# Deno 2 typescript project

## TODO

- [ ] Workspaces to share common code
- [ ] dependency management - update/upgrade/outdated

## Setup

```bash
mkdir deno-one
cd deno-one
deno init --name deno-one --template typescript
```

## Dependencies

pure deno way with `deno add [--dev]`

## VSCode Extensions

- Deno (denoland.vscode-deno)

Not sure how to handle default formatter yet. For JSON, .ts .json, .jsonc,...

- Prettier
- Deno
- JavaScript and Typescript Language featres (default)

## Tasks

List all available tasks:

```bash
deno task
```

### Testing

We include testing example is JSDoc and markdown files

```bash
deno task test
```

### Markdown test example

```ts
import { assertEquals } from "jsr:@std/assert/equals";
import { add } from "./main.ts";

const sum = add(1, 2);
assertEquals(sum, 3);
```
