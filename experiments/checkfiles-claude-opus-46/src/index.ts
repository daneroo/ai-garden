// checkfiles — deterministic filesystem validation CLI/TUI

import { resolveConfig } from "./config.ts";

if (import.meta.main) {
  await main();
}

async function main(): Promise<void> {
  const config = await resolveConfig();
  console.log(`checkfiles: root path = ${config.rootPath}`);
}
