import { resolveConfig } from "./config.ts";
import { scan } from "./scan.ts";
import { checkXattrAvailable } from "./xattr.ts";

if (import.meta.main) {
  await main().catch(handleFatalError);
}

async function main(): Promise<void> {
  const config = await resolveConfig();
  await checkXattrAvailable();
  await scan(config.rootPath);
}

function handleFatalError(err: unknown): never {
  const message =
    err instanceof Error ? `${err.message}\n` : `${String(err)}\n`;
  process.stderr.write(`Fatal: ${message}`);
  process.exit(1);
}
