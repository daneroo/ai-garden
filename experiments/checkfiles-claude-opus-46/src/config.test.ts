import { test, expect, afterEach } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveConfig } from "./config.ts";

const DATA_DIR = resolve(import.meta.dirname!, "../data/config-test");

async function setup() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

afterEach(teardown);

// Helper: run resolveConfig with overridden argv and env
async function configWith(
  args: string[],
  env?: Record<string, string>,
): Promise<{ rootPath: string }> {
  const origArgv = process.argv;
  const origEnv: Record<string, string | undefined> = {};

  // Commander expects: [node, script, ...userArgs]
  process.argv = ["node", "checkfiles", ...args];

  if (env) {
    for (const [k, v] of Object.entries(env)) {
      origEnv[k] = process.env[k];
      process.env[k] = v;
    }
  }

  try {
    return await resolveConfig();
  } finally {
    process.argv = origArgv;
    for (const k of Object.keys(origEnv)) {
      if (origEnv[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = origEnv[k];
      }
    }
  }
}

test("config: resolves rootpath from --rootpath flag", async () => {
  await setup();
  const config = await configWith(["--rootpath", DATA_DIR]);
  expect(config.rootPath).toBe(DATA_DIR);
});

test("config: resolves rootpath from -r alias", async () => {
  await setup();
  const config = await configWith(["-r", DATA_DIR]);
  expect(config.rootPath).toBe(DATA_DIR);
});

test("config: flag takes precedence over env", async () => {
  await setup();
  const config = await configWith(["--rootpath", DATA_DIR], {
    ROOT_PATH: "/some/other/path",
  });
  expect(config.rootPath).toBe(DATA_DIR);
});

test("config: resolves rootpath from ROOT_PATH env", async () => {
  await setup();
  const config = await configWith([], { ROOT_PATH: DATA_DIR });
  expect(config.rootPath).toBe(DATA_DIR);
});
