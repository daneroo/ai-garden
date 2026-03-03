// checkfiles — deterministic filesystem validation CLI/TUI

import { resolveConfig } from "./config.ts";
import { checkXattrAvailable } from "./xattr.ts";
import { traverse } from "./traverse.ts";
import { createScanState, makeScanCallback } from "./tui/scan-state.ts";
import { startTui } from "./tui/render.tsx";

if (import.meta.main) {
  await main();
}

async function main(): Promise<void> {
  const config = await resolveConfig();
  await checkXattrAvailable();

  const scanState = createScanState();
  const cb = makeScanCallback(scanState);
  const cleanup = await startTui(scanState);

  try {
    await traverse(config.rootPath, cb);
    scanState.done = true;
    // Brief delay to let the final frame render before cleanup
    await new Promise((resolve) => setTimeout(resolve, 300));
  } finally {
    cleanup();
  }
}
