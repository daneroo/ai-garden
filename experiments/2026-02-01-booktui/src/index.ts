#!/usr/bin/env bun

import { resolve } from "node:path";
import { stat } from "node:fs/promises";
import { Command } from "commander";
import { scanDirectory } from "./scanner.ts";
import { probeFiles, formatDuration } from "./probe.ts";

const program = new Command();

program
  .name("booktui")
  .description("Audiobook scanner CLI - discover and analyze audiobook files")
  .version("0.1.0")
  .requiredOption("-r, --rootpath <path>", "Root directory to scan")
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

    // Scan for audio files
    console.error(`Scanning ${rootPath} for audiobooks...`);
    const files = await scanDirectory(rootPath);
    console.error(`Found ${files.length} audio file${files.length === 1 ? "" : "s"}`);

    if (files.length === 0) {
      if (options.json) {
        console.log("[]");
      }
      return;
    }

    // Probe metadata
    console.error(`Probing metadata (concurrency: ${concurrency})...`);
    const { results, errors } = await probeFiles(files, concurrency, (done, total, inFlight) => {
      console.error(`  [${done}/${total}] ${inFlight.length > 0 ? inFlight[0] : ""}`);
    });

    for (const err of errors) {
      console.error(`Warning: failed to probe ${err}`);
    }

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      // TUI will be added in Phase 4; for now print a simple table
      for (const r of results) {
        const duration = formatDuration(r.duration);
        const title = r.title ?? "-";
        console.log(`${r.relativePath}  ${duration}  ${r.bitrate}kbps  ${r.codec}  ${title}`);
      }
      console.error(`\n${results.length} files, ${errors.length} errors`);
    }
  });

program.parse();
