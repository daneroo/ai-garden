import { expect, test } from "vitest";
import { resolve } from "node:path";

const INDEX = resolve(import.meta.dirname!, "index.ts");

async function runCli(
  args: string[],
  env?: Record<string, string>,
): Promise<{ code: number; stdout: string; stderr: string }> {
  const baseEnv = { ...process.env };
  if (env) {
    for (const [k, v] of Object.entries(env)) {
      baseEnv[k] = v;
    }
  }

  const proc = Bun.spawn(["bun", "run", INDEX, ...args], {
    stdout: "pipe",
    stderr: "pipe",
    env: baseEnv,
  });
  const code = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { code, stdout, stderr };
}

test("cli --help exits 0 and includes rootpath option", async () => {
  const { code, stdout } = await runCli(["--help"]);
  expect(code).toBe(0);
  expect(stdout).toContain("checkfiles");
  expect(stdout).toContain("--rootpath");
});

test("cli unknown flag exits 1", async () => {
  const { code, stderr } = await runCli(["--does-not-exist"]);
  expect(code).toBe(1);
  expect(stderr).toContain("unknown option");
});

test("cli exits 1 when no root path resolves", async () => {
  const { code, stderr } = await runCli([], { ROOT_PATH: "" });
  expect(code).toBe(1);
  expect(stderr).toContain("Fatal: no root path");
});
