// xattr — collect extended attribute names via system xattr command

// Verify xattr command is available. Call once at startup; throws on failure.
export async function checkXattrAvailable(): Promise<void> {
  const cmd = new Deno.Command("which", {
    args: ["xattr"],
    stdout: "null",
    stderr: "null",
  });
  const { code } = await cmd.output();
  if (code !== 0) {
    console.error("Fatal: xattr command not found in PATH");
    Deno.exit(1);
  }
}

// Attrs that are kernel-enforced and cannot be removed — filter from results.
const IGNORED_XATTRS = new Set(["com.apple.provenance"]);

// Get xattr names for a single path. Returns sorted array of attribute names.
// Filters out kernel-enforced unremovable attrs (com.apple.provenance).
// On failure, logs warning and returns empty array.
export async function getXattrNames(path: string): Promise<string[]> {
  const cmd = new Deno.Command("xattr", {
    args: [path],
    stdout: "piped",
    stderr: "piped",
  });

  let result;
  try {
    result = await cmd.output();
  } catch {
    console.warn(`Warning: xattr failed for ${path}`);
    return [];
  }

  if (result.code !== 0) {
    console.warn(`Warning: xattr failed for ${path}`);
    return [];
  }

  const stdout = new TextDecoder().decode(result.stdout).trim();
  if (stdout === "") return [];

  return stdout.split("\n").filter((n) => !IGNORED_XATTRS.has(n)).sort();
}
