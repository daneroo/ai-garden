import { afterEach, expect, test } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { checkXattrAvailable, getXattrNames, setXattr } from "./xattr.ts";

const DATA_DIR = resolve(import.meta.dirname!, "../data/xattr-test");

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

afterEach(teardown);

test("checkXattrAvailable succeeds", async () => {
  await checkXattrAvailable();
});

test("getXattrNames returns sorted names", async () => {
  await mkdir(DATA_DIR, { recursive: true });
  const file = `${DATA_DIR}/multi.txt`;
  await writeFile(file, "x");

  await setXattr(file, "com.test.zzz", "1");
  await setXattr(file, "com.test.aaa", "1");
  await setXattr(file, "com.test.mmm", "1");

  const names = await getXattrNames(file);
  expect(names.filter((name) => name.startsWith("com.test."))).toEqual([
    "com.test.aaa",
    "com.test.mmm",
    "com.test.zzz",
  ]);
});

test("getXattrNames throws on missing path", async () => {
  await expect(getXattrNames(`${DATA_DIR}/missing.txt`)).rejects.toThrow();
});
