import { program } from "commander";
import { resolve } from "node:path";
import { Scanner } from "./scanner";
import { renderTui } from "./tui";

program
  .option("-r, --rootpath <path>", "Root directory to scan")
  .option("-c, --concurrency <n>", "Max parallel ffprobe processes", "8")
  .option("--json", "Output JSON instead of TUI")
  .parse();

const options = program.opts();
const rootPath = options.rootpath || Bun.env.ROOTPATH;
const concurrency = parseInt(options.concurrency, 10);

if (!rootPath) {
  console.error("Error: --rootpath or ROOTPATH environment variable is required.");
  process.exit(1);
}

const absRootPath = resolve(process.cwd(), rootPath);

async function main() {
  const scanner = new Scanner(absRootPath, concurrency);

  if (options.json) {
    // JSON Mode
    const results = await scanner.scan(() => {
      // Progress ignored in JSON mode
    });
    console.log(JSON.stringify(results, null, 2));
  } else {
    // TUI Mode
    await renderTui(scanner);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
