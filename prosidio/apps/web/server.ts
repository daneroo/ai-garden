/**
 * Unified Server Entry Point
 *
 * This script runs the Fresh server and manages the Tailwind v4 build process.
 *
 * - Behavior:
 *   We chose Standard Fresh (non-Vite) to avoid complexity.
 *   However, this mode lacks a plugin for Tailwind v4 (which requires a build step).
 *   Therefore, this script manually supervises the Tailwind CLI alongside the server.
 *
 * (Conceptually, this acts as a light-weight, "poor man's Vite" to bridge the gap).
 * Note: The input CSS (`tailwind.src.css`) acts as the configuration, explicitly
 * scanning external packages via @source directives.
 */
import { Builder } from "fresh/dev";
import { app } from "./main.tsx";

const TAILWIND_SOURCE = "styles/tailwind.src.css";
const TAILWIND_DEST = "static/tailwind.dist.css";

if (import.meta.main) {
  const watch = Deno.args.includes("--watch");
  await buildTailwind(watch);

  // 2. Start Fresh Server (Native)
  // We utilize the Fresh `Builder` to compile the app manifest and initialize the router.
  // The `listen` method starts the standard Deno HTTP server.
  // This effectively replaces the functionality normally found in `dev.ts` and `prod.ts`.
  const builder = new Builder();
  await builder.listen(() => Promise.resolve(app));
}

/**
 * Builds the Tailwind CSS file, including compilation and tree-shaking from source.
 *
 * NOTE: This manual process is necessary because Fresh 2.0 plugins do not yet
 * natively support Tailwind CSS v4. Until official support is integrated, we
 * must manage the CLI process ourselves to ensure proper compilation and scanning.
 *
 * @param watch - If true, runs in watch mode (daemon), recompiling on changes.
 *                If false, runs a single optimized build for production.
 */
async function buildTailwind(watch: boolean) {
  const args = [
    "run",
    "-A",
    "npm:@tailwindcss/cli",
    "-i",
    TAILWIND_SOURCE,
    "-o",
    TAILWIND_DEST,
    ...(watch ? ["--watch"] : []),
  ];

  const action = watch ? "Watching" : "Building";
  console.log(`${action} Tailwind (app & shared components)...`);

  const process = new Deno.Command(Deno.execPath(), {
    args,
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();

  if (watch) {
    // Watch Mode: Process runs indefinitely.
    // We add a signal listener to ensure that when `deno --watch` restarts the
    // parent process (this script), the child Tailwind process is killed.
    // Without this, the child becomes orphaned and multiple instances fight.
    Deno.addSignalListener("SIGINT", () => {
      try {
        process.kill();
      } catch { /* ignore */ }
      Deno.exit();
    });
  } else {
    // Build Mode: Wait for completion
    const { success } = await process.status;
    if (success) {
      console.log("✓ Tailwind build success");
    } else {
      console.error("✗ Tailwind build failed");
      Deno.exit(1);
    }
  }
}
