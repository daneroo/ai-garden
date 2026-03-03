import { test, expect } from "vitest";
import type { Stats } from "node:fs";
import {
  formatMode,
  displayPath,
  compactXattr,
  commonXattrPrefix,
  buildResultRow,
  sortByPath,
  sortByXattrs,
  type ResultRow,
} from "./format.ts";
import type { FileNode } from "../types.ts";

function fakeStat(mode: number, kind: "file" | "dir" | "symlink") {
  return {
    mode,
    isFile: () => kind === "file",
    isDirectory: () => kind === "dir",
    isSymbolicLink: () => kind === "symlink",
  } as unknown as Stats;
}

// --- formatMode ---

test("formatMode: file 644", () => {
  expect(formatMode(fakeStat(0o100644, "file"), false)).toBe("-rw-r--r--");
});

test("formatMode: dir 755", () => {
  expect(formatMode(fakeStat(0o040755, "dir"), false)).toBe("drwxr-xr-x");
});

test("formatMode: symlink 777", () => {
  expect(formatMode(fakeStat(0o120777, "symlink"), false)).toBe("lrwxrwxrwx");
});

test("formatMode: xattr suffix", () => {
  expect(formatMode(fakeStat(0o100644, "file"), true)).toBe("-rw-r--r--@");
});

test("formatMode: file 600", () => {
  expect(formatMode(fakeStat(0o100600, "file"), false)).toBe("-rw-------");
});

// --- displayPath ---

test("displayPath: depth 0", () => {
  expect(displayPath(0, "root")).toBe("root");
});

test("displayPath: depth 1", () => {
  expect(displayPath(1, "child")).toBe("  child");
});

test("displayPath: depth 3", () => {
  expect(displayPath(3, "deep")).toBe("      deep");
});

test("displayPath: root . shows /", () => {
  expect(displayPath(0, ".")).toBe("/");
});

// --- buildResultRow ---

test("buildResultRow: file with no violations", () => {
  const node: FileNode = {
    relativePath: "src/foo.txt",
    basename: "foo.txt",
    stat: fakeStat(0o100644, "file"),
    xattrs: [],
  };
  const row = buildResultRow(node);
  expect(row.relativePath).toBe("src/foo.txt");
  expect(row.basename).toBe("foo.txt");
  expect(row.depth).toBe(1);
  expect(row.mode).toBe("-rw-r--r--");
  expect(row.violations).toEqual([]);
});

test("buildResultRow: root is depth 0", () => {
  const node: FileNode = {
    relativePath: ".",
    basename: ".",
    stat: fakeStat(0o040755, "dir"),
    xattrs: [],
  };
  expect(buildResultRow(node).depth).toBe(0);
});

test("buildResultRow: nested path has correct depth", () => {
  const node: FileNode = {
    relativePath: "a/b/c.txt",
    basename: "c.txt",
    stat: fakeStat(0o100644, "file"),
    xattrs: [],
  };
  expect(buildResultRow(node).depth).toBe(2);
});

test("buildResultRow: mode violation classified", () => {
  const node: FileNode = {
    relativePath: "bad.txt",
    basename: "bad.txt",
    stat: fakeStat(0o100600, "file"),
    xattrs: [],
  };
  const row = buildResultRow(node);
  expect(row.modeViolation).toBe(true);
  expect(row.xattrViolation).toBe(false);
  expect(row.pathViolation).toBe(false);
});

test("buildResultRow: xattr violation classified", () => {
  const node: FileNode = {
    relativePath: "x.txt",
    basename: "x.txt",
    stat: fakeStat(0o100644, "file"),
    xattrs: ["com.example"],
  };
  const row = buildResultRow(node);
  expect(row.xattrViolation).toBe(true);
  expect(row.modeViolation).toBe(false);
});

test("buildResultRow: hidden entry is pathViolation", () => {
  const node: FileNode = {
    relativePath: ".hidden",
    basename: ".hidden",
    stat: fakeStat(0o100644, "file"),
    xattrs: [],
  };
  const row = buildResultRow(node);
  expect(row.pathViolation).toBe(true);
  expect(row.modeViolation).toBe(false);
});

// --- sort comparators ---

function makeRow(relativePath: string, xattrs: string[] = []): ResultRow {
  return {
    relativePath,
    basename: relativePath.split("/").pop() ?? relativePath,
    depth: 0,
    mode: "-rw-r--r--",
    xattrs,
    xattrSortKey: xattrs.join(","),
    violations: [],
    modeViolation: false,
    xattrViolation: false,
    pathViolation: false,
  };
}

test("sortByPath: ascending order", () => {
  const rows = [makeRow("c.txt"), makeRow("a.txt"), makeRow("b.txt")];
  rows.sort(sortByPath);
  expect(rows.map((r) => r.relativePath)).toEqual(["a.txt", "b.txt", "c.txt"]);
});

test("sortByPath: equal paths return 0", () => {
  expect(sortByPath(makeRow("same"), makeRow("same"))).toBe(0);
});

test("sortByXattrs: sorts by xattr key", () => {
  const rows = [
    makeRow("b.txt", ["com.z"]),
    makeRow("a.txt", ["com.a"]),
    makeRow("c.txt", []),
  ];
  rows.sort(sortByXattrs);
  expect(rows.map((r) => r.relativePath)).toEqual(["c.txt", "a.txt", "b.txt"]);
});

test("sortByXattrs: tie-breaker by path", () => {
  const rows = [makeRow("z.txt", ["x"]), makeRow("a.txt", ["x"])];
  rows.sort(sortByXattrs);
  expect(rows.map((r) => r.relativePath)).toEqual(["a.txt", "z.txt"]);
});

// --- commonXattrPrefix / compactXattr ---

test("commonXattrPrefix: shared dotted prefix", () => {
  const rows = [
    makeRow("a", ["com.docker.grpcfuse.ownership"]),
    makeRow("b", ["com.docker.grpcfuse.metadata"]),
  ];
  expect(commonXattrPrefix(rows)).toBe("com.docker.grpcfuse.");
});

test("commonXattrPrefix: single xattr name keeps at least one suffix segment", () => {
  const rows = [makeRow("a", ["com.docker.grpcfuse.ownership"])];
  expect(commonXattrPrefix(rows)).toBe("com.docker.grpcfuse.");
});

test("commonXattrPrefix: no xattrs returns empty", () => {
  expect(commonXattrPrefix([makeRow("a")])).toBe("");
});

test("commonXattrPrefix: no shared prefix returns empty", () => {
  const rows = [makeRow("a", ["org.foo"]), makeRow("b", ["com.bar"])];
  expect(commonXattrPrefix(rows)).toBe("");
});

test("compactXattr: strips prefix with ..", () => {
  expect(
    compactXattr("com.docker.grpcfuse.ownership", "com.docker.grpcfuse."),
  ).toBe("..ownership");
});

test("compactXattr: no prefix returns full name", () => {
  expect(compactXattr("com.apple.something", "")).toBe("com.apple.something");
});

test("compactXattr: non-matching prefix returns full name", () => {
  expect(compactXattr("org.other.attr", "com.docker.")).toBe("org.other.attr");
});
