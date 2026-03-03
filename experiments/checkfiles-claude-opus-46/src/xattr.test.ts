import { test, expect, afterEach } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { checkXattrAvailable, getXattrNames, setXattr } from "./xattr.ts";

const DATA_DIR = resolve(import.meta.dirname!, "../data/xattr-test");

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

async function freshDir() {
  await teardown();
  await mkdir(DATA_DIR, { recursive: true });
}

afterEach(teardown);

test("xattr: checkXattrAvailable succeeds on macOS", async () => {
  // Should not throw — xattr is always available on macOS
  await checkXattrAvailable();
});

test("xattr: getXattrNames returns names for file with xattrs", async () => {
  await freshDir();
  const file = `${DATA_DIR}/test.txt`;
  await writeFile(file, "hello");
  await setXattr(file, "com.test.myattr", "myvalue");

  const names = await getXattrNames(file);
  expect(names.includes("com.test.myattr")).toBe(true);
});

test("xattr: getXattrNames returns multiple attrs sorted", async () => {
  await freshDir();
  const file = `${DATA_DIR}/multi.txt`;
  await writeFile(file, "hello");

  // Set multiple xattrs in non-sorted order
  for (const attr of ["com.test.zzz", "com.test.aaa", "com.test.mmm"]) {
    await setXattr(file, attr, "val");
  }

  const names = await getXattrNames(file);
  const testAttrs = names.filter((n) => n.startsWith("com.test."));
  expect(testAttrs).toEqual(["com.test.aaa", "com.test.mmm", "com.test.zzz"]);
});

test("xattr: getXattrNames returns empty or system-only for clean file", async () => {
  await freshDir();
  const file = `${DATA_DIR}/clean.txt`;
  await writeFile(file, "clean");

  const names = await getXattrNames(file);
  // Should have no com.test.* attrs; com.apple.provenance is filtered out
  const testAttrs = names.filter((n) => n.startsWith("com.test."));
  expect(testAttrs).toEqual([]);
});

test("xattr: setXattr writes an attribute that getXattrNames reads back", async () => {
  await freshDir();
  const file = `${DATA_DIR}/set.txt`;
  await writeFile(file, "set-test");
  await setXattr(file, "com.test.written", "hello");

  const names = await getXattrNames(file);
  expect(names).toContain("com.test.written");
});

test("xattr: setXattr rejects on nonexistent path", async () => {
  await expect(
    setXattr("/nonexistent/path/file.txt", "com.test.nope", "val"),
  ).rejects.toThrow();
});

test("xattr: getXattrNames throws on nonexistent path", async () => {
  await expect(getXattrNames("/nonexistent/path/file.txt")).rejects.toThrow();
});
