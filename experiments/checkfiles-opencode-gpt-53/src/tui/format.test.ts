import { expect, test } from "vitest";
import type { InspectedNodeRecord } from "../types.ts";
import {
  displayPath,
  formatMode,
  formatXattrCell,
  sortByPath,
} from "./format.ts";

function row(partial: Partial<InspectedNodeRecord>): InspectedNodeRecord {
  return {
    kind: "file",
    phase: "file",
    status: "completed",
    relativePath: "a.txt",
    basename: "a.txt",
    depth: 0,
    isHidden: false,
    isSymlink: false,
    mtimeMs: 1,
    modePerm: "644",
    xattrs: [],
    modeValid: true,
    xattrsValid: true,
    violations: [],
    ...partial,
  };
}

test("formatMode renders directory mode", () => {
  expect(formatMode(row({ kind: "dir", modePerm: "755" }))).toBe("drwxr-xr-x");
});

test("formatMode appends @ when xattrs exist", () => {
  expect(formatMode(row({ xattrs: ["com.test.attr"] }))).toBe("-rw-r--r--@");
});

test("displayPath indents by depth", () => {
  expect(displayPath(2, "leaf.txt")).toBe("    leaf.txt");
});

test("displayPath shows root as slash", () => {
  expect(displayPath(0, ".")).toBe("/");
});

test("sortByPath sorts lexical by relativePath", () => {
  const rows = [row({ relativePath: "b" }), row({ relativePath: "a" })];
  rows.sort(sortByPath);
  expect(rows.map((r) => r.relativePath)).toEqual(["a", "b"]);
});

test("formatXattrCell strips com.vendor prefix", () => {
  expect(formatXattrCell(["com.docker.grpcfuse.ownership"], 40)).toBe(
    "grpcfuse.ownership",
  );
});

test("formatXattrCell compacts multiple attrs", () => {
  expect(formatXattrCell(["com.test.alpha", "com.test.beta"], 20)).toBe(
    "alpha +1",
  );
});
