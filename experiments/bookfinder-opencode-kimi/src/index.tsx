#!/usr/bin/env bun

import { Command } from "commander";
import { config } from "dotenv";
import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { scanForAudioFiles } from "./scanner.js";
import { extractAllMetadata } from "./worker-pool.js";
import { TuiApp } from "./components/TuiApp.js";

config();

interface CliOptions {
  rootpath?: string;
  concurrency: string;
  json: boolean;
  limit?: string;
}

const program = new Command();

program
  .name("kimibooks")
  .description("Audiobook scanner CLI - extracts metadata from audio files")
  .version("0.1.0")
  .option("-r, --rootpath <path>", "Root directory to scan (or set ROOT_PATH in .env)")
  .option("-c, --concurrency <n>", "Max parallel ffprobe processes", "8")
  .option("--json", "Output JSON instead of TUI", false)
  .option("--limit <n>", "Limit to N files (for dev testing)")
  .parse();

const options = program.opts<CliOptions>();

const rootPath = options.rootpath || process.env.ROOT_PATH;

if (!rootPath) {
  console.error("Error: Root path required. Use --rootpath or set ROOT_PATH in .env");
  process.exit(1);
}

const resolvedPath = resolve(rootPath);

if (!existsSync(resolvedPath)) {
  console.error(`Error: Path does not exist: ${resolvedPath}`);
  process.exit(1);
}

if (!statSync(resolvedPath).isDirectory()) {
  console.error(`Error: Not a directory: ${resolvedPath}`);
  process.exit(1);
}

const concurrency = parseInt(options.concurrency, 10);
if (isNaN(concurrency) || concurrency < 1) {
  console.error("Error: Concurrency must be a positive number");
  process.exit(1);
}

const limit = options.limit ? parseInt(options.limit, 10) : undefined;
if (limit !== undefined && (isNaN(limit) || limit < 1)) {
  console.error("Error: Limit must be a positive number");
  process.exit(1);
}

const files = scanForAudioFiles(resolvedPath, limit);

if (files.length === 0) {
  console.log("No audio files found.");
  process.exit(0);
}

if (options.json) {
  // JSON mode: bypass TUI
  const metadata = await extractAllMetadata(files, concurrency);
  console.log(JSON.stringify(metadata, null, 2));
  process.exit(0);
}

// TUI mode - wrap in Promise for clean async/await handling
const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  useAlternateScreen: true,
});

await new Promise<void>((resolve) => {
  const root = createRoot(renderer);
  root.render(
    <TuiApp
      initialFiles={files}
      concurrency={concurrency}
      onExit={() => {
        renderer.destroy();
        resolve();
      }}
    />
  );
});
