import { afterEach, expect, test } from "vitest";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { resolveConfig } from "./config.ts";

const DATA_DIR = resolve(import.meta.dirname!, "../data/config-test");

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

async function setup() {
  await mkdir(DATA_DIR, { recursive: true });
}

afterEach(teardown);

async function configWith(
  args: string[],
  env?: Record<string, string>,
): Promise<{ rootPath: string }> {
  const originalArgv = process.argv;
  const originalEnv: Record<string, string | undefined> = {};
  process.argv = ["node", "checkfiles", ...args];

  if (env) {
    for (const [k, v] of Object.entries(env)) {
      originalEnv[k] = process.env[k];
      process.env[k] = v;
    }
  }

  try {
    return await resolveConfig();
  } finally {
    process.argv = originalArgv;
    for (const k of Object.keys(originalEnv)) {
      const val = originalEnv[k];
      if (val === undefined) delete process.env[k];
      else process.env[k] = val;
    }
  }
}

test("resolves rootpath from --rootpath", async () => {
  await setup();
  const cfg = await configWith(["--rootpath", DATA_DIR]);
  expect(cfg.rootPath).toBe(DATA_DIR);
});

test("resolves rootpath from -r alias", async () => {
  await setup();
  const cfg = await configWith(["-r", DATA_DIR]);
  expect(cfg.rootPath).toBe(DATA_DIR);
});

test("flag takes precedence over ROOT_PATH", async () => {
  await setup();
  const cfg = await configWith(["--rootpath", DATA_DIR], {
    ROOT_PATH: "/tmp/other",
  });
  expect(cfg.rootPath).toBe(DATA_DIR);
});

test("resolves rootpath from ROOT_PATH", async () => {
  await setup();
  const cfg = await configWith([], { ROOT_PATH: DATA_DIR });
  expect(cfg.rootPath).toBe(DATA_DIR);
});
