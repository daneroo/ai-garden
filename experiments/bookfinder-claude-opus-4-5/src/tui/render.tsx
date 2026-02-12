import React from "react";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./App.tsx";

export async function renderTui(rootPath: string, concurrency: number): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    useAlternateScreen: true,
  });

  return new Promise<void>((resolve) => {
    const root = createRoot(renderer);
    root.render(
      <App
        rootPath={rootPath}
        concurrency={concurrency}
        onExit={() => {
          renderer.destroy();
          resolve();
        }}
      />,
    );
  });
}
