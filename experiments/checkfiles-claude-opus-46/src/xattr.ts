// xattr — get/set extended attributes via system xattr command

// Attrs that are kernel-enforced and cannot be removed — filter from results.
const IGNORED_XATTRS = new Set(["com.apple.provenance"]);

// Verify xattr command is available. Call once at startup; throws on failure.
export async function checkXattrAvailable(): Promise<void> {
  const code = await run("which", ["xattr"]);
  if (code !== 0) {
    console.error("Fatal: xattr command not found in PATH");
    process.exit(1);
  }
}

// Get xattr names for a single path. Returns sorted array of attribute names.
// Filters out kernel-enforced unremovable attrs (com.apple.provenance).
// Throws on xattr command failure — unexpected, caught at top level.
export async function getXattrNames(path: string): Promise<string[]> {
  const stdout = await runCapture("xattr", [path]);

  const trimmed = stdout.trim();
  if (trimmed === "") return [];

  return trimmed
    .split("\n")
    .filter((n) => !IGNORED_XATTRS.has(n))
    .sort();
}

// Set an xattr name/value pair on a path. Rejects on failure.
export async function setXattr(
  path: string,
  name: string,
  value: string,
): Promise<void> {
  const code = await run("xattr", ["-w", name, value, path]);
  if (code !== 0) {
    throw new Error(`xattr -w ${name} failed on ${path}`);
  }
}

// Run command and return exit code
async function run(cmd: string, args: string[]): Promise<number> {
  const proc = Bun.spawn([cmd, ...args], {
    stdout: "ignore",
    stderr: "ignore",
  });
  return proc.exited;
}

// Run command and return stdout. Rejects on non-zero exit.
async function runCapture(cmd: string, args: string[]): Promise<string> {
  const proc = Bun.spawn([cmd, ...args], { stderr: "ignore" });
  const code = await proc.exited;
  if (code !== 0) throw new Error(`${cmd} exited with ${code}`);
  return await new Response(proc.stdout).text();
}
