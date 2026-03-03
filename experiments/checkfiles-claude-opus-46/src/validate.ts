// validate — rule checks applied to FileNode after traversal

import type { FileNode } from "./types.ts";

// Required permission modes
const REQUIRED_FILE_MODE = 0o644;
const REQUIRED_DIR_MODE = 0o755;

// Returns list of violation descriptions for a node. Empty list = valid.
export function validate(node: FileNode): string[] {
  const violations: string[] = [];

  if (node.basename.startsWith(".") && node.relativePath !== ".") {
    violations.push("hidden entry");
  }

  if (node.stat.isSymbolicLink()) {
    violations.push("symlink");
  }

  if (node.stat.mode !== null && node.stat.mode !== undefined) {
    const perm = node.stat.mode & 0o777;
    if (node.stat.isDirectory() && perm !== REQUIRED_DIR_MODE) {
      violations.push(
        `mode ${formatOctal(perm)} expected ${formatOctal(REQUIRED_DIR_MODE)}`,
      );
    }
    if (node.stat.isFile() && perm !== REQUIRED_FILE_MODE) {
      violations.push(
        `mode ${formatOctal(perm)} expected ${formatOctal(REQUIRED_FILE_MODE)}`,
      );
    }
  }

  if (node.xattrs.length > 0) {
    violations.push(`has xattrs: ${node.xattrs.join(", ")}`);
  }

  return violations;
}

function formatOctal(mode: number): string {
  return mode.toString(8).padStart(3, "0");
}
