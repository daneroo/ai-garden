import { resolveConfig } from "./config.ts";
import { scan } from "./scan.ts";
import { applyTraverseEvent, createScanState } from "./tui/scan-state.ts";
import { startTui } from "./tui/render.tsx";
import { checkXattrAvailable } from "./xattr.ts";

if (import.meta.main) {
  await main().catch(handleFatalError);
}

async function main(): Promise<void> {
  const config = await resolveConfig();
  await checkXattrAvailable();

  const scanState = createScanState();
  const tui = await startTui(scanState);
  let completed = false;

  try {
    const records = await scan(config.rootPath, {
      onTraverseEvent: (event, node) => {
        applyTraverseEvent(scanState, event, node);
      },
    });
    scanState.results = records;
    scanState.done = true;
    completed = true;
  } finally {
    if (!completed) {
      tui.destroy();
    }
  }
}

function handleFatalError(err: unknown): never {
  const message =
    err instanceof Error ? `${err.message}\n` : `${String(err)}\n`;
  process.stderr.write(`Fatal: ${message}`);
  process.exit(1);
}
