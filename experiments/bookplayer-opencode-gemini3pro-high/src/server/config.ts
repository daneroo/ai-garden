import fs from "node:fs";
import path from "node:path";

// Load config from process.env
// The runtime expects environment variables to be set, potentially via .env loading by Nitro/Vite.
// In dev, .env is loaded. In prod, env vars must be set.

// Helper to expand ~ to HOME if needed (simple case)
function resolvePath(p: string) {
  if (p.startsWith("~/")) {
    return path.join(process.env.HOME || "", p.slice(2));
  }
  return path.resolve(p);
}

console.log("Loading Config. AUDIOBOOKS_ROOT:", process.env.AUDIOBOOKS_ROOT);

export const config = {
  AUDIOBOOKS_ROOT: resolvePath(process.env.AUDIOBOOKS_ROOT || ""),
  VTT_DIR: resolvePath(process.env.VTT_DIR || ""),
};

export function validateConfig() {
  const errors: string[] = [];

  if (!config.AUDIOBOOKS_ROOT) {
    errors.push("AUDIOBOOKS_ROOT is not set");
  } else {
    try {
      const stats = fs.statSync(config.AUDIOBOOKS_ROOT);
      if (!stats.isDirectory()) {
        errors.push(
          `AUDIOBOOKS_ROOT is not a directory: ${config.AUDIOBOOKS_ROOT}`,
        );
      }
    } catch (e) {
      errors.push(
        `AUDIOBOOKS_ROOT does not exist or is not readable: ${config.AUDIOBOOKS_ROOT}`,
      );
    }
  }

  if (!config.VTT_DIR) {
    errors.push("VTT_DIR is not set");
  } else {
    try {
      const stats = fs.statSync(config.VTT_DIR);
      if (!stats.isDirectory()) {
        errors.push(`VTT_DIR is not a directory: ${config.VTT_DIR}`);
      }
    } catch (e) {
      // VTT_DIR is optional for strict crash, but the seed says "Fail fast".
      // Let's treat it as a required config for now as per seed.
      errors.push(
        `VTT_DIR does not exist or is not readable: ${config.VTT_DIR}`,
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Configuration Error:\n${errors.join("\n")}`);
  }

  return config;
}
