// render — OpenTUI renderer lifecycle

import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App.tsx";
import type { ScanState } from "./scan-state.ts";

export async function startTui(scanState: ScanState): Promise<() => void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
  });

  const cleanup = () => {
    renderer.destroy();
    process.exit(0);
  };

  // Defensive: catch render exceptions and exit cleanly
  process.on("uncaughtException", (err) => {
    renderer.destroy();
    process.stderr.write(`render error: ${err.message}\n${err.stack ?? ""}\n`);
    process.exit(1);
  });

  createRoot(renderer).render(<App scanState={scanState} onQuit={cleanup} />);

  return cleanup;
}
