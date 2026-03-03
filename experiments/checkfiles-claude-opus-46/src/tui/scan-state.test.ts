import { test, expect } from "vitest";
import type { Stats } from "node:fs";
import { createScanState, makeScanCallback } from "./scan-state.ts";
import type { FileNode } from "../types.ts";

function fakeNode(relativePath: string, isDir: boolean): FileNode {
  return {
    relativePath,
    basename: relativePath.split("/").pop() ?? relativePath,
    stat: {
      isFile: () => !isDir,
      isDirectory: () => isDir,
      isSymbolicLink: () => false,
    } as unknown as Stats,
    xattrs: [],
  };
}

test("createScanState: returns zeroed state", () => {
  const s = createScanState();
  expect(s.files).toBe(0);
  expect(s.dirs).toBe(0);
  expect(s.processed).toBe(0);
  expect(s.dirStack).toEqual([]);
  expect(s.done).toBe(false);
  expect(s.startedAt).toBeGreaterThan(0);
});

test("pre: increments dirs and pushes to dirStack", () => {
  const s = createScanState();
  const cb = makeScanCallback(s);
  cb("pre", fakeNode("aaa", true));
  expect(s.dirs).toBe(1);
  expect(s.dirStack).toEqual(["aaa"]);
});

test("post: increments processed and pops from dirStack", () => {
  const s = createScanState();
  const cb = makeScanCallback(s);
  cb("pre", fakeNode("aaa", true));
  cb("post", fakeNode("aaa", true));
  expect(s.processed).toBe(1);
  expect(s.dirStack).toEqual([]);
});

test("leaf: increments files and processed", () => {
  const s = createScanState();
  const cb = makeScanCallback(s);
  cb("leaf", fakeNode("file.txt", false));
  expect(s.files).toBe(1);
  expect(s.processed).toBe(1);
});

test("total items = files + dirs", () => {
  const s = createScanState();
  const cb = makeScanCallback(s);
  cb("pre", fakeNode(".", true));
  cb("leaf", fakeNode("a.txt", false));
  cb("leaf", fakeNode("b.txt", false));
  cb("pre", fakeNode("sub", true));
  cb("leaf", fakeNode("sub/c.txt", false));
  cb("post", fakeNode("sub", true));
  cb("post", fakeNode(".", true));
  expect(s.files + s.dirs).toBe(5); // 3 files + 2 dirs
  expect(s.processed).toBe(5);
});

test("dirStack: nested push/pop order", () => {
  const s = createScanState();
  const cb = makeScanCallback(s);
  cb("pre", fakeNode(".", true));
  cb("pre", fakeNode("aaa", true));
  expect(s.dirStack).toEqual([".", "aaa"]);
  cb("post", fakeNode("aaa", true));
  expect(s.dirStack).toEqual(["."]);
  cb("pre", fakeNode("bbb", true));
  expect(s.dirStack).toEqual([".", "bbb"]);
  cb("post", fakeNode("bbb", true));
  cb("post", fakeNode(".", true));
  expect(s.dirStack).toEqual([]);
});
