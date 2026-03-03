// config — CLI flag parsing and root path resolution/validation

import { Command } from "commander";
import { stat } from "node:fs/promises";

export interface Config {
  rootPath: string;
}

// ENTRY: called from main
export async function resolveConfig(): Promise<Config> {
  const program = new Command()
    .name("checkfiles")
    .description("Deterministic filesystem validation CLI/TUI")
    .option("-r, --rootpath <path>", "root directory to inspect");

  program.parse(process.argv);
  const opts = program.opts<{ rootpath?: string }>();

  const rootPath = resolveRootPath(opts.rootpath);
  await validateRootPath(rootPath);
  return { rootPath };
}

function resolveRootPath(fromFlag: string | undefined): string {
  // Flag takes precedence over environment
  if (fromFlag) return fromFlag;

  const fromEnv = process.env["ROOT_PATH"];
  if (fromEnv) return fromEnv;

  console.error("Fatal: no root path. Use --rootpath or set ROOT_PATH in .env");
  process.exit(1);
}

async function validateRootPath(path: string): Promise<void> {
  let info;
  try {
    info = await stat(path);
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      console.error(`Fatal: root path does not exist: ${path}`);
      process.exit(1);
    }
    if (code === "EACCES") {
      console.error(`Fatal: root path not readable: ${path}`);
      process.exit(1);
    }
    throw err;
  }

  if (!info.isDirectory()) {
    console.error(`Fatal: root path is not a directory: ${path}`);
    process.exit(1);
  }
}
