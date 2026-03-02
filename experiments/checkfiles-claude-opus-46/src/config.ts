// config — CLI flag parsing and root path resolution/validation

import { Command } from "commander";

export interface Config {
  rootPath: string;
}

// ENTRY: called from main
export async function resolveConfig(): Promise<Config> {
  const program = new Command()
    .name("checkfiles")
    .description("Deterministic filesystem validation CLI/TUI")
    .option("-r, --rootpath <path>", "root directory to inspect");

  program.parse(Deno.args, { from: "user" });
  const opts = program.opts<{ rootpath?: string }>();

  const rootPath = resolveRootPath(opts.rootpath);
  await validateRootPath(rootPath);
  return { rootPath };
}

function resolveRootPath(fromFlag: string | undefined): string {
  // Flag takes precedence over environment
  if (fromFlag) return fromFlag;

  const fromEnv = Deno.env.get("ROOT_PATH");
  if (fromEnv) return fromEnv;

  console.error("Fatal: no root path. Use --rootpath or set ROOT_PATH in .env");
  Deno.exit(1);
}

async function validateRootPath(path: string): Promise<void> {
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(path);
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      console.error(`Fatal: root path does not exist: ${path}`);
      Deno.exit(1);
    }
    if (err instanceof Deno.errors.PermissionDenied) {
      console.error(`Fatal: root path not readable: ${path}`);
      Deno.exit(1);
    }
    throw err;
  }

  if (!stat.isDirectory) {
    console.error(`Fatal: root path is not a directory: ${path}`);
    Deno.exit(1);
  }
}
