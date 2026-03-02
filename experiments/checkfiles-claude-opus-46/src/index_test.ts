import { assertEquals, assertStringIncludes } from "@std/assert";

// CLI tests use subprocess invocation because commander calls process.exit on
// --help and unknown flags. Testing in-process would require .exitOverride() in
// production code solely for testability. Subprocess tests are honest — they
// verify actual CLI behavior.
const INDEX = new URL("./index.ts", import.meta.url).pathname;

Deno.test("cli: --help exits 0 and shows usage", async () => {
  const cmd = new Deno.Command("deno", {
    args: ["run", "-A", INDEX, "--help"],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout } = await cmd.output();
  const out = new TextDecoder().decode(stdout);

  assertEquals(code, 0);
  assertStringIncludes(out, "checkfiles");
  assertStringIncludes(out, "--rootpath");
});

Deno.test("cli: unknown flag exits 1 with error", async () => {
  const cmd = new Deno.Command("deno", {
    args: ["run", "-A", INDEX, "--not-exists"],
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stderr } = await cmd.output();
  const err = new TextDecoder().decode(stderr);

  assertEquals(code, 1);
  assertStringIncludes(err, "unknown option");
});
