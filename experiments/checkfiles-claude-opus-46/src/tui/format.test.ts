import { test, expect } from "vitest";
import type { Stats } from "node:fs";
import {
  formatMode,
  displayPath,
  compactXattr,
  commonXattrPrefix,
  buildResultRow,
  sortByPath,
  ancestorPaths,
  filterViolations,
  formatXattrCell,
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

// --- ancestorPaths ---

test("ancestorPaths: root has no ancestors", () => {
  expect(ancestorPaths(".")).toEqual([]);
});

test("ancestorPaths: top-level file", () => {
  expect(ancestorPaths("foo.txt")).toEqual(["."]);
});

test("ancestorPaths: single-level nested", () => {
  expect(ancestorPaths("a/b.txt")).toEqual([".", "a"]);
});

test("ancestorPaths: deep nesting", () => {
  expect(ancestorPaths("a/b/c.txt")).toEqual([".", "a", "a/b"]);
});

// --- filterViolations ---

function makeViolationRow(
  relativePath: string,
  violations: string[] = [],
): ResultRow {
  return {
    ...makeRow(relativePath),
    violations,
    modeViolation: violations.some((v) => v.startsWith("mode ")),
    xattrViolation: violations.some((v) => v.startsWith("has xattrs")),
    pathViolation: violations.some(
      (v) => v === "hidden entry" || v === "symlink",
    ),
  };
}

test("filterViolations: no violations returns empty", () => {
  const rows = [makeViolationRow("."), makeViolationRow("a.txt")];
  expect(filterViolations(rows)).toEqual([]);
});

test("filterViolations: single violation includes ancestors", () => {
  const rows = [
    makeViolationRow("."),
    makeViolationRow("src"),
    makeViolationRow("src/bad.txt", ["mode 600"]),
    makeViolationRow("other.txt"),
  ];
  const filtered = filterViolations(rows);
  expect(filtered.map((r) => r.relativePath)).toEqual([
    ".",
    "src",
    "src/bad.txt",
  ]);
});

test("filterViolations: shared ancestors appear once", () => {
  const rows = [
    makeViolationRow("."),
    makeViolationRow("a"),
    makeViolationRow("a/x.txt", ["mode 600"]),
    makeViolationRow("a/y.txt", ["has xattrs"]),
  ];
  const filtered = filterViolations(rows);
  expect(filtered.map((r) => r.relativePath)).toEqual([
    ".",
    "a",
    "a/x.txt",
    "a/y.txt",
  ]);
});

test("filterViolations: root violation shown alone", () => {
  const rows = [
    makeViolationRow(".", ["mode 600"]),
    makeViolationRow("ok.txt"),
  ];
  const filtered = filterViolations(rows);
  expect(filtered.map((r) => r.relativePath)).toEqual(["."]);
});

test("filterViolations: all violations keeps all with ancestors", () => {
  const rows = [
    makeViolationRow(".", ["mode 600"]),
    makeViolationRow("a.txt", ["has xattrs"]),
  ];
  const filtered = filterViolations(rows);
  expect(filtered.map((r) => r.relativePath)).toEqual([".", "a.txt"]);
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

// --- formatXattrCell ---

test("formatXattrCell: no xattrs returns dash", () => {
  expect(formatXattrCell([], 24)).toBe("—");
});

test("formatXattrCell: strips com.vendor. prefix", () => {
  expect(formatXattrCell(["com.docker.grpcfuse.ownership"], 24)).toBe(
    "grpcfuse.ownership",
  );
});

test("formatXattrCell: strips com.apple. prefix", () => {
  expect(formatXattrCell(["com.apple.quarantine"], 24)).toBe("quarantine");
});

test("formatXattrCell: no com.vendor. prefix left intact", () => {
  expect(formatXattrCell(["org.freedesktop.attr"], 24)).toBe(
    "org.freedesktop.attr",
  );
});

test("formatXattrCell: single long attr left-truncated with ..", () => {
  // "com.docker.grpcfuse.averylongnamethatexceeds" -> "grpcfuse.averylongnamethatexceeds" (33)
  // truncated to 24: ".." + last 22 chars
  const result = formatXattrCell(
    ["com.docker.grpcfuse.averylongnamethatexceeds"],
    24,
  );
  expect(result.length).toBe(24);
  expect(result.startsWith("..")).toBe(true);
});

test("formatXattrCell: multiple attrs shows first + +N", () => {
  const result = formatXattrCell(
    ["com.docker.grpcfuse.ownership", "com.docker.grpcfuse.metadata"],
    24,
  );
  expect(result).toBe("grpcfuse.ownership +1");
});

test("formatXattrCell: multiple with long first truncates to fit +N", () => {
  const result = formatXattrCell(
    ["com.docker.grpcfuse.averylongnamethatexceeds", "com.docker.grpcfuse.b"],
    24,
  );
  // suffix is " +1" (3 chars), available = 21, result should be <= 24
  expect(result.length).toBeLessThanOrEqual(24);
  expect(result.endsWith("+1")).toBe(true);
});
