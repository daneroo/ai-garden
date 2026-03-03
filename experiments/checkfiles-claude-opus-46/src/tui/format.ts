// format — pure display helpers for results table (no OpenTUI dependency)

import type { FileNode } from "../types.ts";
import { validate } from "../validate.ts";

export interface ResultRow {
  relativePath: string;
  basename: string;
  depth: number;
  mode: string; // ls-like: drwxr-xr-x, -rw-r--r--@
  xattrs: string[];
  violations: string[];
  modeViolation: boolean;
  xattrViolation: boolean;
  pathViolation: boolean; // hidden or symlink
}

const RWX = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"] as const;

export function formatMode(
  stat: {
    isDirectory: () => boolean;
    isSymbolicLink: () => boolean;
    mode: number;
  },
  hasXattrs: boolean,
): string {
  const prefix = stat.isSymbolicLink() ? "l" : stat.isDirectory() ? "d" : "-";
  const perm = stat.mode & 0o777;
  const owner = RWX[(perm >> 6) & 7];
  const group = RWX[(perm >> 3) & 7];
  const other = RWX[perm & 7];
  return prefix + owner + group + other + (hasXattrs ? "@" : "");
}

export function displayPath(depth: number, basename: string): string {
  if (basename === ".") return "/";
  return "  ".repeat(depth) + basename;
}

export function buildResultRow(node: FileNode): ResultRow {
  const violations = validate(node);
  const depth =
    node.relativePath === "." ? 0 : node.relativePath.split("/").length - 1;
  return {
    relativePath: node.relativePath,
    basename: node.basename,
    depth,
    mode: formatMode(node.stat, node.xattrs.length > 0),
    xattrs: node.xattrs,
    violations,
    modeViolation: violations.some((v) => v.startsWith("mode ")),
    xattrViolation: violations.some((v) => v.startsWith("has xattrs")),
    pathViolation: violations.some(
      (v) => v === "hidden entry" || v === "symlink",
    ),
  };
}

// Find the longest common dot-delimited prefix across all xattr names
export function commonXattrPrefix(rows: ResultRow[]): string {
  const names = rows.flatMap((r) => r.xattrs);
  if (names.length === 0) return "";
  const parts0 = names[0].split(".");
  let shared = parts0.length;
  for (let i = 1; i < names.length; i++) {
    const parts = names[i].split(".");
    shared = Math.min(shared, parts.length);
    for (let j = 0; j < shared; j++) {
      if (parts[j] !== parts0[j]) {
        shared = j;
        break;
      }
    }
    if (shared === 0) return "";
  }
  // Keep at least one segment as suffix
  if (shared >= parts0.length) shared = parts0.length - 1;
  if (shared === 0) return "";
  return parts0.slice(0, shared).join(".") + ".";
}

export function compactXattr(name: string, prefix: string): string {
  if (prefix && name.startsWith(prefix))
    return ".." + name.slice(prefix.length);
  return name;
}

// Strip com.[vendor]. prefix: com.docker.grpcfuse.ownership -> grpcfuse.ownership
function stripComVendor(name: string): string {
  const m = name.match(/^com\.[^.]+\.(.*)/s);
  return m ? m[1] : name;
}

// Left-truncate to maxLen: if too long, ".." + right portion to fit exactly
function leftTrunc(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return ".." + s.slice(s.length - (maxLen - 2));
}

// Format xattr cell for display. Strips com.vendor. prefix, left-truncates to
// fit maxWidth, appends " +N" for additional attrs beyond the first.
export function formatXattrCell(xattrs: string[], maxWidth: number): string {
  if (xattrs.length === 0) return "—";
  const names = xattrs.map(stripComVendor);
  if (xattrs.length === 1) return leftTrunc(names[0], maxWidth);
  const suffix = ` +${xattrs.length - 1}`;
  return leftTrunc(names[0], maxWidth - suffix.length) + suffix;
}

export function sortByPath(a: ResultRow, b: ResultRow): number {
  return a.relativePath < b.relativePath
    ? -1
    : a.relativePath > b.relativePath
      ? 1
      : 0;
}

// Return ancestor directory paths from root to parent (excluding the path itself)
export function ancestorPaths(relativePath: string): string[] {
  if (relativePath === ".") return [];
  const parts = relativePath.split("/");
  if (parts.length === 1) return ["."];
  const ancestors: string[] = ["."];
  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join("/"));
  }
  return ancestors;
}

// Filter to violation rows + their ancestor directories, sorted by path
export function filterViolations(rows: ResultRow[]): ResultRow[] {
  const violationPaths = new Set<string>();
  const ancestorSet = new Set<string>();

  for (const row of rows) {
    if (row.violations.length > 0) {
      violationPaths.add(row.relativePath);
      for (const a of ancestorPaths(row.relativePath)) {
        ancestorSet.add(a);
      }
    }
  }

  const keep = new Set([...violationPaths, ...ancestorSet]);
  return rows.filter((r) => keep.has(r.relativePath)).sort(sortByPath);
}
