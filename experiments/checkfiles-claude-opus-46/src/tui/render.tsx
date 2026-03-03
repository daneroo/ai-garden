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

  createRoot(renderer).render(<App scanState={scanState} />);

  return () => renderer.destroy();
}
