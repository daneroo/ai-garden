import { assertEquals } from "@std/assert";
import { traverse } from "./traverse.ts";
import type { FileNode, TraversalEvent } from "./types.ts";

const DATA_DIR = new URL("../data/traverse-test", import.meta.url).pathname;

interface Recorded {
  event: TraversalEvent;
  node: FileNode;
}

function setup() {
  try {
    Deno.removeSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
  Deno.mkdirSync(`${DATA_DIR}/root/aaa`, { recursive: true });
  Deno.mkdirSync(`${DATA_DIR}/root/bbb`, { recursive: true });
  Deno.writeTextFileSync(`${DATA_DIR}/root/aaa/file1.txt`, "hello");
  Deno.writeTextFileSync(`${DATA_DIR}/root/bbb/file2.txt`, "world");
  Deno.writeTextFileSync(`${DATA_DIR}/root/top.txt`, "top");
}

function teardown() {
  try {
    Deno.removeSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
}

async function collect(rootPath: string): Promise<Recorded[]> {
  const records: Recorded[] = [];
  await traverse(
    rootPath,
    (event, node) => records.push({ event, node: { ...node } }),
  );
  return records;
}

Deno.test("traverse: emits pre and post for root", async () => {
  setup();
  try {
    const recs = await collect(`${DATA_DIR}/root`);
    const pre = recs.find((r) =>
      r.node.relativePath === "." && r.event === "pre"
    );
    const post = recs.find((r) =>
      r.node.relativePath === "." && r.event === "post"
    );
    assertEquals(pre?.node.stat?.isDirectory, true);
    assertEquals(post?.node.stat?.isDirectory, true);
  } finally {
    teardown();
  }
});

Deno.test("traverse: children appear between pre and post", async () => {
  setup();
  try {
    const recs = await collect(`${DATA_DIR}/root`);
    const aaaPre = recs.findIndex((r) =>
      r.node.relativePath === "aaa" && r.event === "pre"
    );
    const aaaPost = recs.findIndex((r) =>
      r.node.relativePath === "aaa" && r.event === "post"
    );
    const file1 = recs.findIndex((r) =>
      r.node.relativePath === "aaa/file1.txt"
    );

    assertEquals(aaaPre < file1, true);
    assertEquals(file1 < aaaPost, true);
  } finally {
    teardown();
  }
});

Deno.test("traverse: deterministic sort order by relative path", async () => {
  setup();
  try {
    const recs = await collect(`${DATA_DIR}/root`);
    const paths = recs
      .filter((r) => r.node.relativePath !== "." && r.event !== "post")
      .map((r) => r.node.relativePath);

    assertEquals(paths, [
      "aaa",
      "aaa/file1.txt",
      "bbb",
      "bbb/file2.txt",
      "top.txt",
    ]);
  } finally {
    teardown();
  }
});

Deno.test("traverse: files are leaf events", async () => {
  setup();
  try {
    const recs = await collect(`${DATA_DIR}/root`);
    const file = recs.find((r) => r.node.relativePath === "top.txt");
    assertEquals(file?.event, "leaf");
    assertEquals(file?.node.stat?.isFile, true);
  } finally {
    teardown();
  }
});

Deno.test("traverse: hidden directory is emitted as leaf, not recursed", async () => {
  try {
    Deno.removeSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
  Deno.mkdirSync(`${DATA_DIR}/root/.hidden`, { recursive: true });
  Deno.writeTextFileSync(`${DATA_DIR}/root/.hidden/secret.txt`, "nope");
  try {
    const recs = await collect(`${DATA_DIR}/root`);

    const hidden = recs.find((r) => r.node.relativePath === ".hidden");
    assertEquals(hidden?.event, "leaf");
    assertEquals(hidden?.node.basename.startsWith("."), true);
    assertEquals(hidden?.node.stat?.isDirectory, true);

    const secret = recs.find((r) =>
      r.node.relativePath === ".hidden/secret.txt"
    );
    assertEquals(secret, undefined);
  } finally {
    teardown();
  }
});

Deno.test("traverse: symlinks are emitted as leaf, not traversed", async () => {
  try {
    Deno.removeSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
  Deno.mkdirSync(`${DATA_DIR}/root/realdir`, { recursive: true });
  Deno.writeTextFileSync(`${DATA_DIR}/root/realdir/real.txt`, "real");
  Deno.symlinkSync(
    `${DATA_DIR}/root/realdir`,
    `${DATA_DIR}/root/linkdir`,
  );
  Deno.symlinkSync(
    `${DATA_DIR}/root/realdir/real.txt`,
    `${DATA_DIR}/root/linkfile`,
  );
  try {
    const recs = await collect(`${DATA_DIR}/root`);

    const linkDir = recs.find((r) => r.node.relativePath === "linkdir");
    assertEquals(linkDir?.event, "leaf");
    assertEquals(linkDir?.node.stat?.isSymlink, true);

    const linked = recs.find((r) => r.node.relativePath.startsWith("linkdir/"));
    assertEquals(linked, undefined);

    const linkFile = recs.find((r) => r.node.relativePath === "linkfile");
    assertEquals(linkFile?.event, "leaf");
    assertEquals(linkFile?.node.stat?.isSymlink, true);
  } finally {
    teardown();
  }
});

Deno.test("traverse: pre and post reference same node object", async () => {
  setup();
  try {
    const seen: { pre?: FileNode; post?: FileNode } = {};
    await traverse(`${DATA_DIR}/root`, (event, node) => {
      if (node.relativePath === "aaa") {
        if (event === "pre") seen.pre = node;
        if (event === "post") seen.post = node;
      }
    });
    assertEquals(seen.pre === seen.post, true);
  } finally {
    teardown();
  }
});
