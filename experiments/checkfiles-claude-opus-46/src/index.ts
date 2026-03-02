// checkfiles — deterministic filesystem validation CLI/TUI

import { resolveConfig } from "./config.ts";

if (import.meta.main) {
  main();
}

function main(): void {
  const config = resolveConfig();
  console.log(`checkfiles: root path = ${config.rootPath}`);
}
