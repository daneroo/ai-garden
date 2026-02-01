#!/usr/bin/env bun

import { Command } from "commander";

const program = new Command();

program
  .name("booktui")
  .description("Audiobook scanner CLI - discover and analyze audiobook files")
  .version("0.1.0")
  .requiredOption("--rootpath <path>", "Root directory to scan")
  .option("-c, --concurrency <n>", "Max parallel ffprobe processes", "8")
  .option("--json", "Output JSON instead of interactive TUI")
  .action((options: { rootpath: string; concurrency: string; json?: boolean }) => {
    const concurrency = parseInt(options.concurrency, 10);
    if (isNaN(concurrency) || concurrency < 1) {
      console.error("Error: concurrency must be a positive integer");
      process.exit(1);
    }

    console.log(`Scanning: ${options.rootpath}`);
    console.log(`Concurrency: ${concurrency}`);
    console.log(`Output: ${options.json ? "JSON" : "TUI"}`);
  });

program.parse();
