// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [mdx()],
  // Fix Vite fs.allow for monorepo - dev toolbar is in workspace root node_modules
  vite: {
    server: {
      fs: {
        allow: ["../.."], // Allow access to deno-one root
      },
    },
  },
});
