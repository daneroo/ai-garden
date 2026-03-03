import { expect, test } from "vitest";
import type { Stats } from "node:fs";
import {
  applyTraverseEvent,
  createScanState,
  formatElapsed,
  snapshot,
} from "./scan-state.ts";
import type { FsNode, TraversalEvent } from "../types.ts";

function fakeNode(relativePath: string, kind: "dir" | "file"): FsNode {
  return {
    relativePath,
    basename:
      relativePath === "."
        ? "."
        : (relativePath.split("/").at(-1) ?? relativePath),
    xattrs: [],
    stat: {
      mode: kind === "dir" ? 0o040755 : 0o100644,
      mtimeMs: 1000,
      isDirectory: () => kind === "dir",
      isFile: () => kind === "file",
      isSymbolicLink: () => false,
    } as unknown as Stats,
  };
}

function apply(
  event: TraversalEvent,
  relativePath: string,
  kind: "dir" | "file",
): ReturnType<typeof createScanState> {
  const state = createScanState();
  applyTraverseEvent(state, event, fakeNode(relativePath, kind));
  return state;
}

test("createScanState starts zeroed", () => {
  const s = createScanState();
  expect(s.files).toBe(0);
  expect(s.dirs).toBe(0);
  expect(s.processed).toBe(0);
  expect(s.dirStack).toEqual([]);
  expect(s.done).toBe(false);
});

test("dir-pre increments dirs and stack", () => {
  const s = apply("dir-pre", "a", "dir");
  expect(s.dirs).toBe(1);
  expect(s.dirStack).toEqual(["a"]);
});

test("file increments files and processed", () => {
  const s = apply("file", "a.txt", "file");
  expect(s.files).toBe(1);
  expect(s.processed).toBe(1);
});

test("dir-post increments processed and removes stack path", () => {
  const s = createScanState();
  applyTraverseEvent(s, "dir-pre", fakeNode(".", "dir"));
  applyTraverseEvent(s, "dir-pre", fakeNode("a", "dir"));
  applyTraverseEvent(s, "dir-post", fakeNode("a", "dir"));
  expect(s.processed).toBe(1);
  expect(s.dirStack).toEqual(["."]);
});

test("snapshot computes totals remaining and eta", () => {
  const s = createScanState();
  s.startedAt = 0;
  s.files = 4;
  s.dirs = 2;
  s.processed = 3;
  const snap = snapshot(s, 3000);
  expect(snap.total).toBe(6);
  expect(snap.remaining).toBe(3);
  expect(snap.etaMs).toBe(3000);
});

test("formatElapsed formats mm ss", () => {
  expect(formatElapsed(9000)).toBe("9s");
  expect(formatElapsed(65000)).toBe("1m 5s");
});
