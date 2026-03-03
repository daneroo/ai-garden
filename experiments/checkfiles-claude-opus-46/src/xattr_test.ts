import { assertEquals } from "@std/assert";
import { checkXattrAvailable, getXattrNames } from "./xattr.ts";

const DATA_DIR = new URL("../data/xattr-test", import.meta.url).pathname;

function teardown() {
  try {
    Deno.removeSync(DATA_DIR, { recursive: true });
  } catch { /* ignore */ }
}

function freshDir() {
  teardown();
  Deno.mkdirSync(DATA_DIR, { recursive: true });
}

Deno.test("xattr: checkXattrAvailable succeeds on macOS", async () => {
  // Should not throw — xattr is always available on macOS
  await checkXattrAvailable();
});

Deno.test("xattr: getXattrNames returns names for file with xattrs", async () => {
  freshDir();
  try {
    const file = `${DATA_DIR}/test.txt`;
    Deno.writeTextFileSync(file, "hello");

    // Set a test xattr
    const set = new Deno.Command("xattr", {
      args: ["-w", "com.test.myattr", "myvalue", file],
    });
    await set.output();

    const names = await getXattrNames(file);
    assertEquals(names.includes("com.test.myattr"), true);
  } finally {
    teardown();
  }
});

Deno.test("xattr: getXattrNames returns multiple attrs sorted", async () => {
  freshDir();
  try {
    const file = `${DATA_DIR}/multi.txt`;
    Deno.writeTextFileSync(file, "hello");

    // Set multiple xattrs in non-sorted order
    for (const attr of ["com.test.zzz", "com.test.aaa", "com.test.mmm"]) {
      const set = new Deno.Command("xattr", {
        args: ["-w", attr, "val", file],
      });
      await set.output();
    }

    const names = await getXattrNames(file);
    const testAttrs = names.filter((n) => n.startsWith("com.test."));
    assertEquals(testAttrs, ["com.test.aaa", "com.test.mmm", "com.test.zzz"]);
  } finally {
    teardown();
  }
});

Deno.test("xattr: getXattrNames returns empty or system-only for clean file", async () => {
  freshDir();
  try {
    const file = `${DATA_DIR}/clean.txt`;
    Deno.writeTextFileSync(file, "clean");

    const names = await getXattrNames(file);
    // Should have no com.test.* attrs; may have com.apple.provenance (sticky)
    const testAttrs = names.filter((n) => n.startsWith("com.test."));
    assertEquals(testAttrs, []);
  } finally {
    teardown();
  }
});

Deno.test("xattr: getXattrNames returns empty array for nonexistent path", async () => {
  const names = await getXattrNames("/nonexistent/path/file.txt");
  assertEquals(names, []);
});
