import React from "react";
import { createRoot } from "@opentui/react";
import { createCliRenderer } from "@opentui/core";
import { App } from "./components/App.js";
import type { ScanOptions } from "./types.js";

export async function startTui(options: ScanOptions) {
  const renderer = await createCliRenderer({
    useAlternateScreen: true,
    exitOnCtrlC: true,
  });

  await new Promise<void>((resolve) => {
    const root = createRoot(renderer);
    root.render(<App options={options} onExit={resolve} />);
  });

  renderer.destroy();
}
