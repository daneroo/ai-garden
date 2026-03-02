import { assertEquals } from "@std/assert";
import { validate } from "./validate.ts";
import { traverse } from "./traverse.ts";
import type { FileNode } from "./types.ts";

const DATA_DIR = new URL("../data/validate-test", import.meta.url).pathname;

function teardown() {
  try {
    Deno.removeSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
}

function freshDir() {
  teardown();
  Deno.mkdirSync(`${DATA_DIR}/root`, { recursive: true });
}

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

Deno.test("validate: file with mode 0644 has no violations", async () => {
  freshDir();
  try {
    Deno.writeTextFileSync(`${DATA_DIR}/root/good.txt`, "ok");
    Deno.chmodSync(`${DATA_DIR}/root/good.txt`, 0o644);
    const nodes = await collectNodes(`${DATA_DIR}/root`);
    const file = nodes.find((n) => n.relativePath === "good.txt")!;
    assertEquals(validate(file), []);
  } finally {
    teardown();
  }
});

Deno.test("validate: file with wrong mode is a violation", async () => {
  freshDir();
  try {
    Deno.writeTextFileSync(`${DATA_DIR}/root/bad.txt`, "ok");
    Deno.chmodSync(`${DATA_DIR}/root/bad.txt`, 0o600);
    const nodes = await collectNodes(`${DATA_DIR}/root`);
    const file = nodes.find((n) => n.relativePath === "bad.txt")!;
    const v = validate(file);
    assertEquals(v.length, 1);
    assertEquals(v[0].includes("mode 600"), true);
    assertEquals(v[0].includes("expected 644"), true);
  } finally {
    teardown();
  }
});

Deno.test("validate: directory with mode 0755 has no violations", async () => {
  freshDir();
  try {
    Deno.mkdirSync(`${DATA_DIR}/root/gooddir`);
    Deno.chmodSync(`${DATA_DIR}/root/gooddir`, 0o755);
    const nodes = await collectNodes(`${DATA_DIR}/root`);
    const dir = nodes.find((n) => n.relativePath === "gooddir")!;
    assertEquals(validate(dir), []);
  } finally {
    teardown();
  }
});

Deno.test("validate: directory with wrong mode is a violation", async () => {
  freshDir();
  try {
    Deno.mkdirSync(`${DATA_DIR}/root/baddir`);
    Deno.chmodSync(`${DATA_DIR}/root/baddir`, 0o700);
    const nodes = await collectNodes(`${DATA_DIR}/root`);
    const dir = nodes.find((n) => n.relativePath === "baddir")!;
    const v = validate(dir);
    assertEquals(v.length, 1);
    assertEquals(v[0].includes("mode 700"), true);
    assertEquals(v[0].includes("expected 755"), true);
  } finally {
    teardown();
  }
});

Deno.test("validate: hidden entry is a violation", async () => {
  freshDir();
  try {
    Deno.writeTextFileSync(`${DATA_DIR}/root/.secret`, "hidden");
    const nodes = await collectNodes(`${DATA_DIR}/root`);
    const hidden = nodes.find((n) => n.relativePath === ".secret")!;
    const v = validate(hidden);
    assertEquals(v.includes("hidden entry"), true);
  } finally {
    teardown();
  }
});

Deno.test("validate: root directory is not flagged as hidden", async () => {
  freshDir();
  try {
    const nodes = await collectNodes(`${DATA_DIR}/root`);
    const root = nodes.find((n) => n.relativePath === ".")!;
    const v = validate(root);
    assertEquals(v.includes("hidden entry"), false);
  } finally {
    teardown();
  }
});

Deno.test("validate: symlink is a violation", async () => {
  freshDir();
  try {
    Deno.writeTextFileSync(`${DATA_DIR}/root/real.txt`, "real");
    Deno.symlinkSync(
      `${DATA_DIR}/root/real.txt`,
      `${DATA_DIR}/root/link.txt`,
    );
    const nodes = await collectNodes(`${DATA_DIR}/root`);
    const link = nodes.find((n) => n.relativePath === "link.txt")!;
    const v = validate(link);
    assertEquals(v.includes("symlink"), true);
  } finally {
    teardown();
  }
});

Deno.test("validate: node with xattrs is a violation", () => {
  // Unit test with synthetic node — no filesystem needed
  const node: FileNode = {
    relativePath: "test.txt",
    basename: "test.txt",
    stat: {
      isFile: true,
      isDirectory: false,
      isSymlink: false,
      mode: 0o100644,
      mtime: new Date(),
    } as Deno.FileInfo,
    xattrs: ["com.apple.quarantine"],
  };
  const v = validate(node);
  assertEquals(v.length, 1);
  assertEquals(v[0].includes("has xattrs"), true);
  assertEquals(v[0].includes("com.apple.quarantine"), true);
});

Deno.test("validate: multiple violations accumulate", () => {
  const node: FileNode = {
    relativePath: ".hidden-link",
    basename: ".hidden-link",
    stat: {
      isFile: false,
      isDirectory: false,
      isSymlink: true,
      mode: 0o120755,
      mtime: new Date(),
    } as Deno.FileInfo,
    xattrs: ["com.apple.something"],
  };
  const v = validate(node);
  assertEquals(v.includes("hidden entry"), true);
  assertEquals(v.includes("symlink"), true);
  assertEquals(v.some((s) => s.includes("has xattrs")), true);
});
