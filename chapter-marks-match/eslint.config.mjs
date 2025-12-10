import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Ignore build/output directories
  {
    ignores: ["dist", "out", "node_modules", "coverage"]
  },

  // Base configurations
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  
  // Recommended rules (JS + TS)
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  // Custom rules
  {
    rules: {
      // Add custom rules here if needed.
      // We explicitly leave formatting (indentation, etc.) to the IDE.
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }]
    }
  }
];
