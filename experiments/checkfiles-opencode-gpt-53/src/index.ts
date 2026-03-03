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

  try {
    await scan(config.rootPath, {
      onTraverseEvent: (event, node) => {
        applyTraverseEvent(scanState, event, node);
      },
    });
    scanState.done = true;
    tui.destroy();
  } catch (err) {
    tui.destroy();
    throw err;
  }
}

function handleFatalError(err: unknown): never {
  const message =
    err instanceof Error ? `${err.message}\n` : `${String(err)}\n`;
  process.stderr.write(`Fatal: ${message}`);
  process.exit(1);
}
