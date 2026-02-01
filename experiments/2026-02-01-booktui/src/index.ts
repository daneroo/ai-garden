#!/usr/bin/env bun

import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { Command } from "commander";
import { scanDirectory } from "./scanner.ts";

const program = new Command();

program
  .name("booktui")
  .description("Audiobook scanner CLI - discover and analyze audiobook files")
  .version("0.1.0")
  .requiredOption("--rootpath <path>", "Root directory to scan")
  .option("-c, --concurrency <n>", "Max parallel ffprobe processes", "8")
  .option("--json", "Output JSON instead of interactive TUI")
  .action(async (options: { rootpath: string; concurrency: string; json?: boolean }) => {
    const concurrency = parseInt(options.concurrency, 10);
    if (isNaN(concurrency) || concurrency < 1) {
      console.error("Error: concurrency must be a positive integer");
      process.exit(1);
    }

    const rootPath = resolve(options.rootpath);

    try {
      const info = await stat(rootPath);
      if (!info.isDirectory()) {
        console.error(`Error: ${rootPath} is not a directory`);
        process.exit(1);
      }
    } catch {
      console.error(`Error: ${rootPath} does not exist or is not accessible`);
      process.exit(1);
    }

    console.error(`Scanning ${rootPath} for audiobooks...`);
    const files = await scanDirectory(rootPath);
    console.error(`Found ${files.length} audio file${files.length === 1 ? "" : "s"}`);

    if (options.json) {
      console.log(JSON.stringify(files, null, 2));
    } else {
      // TUI will be added in Phase 4; for now print a simple table
      for (const f of files) {
        console.log(`${f.relativePath}  (${formatSize(f.size)})`);
      }
    }
  });

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

program.parse();
