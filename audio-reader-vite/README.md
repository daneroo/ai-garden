# audio-reader-vite

## TODO

- [x] cleanup starting template
- [ ] add minimal lint and test
- [ ] consolidate other experiments
  - [ ] book-reader (simple static html epubjs reader with ?url=/audiobooks/..)
  - [ ] audio-reader-html
    - [ ] index.html -> picker and bad matcher
    - [ ] audio.html simple cue vtt display (road not taken)
  - [ ] audio-deno-match (deno cli matcher)
- [ ] refactor useAdjustedVH and useUrlBarHeight - separate use cases
- [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/quick-start) for second page

## Usage

```bash
pnpm dev
```

## Setup

```bash
 ❯ pnpm create vite
✔ Project name: … audio-reader-vite
✔ Select a framework: › React
✔ Select a variant: › TypeScript + SWC
```

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json", "./tsconfig.node.json"],
    tsconfigRootDir: __dirname,
  },
};
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
