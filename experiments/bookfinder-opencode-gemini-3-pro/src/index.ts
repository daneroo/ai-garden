#!/usr/bin/env bun
import { Command } from "commander";
import { resolve } from "node:path";
import { scanDirectory } from "./scanner.js";
import { probeFile } from "./prober.js";
import { runWorkerPool } from "./worker-pool.js";
import type { ScanOptions } from "./types.js";

const program = new Command();

program
  .name("gemibooks")
  .description("Audiobook scanner and metadata extractor")
  .version("0.1.0")
  .option(
    "-r, --rootpath <path>",
    "Root directory to scan",
    process.env.ROOTPATH,
  )
  .option("-c, --concurrency <n>", "Max parallel processes", "8")
  .option("--json", "Output JSON instead of TUI")
  .action(async (options) => {
    if (!options.rootpath) {
      console.error("Error: --rootpath is required (or set ROOTPATH in .env)");
      process.exit(1);
    }

    const opts: ScanOptions = {
      rootPath: resolve(options.rootpath),
      concurrency: parseInt(options.concurrency, 10),
      json: !!options.json,
    };

    if (opts.json) {
      await runJsonMode(opts);
    } else {
      await import("./tui.js").then(({ startTui }) => startTui(opts));
    }
  });

async function runJsonMode(opts: ScanOptions) {
  try {
    // 1. Scan
    if (!opts.json) console.error(`Scanning ${opts.rootPath}...`);
    const files = await scanDirectory(opts.rootPath);

    if (files.length === 0) {
      if (opts.json) console.log("[]");
      else console.error("No audio files found.");
      return;
    }

    // 2. Probe
    if (!opts.json)
      console.error(
        `Probing ${files.length} files with concurrency ${opts.concurrency}...`,
      );

    const results = await runWorkerPool(
      files,
      opts.concurrency,
      probeFile,
      (completed, total) => {
        if (!opts.json) {
          process.stderr.write(`\rProgress: ${completed}/${total}`);
        }
      },
    );

    if (!opts.json) process.stderr.write("\n");

    // 3. Output
    const validResults = [];
    for (const result of results) {
      if (result.error) {
        console.error(`Error probing ${result.path}: ${result.error}`);
      }

      if (!result.error) {
        validResults.push(result);
      }
    }

    console.log(JSON.stringify(validResults, null, 2));
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Fatal error:", errorMessage);
    process.exit(1);
  }
}

program.parse();
