import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { assertAlgorithm, hashFile } from "../src/hash";

const fixturePath = resolve(
  __dirname,
  "fixtures",
  "hello.txt",
);

test("hashFile computes sha256", async () => {
  const digest = await hashFile(fixturePath, "sha256");

  expect(digest).toBe(
    "a948904f2f0f479b8f8197694b30184b0d2ed1c1cd2a1ec0fb85d299a192a447",
  );
});

test("hashFile computes sha1", async () => {
  const digest = await hashFile(fixturePath, "sha1");

  expect(digest).toBe("22596363b3de40b06f981fb85d82312e8c0ed511");
});

test("assertAlgorithm rejects unsupported values", () => {
  expect(() => assertAlgorithm("md5")).toThrow("Unsupported algorithm");
});
