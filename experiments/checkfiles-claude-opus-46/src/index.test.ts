import { test, expect } from "vitest";
import { resolve } from "node:path";

// CLI tests use subprocess invocation because commander calls process.exit on
// --help and unknown flags. Testing in-process would require .exitOverride() in
// production code solely for testability. Subprocess tests are honest — they
// verify actual CLI behavior.
const INDEX = resolve(import.meta.dirname!, "index.ts");

async function runCli(
  args: string[],
): Promise<{ code: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", "run", INDEX, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const code = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { code, stdout, stderr };
}

test("cli: --help exits 0 and shows usage", async () => {
  const { code, stdout } = await runCli(["--help"]);

  expect(code).toBe(0);
  expect(stdout).toContain("checkfiles");
  expect(stdout).toContain("--rootpath");
});

test("cli: unknown flag exits 1 with error", async () => {
  const { code, stderr } = await runCli(["--not-exists"]);

  expect(code).toBe(1);
  expect(stderr).toContain("unknown option");
});
