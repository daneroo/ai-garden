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
  const tui = await startTui(scanState);

  try {
    await traverse(config.rootPath, cb);
    scanState.done = true;
    // TUI stays alive — ResultsTable handles exit via q/esc
  } catch (err) {
    tui.destroy(); // restore terminal before error propagates
    throw err;
  }
}
