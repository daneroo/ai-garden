import { test, expect, afterEach } from "vitest";
import { mkdir, rm, writeFile, chmod, symlink } from "node:fs/promises";
import { resolve } from "node:path";
import { validate } from "./validate.ts";
import { traverse } from "./traverse.ts";
import type { FileNode } from "./types.ts";
import type { Stats } from "node:fs";

const DATA_DIR = resolve(import.meta.dirname!, "../data/validate-test");

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

async function freshDir() {
  await teardown();
  await mkdir(`${DATA_DIR}/root`, { recursive: true });
}

afterEach(teardown);

async function collectNodes(rootPath: string): Promise<FileNode[]> {
  const nodes: FileNode[] = [];
  await traverse(rootPath, (event, node) => {
    // Collect leaf events and dir-post (completed nodes)
    if (event === "leaf" || event === "post") {
      nodes.push(node);
    }
  });
  return nodes;
}

test("validate: file with mode 0644 has no violations", async () => {
  await freshDir();
  await writeFile(`${DATA_DIR}/root/good.txt`, "ok");
  await chmod(`${DATA_DIR}/root/good.txt`, 0o644);
  const nodes = await collectNodes(`${DATA_DIR}/root`);
  const file = nodes.find((n) => n.relativePath === "good.txt")!;
  expect(validate(file)).toEqual([]);
});

test("validate: file with wrong mode is a violation", async () => {
  await freshDir();
  await writeFile(`${DATA_DIR}/root/bad.txt`, "ok");
  await chmod(`${DATA_DIR}/root/bad.txt`, 0o600);
  const nodes = await collectNodes(`${DATA_DIR}/root`);
  const file = nodes.find((n) => n.relativePath === "bad.txt")!;
  const v = validate(file);
  expect(v.length).toBe(1);
  expect(v[0]).toContain("mode 600");
  expect(v[0]).toContain("expected 644");
});

test("validate: directory with mode 0755 has no violations", async () => {
  await freshDir();
  await mkdir(`${DATA_DIR}/root/gooddir`);
  await chmod(`${DATA_DIR}/root/gooddir`, 0o755);
  const nodes = await collectNodes(`${DATA_DIR}/root`);
  const dir = nodes.find((n) => n.relativePath === "gooddir")!;
  expect(validate(dir)).toEqual([]);
});

test("validate: directory with wrong mode is a violation", async () => {
  await freshDir();
  await mkdir(`${DATA_DIR}/root/baddir`);
  await chmod(`${DATA_DIR}/root/baddir`, 0o700);
  const nodes = await collectNodes(`${DATA_DIR}/root`);
  const dir = nodes.find((n) => n.relativePath === "baddir")!;
  const v = validate(dir);
  expect(v.length).toBe(1);
  expect(v[0]).toContain("mode 700");
  expect(v[0]).toContain("expected 755");
});

test("validate: hidden entry is a violation", async () => {
  await freshDir();
  await writeFile(`${DATA_DIR}/root/.secret`, "hidden");
  const nodes = await collectNodes(`${DATA_DIR}/root`);
  const hidden = nodes.find((n) => n.relativePath === ".secret")!;
  const v = validate(hidden);
  expect(v).toContain("hidden entry");
});

test("validate: root directory is not flagged as hidden", async () => {
  await freshDir();
  const nodes = await collectNodes(`${DATA_DIR}/root`);
  const root = nodes.find((n) => n.relativePath === ".")!;
  const v = validate(root);
  expect(v).not.toContain("hidden entry");
});

test("validate: symlink is a violation", async () => {
  await freshDir();
  await writeFile(`${DATA_DIR}/root/real.txt`, "real");
  await symlink(`${DATA_DIR}/root/real.txt`, `${DATA_DIR}/root/link.txt`);
  const nodes = await collectNodes(`${DATA_DIR}/root`);
  const link = nodes.find((n) => n.relativePath === "link.txt")!;
  const v = validate(link);
  expect(v).toContain("symlink");
});

test("validate: node with xattrs is a violation", () => {
  // Unit test with synthetic node — no filesystem needed
  const node: FileNode = {
    relativePath: "test.txt",
    basename: "test.txt",
    stat: {
      isFile: () => true,
      isDirectory: () => false,
      isSymbolicLink: () => false,
      mode: 0o100644,
      mtime: new Date(),
    } as unknown as Stats,
    xattrs: ["com.apple.quarantine"],
  };
  const v = validate(node);
  expect(v.length).toBe(1);
  expect(v[0]).toContain("has xattrs");
  expect(v[0]).toContain("com.apple.quarantine");
});

test("validate: multiple violations accumulate", () => {
  const node: FileNode = {
    relativePath: ".hidden-link",
    basename: ".hidden-link",
    stat: {
      isFile: () => false,
      isDirectory: () => false,
      isSymbolicLink: () => true,
      mode: 0o120755,
      mtime: new Date(),
    } as unknown as Stats,
    xattrs: ["com.apple.something"],
  };
  const v = validate(node);
  expect(v).toContain("hidden entry");
  expect(v).toContain("symlink");
  expect(v.some((s) => s.includes("has xattrs"))).toBe(true);
});
