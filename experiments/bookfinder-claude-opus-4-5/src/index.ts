#!/usr/bin/env bun

import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { Command } from "commander";
import { scanDirectory } from "./scanner.ts";
import { probeFiles } from "./probe.ts";
import { renderTui } from "./tui/render.tsx";

const program = new Command();

program
  .name("booktui")
  .description("Audiobook scanner CLI - discover and analyze audiobook files")
  .version("0.1.0")
  .option("-r, --rootpath <path>", "Root directory to scan", process.env.BOOKTUI_ROOTPATH)
  .option("-c, --concurrency <n>", "Max parallel ffprobe processes", "8")
  .option("--json", "Output JSON instead of interactive TUI")
  .action(async (options: { rootpath?: string; concurrency: string; json?: boolean }) => {
    if (!options.rootpath) {
      console.error("Error: --rootpath is required (or set BOOKTUI_ROOTPATH in .env)");
      process.exit(1);
    }

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

    if (options.json) {
      // JSON mode: bypass TUI, output to stdout, warnings to stderr
      console.error(`Scanning ${rootPath} for audiobooks...`);
      const files = await scanDirectory(rootPath);
      console.error(`Found ${files.length} audio file${files.length === 1 ? "" : "s"}`);

      if (files.length === 0) {
        console.log("[]");
        return;
      }

      console.error(`Probing metadata (concurrency: ${concurrency})...`);
      const { results, errors } = await probeFiles(files, concurrency, (done, total) => {
        console.error(`  [${done}/${total}]`);
      });

      for (const err of errors) {
        console.error(`Warning: failed to probe ${err}`);
      }

      console.log(JSON.stringify(results, null, 2));
    } else {
      // Interactive TUI mode
      await renderTui(rootPath, concurrency);
    }
  });

program.parse();
