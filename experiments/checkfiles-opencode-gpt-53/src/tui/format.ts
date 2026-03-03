import type { InspectedNodeRecord } from "../types.ts";

const RWX = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"] as const;

export function formatMode(row: InspectedNodeRecord): string {
  const prefix = row.isSymlink ? "l" : row.kind === "dir" ? "d" : "-";
  const mode = parseInt(row.modePerm, 8) & 0o777;
  const owner = RWX[(mode >> 6) & 7];
  const group = RWX[(mode >> 3) & 7];
  const other = RWX[mode & 7];
  return `${prefix}${owner}${group}${other}${row.xattrs.length > 0 ? "@" : ""}`;
}

export function displayPath(depth: number, basename: string): string {
  if (basename === ".") return "/";
  return `${"  ".repeat(depth)}${basename}`;
}

export function sortByPath(
  a: InspectedNodeRecord,
  b: InspectedNodeRecord,
): number {
  return a.relativePath < b.relativePath
    ? -1
    : a.relativePath > b.relativePath
      ? 1
      : 0;
}

export function ancestorPaths(relativePath: string): string[] {
  if (relativePath === ".") return [];
  const parts = relativePath.split("/");
  if (parts.length === 1) return ["."];

  const ancestors = ["."];
  for (let i = 1; i < parts.length; i++) {
    ancestors.push(parts.slice(0, i).join("/"));
  }
  return ancestors;
}

export function filterViolations(
  rows: InspectedNodeRecord[],
): InspectedNodeRecord[] {
  const violationPaths = new Set<string>();
  const contextPaths = new Set<string>();

  for (const row of rows) {
    if (row.violations.length === 0) continue;
    violationPaths.add(row.relativePath);
    for (const ancestor of ancestorPaths(row.relativePath)) {
      contextPaths.add(ancestor);
    }
  }

  const keep = new Set([...violationPaths, ...contextPaths]);
  return rows.filter((row) => keep.has(row.relativePath)).sort(sortByPath);
}

export function formatXattrCell(xattrs: string[], maxWidth: number): string {
  if (xattrs.length === 0) return "-";

  const names = xattrs.map((name) => {
    const m = name.match(/^com\.[^.]+\.(.*)$/);
    return m ? m[1] : name;
  });

  if (names.length === 1) {
    return truncate(names[0], maxWidth);
  }

  const suffix = ` +${names.length - 1}`;
  return `${truncate(names[0], maxWidth - suffix.length)}${suffix}`;
}

function truncate(value: string, maxWidth: number): string {
  if (maxWidth < 3 || value.length <= maxWidth) return value;
  return `${value.slice(0, maxWidth - 1)}…`;
}
