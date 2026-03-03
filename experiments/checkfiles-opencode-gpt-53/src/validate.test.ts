import { expect, test } from "vitest";
import type { Stats } from "node:fs";
import type { FsNode, TraversalEvent } from "./types.ts";
import { inspectNode } from "./validate.ts";

function fakeStat(kind: "file" | "dir" | "symlink", mode: number): Stats {
  return {
    mode,
    mtimeMs: 123,
    isFile: () => kind === "file",
    isDirectory: () => kind === "dir",
    isSymbolicLink: () => kind === "symlink",
  } as unknown as Stats;
}

function node(
  event: TraversalEvent,
  relativePath: string,
  stat: Stats,
  xattrs: string[] = [],
) {
  const fsNode: FsNode = {
    relativePath,
    basename:
      relativePath === "."
        ? "."
        : (relativePath.split("/").at(-1) ?? relativePath),
    stat,
    xattrs,
  };
  return inspectNode(event, fsNode);
}

test("file 0644 is mode-valid", () => {
  const record = node("file", "ok.txt", fakeStat("file", 0o100644));
  expect(record.modePerm).toBe("644");
  expect(record.modeValid).toBe(true);
  expect(record.violations).toEqual([]);
});

test("directory 0755 is mode-valid", () => {
  const record = node("dir-post", "dir", fakeStat("dir", 0o040755));
  expect(record.kind).toBe("dir");
  expect(record.modeValid).toBe(true);
});

test("wrong mode creates violation", () => {
  const record = node("file", "bad.txt", fakeStat("file", 0o100600));
  expect(record.modeValid).toBe(false);
  expect(record.violations).toContain("mode 600 expected 644");
});

test("hidden entry creates violation", () => {
  const record = node("file", ".secret", fakeStat("file", 0o100644));
  expect(record.isHidden).toBe(true);
  expect(record.violations).toContain("hidden entry");
});

test("symlink creates symlink violation", () => {
  const record = node("file", "link", fakeStat("symlink", 0o120777));
  expect(record.isSymlink).toBe(true);
  expect(record.violations).toContain("symlink");
});

test("xattrs create xattr violation", () => {
  const record = node("file", "x.txt", fakeStat("file", 0o100644), [
    "com.example.attr",
  ]);
  expect(record.xattrsValid).toBe(false);
  expect(record.violations).toContain("has xattrs: com.example.attr");
});

test("dir-pre is in-progress and dir-post is completed", () => {
  const pre = node("dir-pre", "dir", fakeStat("dir", 0o040755));
  const post = node("dir-post", "dir", fakeStat("dir", 0o040755));
  expect(pre.status).toBe("in-progress");
  expect(post.status).toBe("completed");
});
