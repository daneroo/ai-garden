// render — OpenTUI renderer lifecycle

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App.tsx";
import type { ScanState } from "./scan-state.ts";

export interface TuiHandle {
  // Called by ResultsTable on q/esc: destroy renderer and exit 0
  quit: () => void;
  // Called by caller on traversal error: destroy renderer, let error propagate
  destroy: () => void;
}

export async function startTui(scanState: ScanState): Promise<TuiHandle> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
  });

  const handle: TuiHandle = {
    quit: () => {
      renderer.destroy();
      process.exit(0);
    },
    destroy: () => {
      renderer.destroy();
    },
  };

  // Defensive: catch render exceptions and exit cleanly
  process.on("uncaughtException", (err) => {
    renderer.destroy();
    process.stderr.write(`render error: ${err.message}\n${err.stack ?? ""}\n`);
    process.exit(1);
  });

  createRoot(renderer).render(
    <App scanState={scanState} onQuit={handle.quit} />,
  );

  return handle;
}
