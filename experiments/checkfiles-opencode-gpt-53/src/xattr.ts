const IGNORED_XATTRS = new Set(["com.apple.provenance"]);

export async function checkXattrAvailable(): Promise<void> {
  const code = await runExitCode("which", ["xattr"]);
  if (code !== 0) {
    throw new Error("xattr command not found in PATH");
  }
}

export async function getXattrNames(path: string): Promise<string[]> {
  const stdout = await runCapture("xattr", [path]);
  const trimmed = stdout.trim();
  if (trimmed.length === 0) return [];

  return trimmed
    .split("\n")
    .map((name) => name.trim())
    .filter((name) => name.length > 0)
    .filter((name) => !IGNORED_XATTRS.has(name))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export async function setXattr(
  path: string,
  name: string,
  value: string,
): Promise<void> {
  const code = await runExitCode("xattr", ["-w", name, value, path]);
  if (code !== 0) {
    throw new Error(`xattr -w failed for ${path}`);
  }
}

async function runExitCode(command: string, args: string[]): Promise<number> {
  const proc = Bun.spawn([command, ...args], {
    stdout: "ignore",
    stderr: "ignore",
  });
  return await proc.exited;
}

async function runCapture(command: string, args: string[]): Promise<string> {
  const proc = Bun.spawn([command, ...args], {
    stdout: "pipe",
    stderr: "ignore",
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`${command} failed with exit code ${code}`);
  }
  return await new Response(proc.stdout).text();
}
