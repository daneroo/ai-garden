import { afterEach, expect, test } from "vitest";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { scan } from "./scan.ts";

const DATA_DIR = resolve(import.meta.dirname!, "../data/scan-test");

async function teardown() {
  await rm(DATA_DIR, { recursive: true }).catch(() => {});
}

afterEach(teardown);

test("scan produces one record per node and final dir state", async () => {
  await mkdir(`${DATA_DIR}/root/aaa`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/aaa/file1.txt`, "one");

  const records = await scan(`${DATA_DIR}/root`);

  const paths = records.map((r) => r.relativePath);
  expect(paths).toEqual(["aaa/file1.txt", "aaa", "."]);

  const aaa = records.find((r) => r.relativePath === "aaa");
  const root = records.find((r) => r.relativePath === ".");
  expect(aaa?.phase).toBe("dir-post");
  expect(aaa?.status).toBe("completed");
  expect(root?.phase).toBe("dir-post");
  expect(root?.status).toBe("completed");
});

test("scan fails fast on xattr collection failure", async () => {
  await mkdir(`${DATA_DIR}/root`, { recursive: true });
  await writeFile(`${DATA_DIR}/root/file.txt`, "x");

  await expect(
    scan(`${DATA_DIR}/root`, {
      collectXattrs: async (absPath) => {
        if (absPath.endsWith("file.txt")) {
          throw new Error("xattr failed");
        }
        return [];
      },
    }),
  ).rejects.toThrow("xattr failed");
});
