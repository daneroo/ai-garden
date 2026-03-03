import { afterEach, expect, test } from "vitest";
import { mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { traverse } from "./traverse.ts";
import type { FsNode, TraversalEvent } from "./types.ts";

const DATA_DIR = resolve(import.meta.dirname!, "../data/traverse-test");

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

async function setupTree() {
  await teardown();
  await mkdir(`${DATA_DIR}/root/aaa`, { recursive: true });
  await mkdir(`${DATA_DIR}/root/bbb`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/aaa/file1.txt`, "one");
  await writeFile(`${DATA_DIR}/root/bbb/file2.txt`, "two");
  await writeFile(`${DATA_DIR}/root/top.txt`, "top");
}

afterEach(teardown);

interface Recorded {
  event: TraversalEvent;
  node: FsNode;
}

async function collect(rootPath: string): Promise<Recorded[]> {
  const rows: Recorded[] = [];
  await traverse(rootPath, (event, node) =>
    rows.push({ event, node: { ...node } }),
  );
  return rows;
}

test("root emits dir-pre and dir-post", async () => {
  await setupTree();
  const rows = await collect(`${DATA_DIR}/root`);
  const rootPre = rows.find(
    (r) => r.node.relativePath === "." && r.event === "dir-pre",
  );
  const rootPost = rows.find(
    (r) => r.node.relativePath === "." && r.event === "dir-post",
  );

  expect(rootPre).toBeDefined();
  expect(rootPost).toBeDefined();
});

test("directory children appear between dir-pre and dir-post", async () => {
  await setupTree();
  const rows = await collect(`${DATA_DIR}/root`);

  const aaaPre = rows.findIndex(
    (r) => r.node.relativePath === "aaa" && r.event === "dir-pre",
  );
  const aaaFile = rows.findIndex(
    (r) => r.node.relativePath === "aaa/file1.txt",
  );
  const aaaPost = rows.findIndex(
    (r) => r.node.relativePath === "aaa" && r.event === "dir-post",
  );

  expect(aaaPre).toBeGreaterThan(-1);
  expect(aaaFile).toBeGreaterThan(aaaPre);
  expect(aaaPost).toBeGreaterThan(aaaFile);
});

test("deterministic lexical ordering by full relative path", async () => {
  await setupTree();
  const rows = await collect(`${DATA_DIR}/root`);

  const visibleOrder = rows
    .filter((r) => r.event !== "dir-post")
    .map((r) => `${r.event}:${r.node.relativePath}`);

  expect(visibleOrder).toEqual([
    "dir-pre:.",
    "dir-pre:aaa",
    "file:aaa/file1.txt",
    "dir-pre:bbb",
    "file:bbb/file2.txt",
    "file:top.txt",
  ]);
});

test("hidden directory is emitted once and not traversed", async () => {
  await teardown();
  await mkdir(`${DATA_DIR}/root/.hidden`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/.hidden/secret.txt`, "secret");

  const rows = await collect(`${DATA_DIR}/root`);

  const hidden = rows.find((r) => r.node.relativePath === ".hidden");
  const hiddenChild = rows.find(
    (r) => r.node.relativePath === ".hidden/secret.txt",
  );

  expect(hidden?.event).toBe("file");
  expect(hidden?.node.basename.startsWith(".")).toBe(true);
  expect(hidden?.node.stat.isDirectory()).toBe(true);
  expect(hiddenChild).toBeUndefined();
});

test("symlink entries are emitted once and never traversed", async () => {
  await teardown();
  await mkdir(`${DATA_DIR}/root/realdir`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/realdir/real.txt`, "real");
  await symlink(`${DATA_DIR}/root/realdir`, `${DATA_DIR}/root/linkdir`);

  const rows = await collect(`${DATA_DIR}/root`);
  const linkdir = rows.find((r) => r.node.relativePath === "linkdir");
  const traversedFromLink = rows.find((r) =>
    r.node.relativePath.startsWith("linkdir/"),
  );

  expect(linkdir?.event).toBe("file");
  expect(linkdir?.node.stat.isSymbolicLink()).toBe(true);
  expect(traversedFromLink).toBeUndefined();
});

test("single-record-per-node lifecycle uses same object for dir-pre and dir-post", async () => {
  await setupTree();
  let preRef: FsNode | undefined;
  let postRef: FsNode | undefined;

  await traverse(`${DATA_DIR}/root`, (event, node) => {
    if (node.relativePath !== "aaa") return;
    if (event === "dir-pre") preRef = node;
    if (event === "dir-post") postRef = node;
  });

  expect(preRef).toBeDefined();
  expect(postRef).toBeDefined();
  expect(preRef === postRef).toBe(true);
});
