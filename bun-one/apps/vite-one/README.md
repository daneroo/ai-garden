# React + TypeScript + Vite

These are the components of our stack:

- Bun: Runtime (used in a monorepo / workspaces context)
- React: Component runtime
  - Including shared components
- Vite: Bundler
- Tailwind CSS: Styling
- DaisyUI: Tailwind component classes
- React Router DOM: Routing

## TODO

- [x] add at least a single test
- [x] Make a first stab at AGENTS.md
- [x] Add a second page - Using react-router-dom
- [x] Add DaisyUI
  - [x] Add a single button to prove it works
- [x] Properly theme with DaisyUI
  - [x] Write `STYLING.md` with result of research and best practices
    - [x] Redo research to understand best practices (common layout, dark mode,
          etc)
    - [x] compare with use of DaisyUI in elixir_one
    - [x] Document how current implemntation is inadequate
    - [x] Document how to evolve the current implementation into best practices
    - [x] Include Light Dark Theme
  - [x] Use a Navbar to get to the second page
- [x] Redo Exercise styling on about page, and perhaps Landing page
- [x] Port Logo experiments from elixir_one/logo
- [ ] Cleanup Legacy README below

---

Below is the templated readme from vite

```bash
bun create vite@latest vite-one -- --template react-ts --no-interactive
```

## Legacy README

This template provides a minimal setup to get React working in Vite with HMR and
some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
  uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in
  [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)
  uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev
& build performances. To add it, see
[this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the
configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,
      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install
[eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x)
and
[eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom)
for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
