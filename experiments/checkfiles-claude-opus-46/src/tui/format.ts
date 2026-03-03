// format — pure display helpers for results table (no OpenTUI dependency)

import type { FileNode } from "../types.ts";
import { validate } from "../validate.ts";

export interface ResultRow {
  relativePath: string;
  basename: string;
  depth: number;
  mode: string; // ls-like: drwxr-xr-x, -rw-r--r--@
  xattrs: string[];
  xattrSortKey: string; // joined for sorting
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
    xattrSortKey: node.xattrs.join(","),
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

export function sortByPath(a: ResultRow, b: ResultRow): number {
  return a.relativePath < b.relativePath
    ? -1
    : a.relativePath > b.relativePath
      ? 1
      : 0;
}

export function sortByXattrs(a: ResultRow, b: ResultRow): number {
  const cmp =
    a.xattrSortKey < b.xattrSortKey
      ? -1
      : a.xattrSortKey > b.xattrSortKey
        ? 1
        : 0;
  if (cmp !== 0) return cmp;
  return sortByPath(a, b);
}
