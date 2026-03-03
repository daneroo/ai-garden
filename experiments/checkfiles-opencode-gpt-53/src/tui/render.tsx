import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import type { ScanState } from "./scan-state.ts";
import { App } from "./App.tsx";

export interface TuiHandle {
  quit: () => never;
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

  createRoot(renderer).render(
    <App scanState={scanState} onQuit={handle.quit} />,
  );
  return handle;
}
