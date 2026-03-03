import { test, expect, afterEach } from "vitest";
import { mkdir, rm, writeFile, symlink } from "node:fs/promises";
import { resolve } from "node:path";
import { traverse } from "./traverse.ts";
import type { FileNode, TraversalEvent } from "./types.ts";

const DATA_DIR = resolve(import.meta.dirname!, "../data/traverse-test");

interface Recorded {
  event: TraversalEvent;
  node: FileNode;
}

async function setup() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
  await mkdir(`${DATA_DIR}/root/aaa`, { recursive: true });
  await mkdir(`${DATA_DIR}/root/bbb`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/aaa/file1.txt`, "hello");
  await writeFile(`${DATA_DIR}/root/bbb/file2.txt`, "world");
  await writeFile(`${DATA_DIR}/root/top.txt`, "top");
}

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

afterEach(teardown);

async function collect(rootPath: string): Promise<Recorded[]> {
  const records: Recorded[] = [];
  await traverse(rootPath, (event, node) =>
    records.push({ event, node: { ...node } }),
  );
  return records;
}

test("traverse: emits pre and post for root", async () => {
  await setup();
  const recs = await collect(`${DATA_DIR}/root`);
  const pre = recs.find(
    (r) => r.node.relativePath === "." && r.event === "pre",
  );
  const post = recs.find(
    (r) => r.node.relativePath === "." && r.event === "post",
  );
  expect(pre?.node.stat?.isDirectory()).toBe(true);
  expect(post?.node.stat?.isDirectory()).toBe(true);
});

test("traverse: children appear between pre and post", async () => {
  await setup();
  const recs = await collect(`${DATA_DIR}/root`);
  const aaaPre = recs.findIndex(
    (r) => r.node.relativePath === "aaa" && r.event === "pre",
  );
  const aaaPost = recs.findIndex(
    (r) => r.node.relativePath === "aaa" && r.event === "post",
  );
  const file1 = recs.findIndex((r) => r.node.relativePath === "aaa/file1.txt");

  expect(aaaPre < file1).toBe(true);
  expect(file1 < aaaPost).toBe(true);
});

test("traverse: deterministic sort order by relative path", async () => {
  await setup();
  const recs = await collect(`${DATA_DIR}/root`);
  const paths = recs
    .filter((r) => r.node.relativePath !== "." && r.event !== "post")
    .map((r) => r.node.relativePath);

  expect(paths).toEqual([
    "aaa",
    "aaa/file1.txt",
    "bbb",
    "bbb/file2.txt",
    "top.txt",
  ]);
});

test("traverse: files are leaf events", async () => {
  await setup();
  const recs = await collect(`${DATA_DIR}/root`);
  const file = recs.find((r) => r.node.relativePath === "top.txt");
  expect(file?.event).toBe("leaf");
  expect(file?.node.stat?.isFile()).toBe(true);
});

test("traverse: hidden directory is emitted as leaf, not recursed", async () => {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
  await mkdir(`${DATA_DIR}/root/.hidden`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/.hidden/secret.txt`, "nope");

  const recs = await collect(`${DATA_DIR}/root`);

  const hidden = recs.find((r) => r.node.relativePath === ".hidden");
  expect(hidden?.event).toBe("leaf");
  expect(hidden?.node.basename.startsWith(".")).toBe(true);
  expect(hidden?.node.stat?.isDirectory()).toBe(true);

  const secret = recs.find((r) => r.node.relativePath === ".hidden/secret.txt");
  expect(secret).toBeUndefined();
});

test("traverse: symlinks are emitted as leaf, not traversed", async () => {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
  await mkdir(`${DATA_DIR}/root/realdir`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/realdir/real.txt`, "real");
  await symlink(`${DATA_DIR}/root/realdir`, `${DATA_DIR}/root/linkdir`);
  await symlink(
    `${DATA_DIR}/root/realdir/real.txt`,
    `${DATA_DIR}/root/linkfile`,
  );

  const recs = await collect(`${DATA_DIR}/root`);

  const linkDir = recs.find((r) => r.node.relativePath === "linkdir");
  expect(linkDir?.event).toBe("leaf");
  expect(linkDir?.node.stat?.isSymbolicLink()).toBe(true);

  const linked = recs.find((r) => r.node.relativePath.startsWith("linkdir/"));
  expect(linked).toBeUndefined();

  const linkFile = recs.find((r) => r.node.relativePath === "linkfile");
  expect(linkFile?.event).toBe("leaf");
  expect(linkFile?.node.stat?.isSymbolicLink()).toBe(true);
});

test("traverse: pre and post reference same node object", async () => {
  await setup();
  const seen: { pre?: FileNode; post?: FileNode } = {};
  await traverse(`${DATA_DIR}/root`, (event, node) => {
    if (node.relativePath === "aaa") {
      if (event === "pre") seen.pre = node;
      if (event === "post") seen.post = node;
    }
  });
  expect(seen.pre === seen.post).toBe(true);
});
