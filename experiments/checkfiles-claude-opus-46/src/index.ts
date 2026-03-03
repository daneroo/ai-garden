// checkfiles — deterministic filesystem validation CLI/TUI

import { resolveConfig } from "./config.ts";
import { checkXattrAvailable } from "./xattr.ts";

if (import.meta.main) {
  await main();
}

async function main(): Promise<void> {
  const config = await resolveConfig();
  await checkXattrAvailable();
  console.log(`checkfiles: root path = ${config.rootPath}`);
}
