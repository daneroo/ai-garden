import { resolveConfig } from "./config.ts";

if (import.meta.main) {
  await main();
}

async function main(): Promise<void> {
  await resolveConfig();
}
