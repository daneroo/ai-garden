import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // originally this was:
    // tailwindcss(),
    // To suppress LightningCSS “unknown at rule” warnings
    // for nested @property rules
    // optimize: false - should be removed when this is fixed:
    tailwindcss({ optimize: false }),
  ],
  // Originally: no build section
  // Added in conjunction with the optimize false above
  // to suppress the LightningCSS warnings
  build: {
    cssMinify: true, // keep minification (defaults to esbuild)
    // If you previously set cssMinify: "lightningcss", remove it or force:
    // cssMinify: "esbuild",
  },
});
