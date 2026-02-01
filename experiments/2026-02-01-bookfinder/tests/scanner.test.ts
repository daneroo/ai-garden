import { describe, expect, it } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { scanForAudioFiles } from "../src/scanner";

describe("scanForAudioFiles", () => {
  it("finds mp3/m4b and skips hidden", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "bookfinder-"));
    try {
      await fs.writeFile(path.join(root, "visible.mp3"), "");
      await fs.writeFile(path.join(root, "ignore.txt"), "");
      await fs.mkdir(path.join(root, "sub"));
      await fs.writeFile(path.join(root, "sub", "book.m4b"), "");

      await fs.mkdir(path.join(root, ".hidden"));
      await fs.writeFile(path.join(root, ".hidden", "skip.mp3"), "");
      await fs.writeFile(path.join(root, ".skip.m4b"), "");

      const files = await scanForAudioFiles(root);
      const rel = files.map((f) => f.relPath).sort();

      expect(rel).toEqual(["sub/book.m4b", "visible.mp3"]);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  });
});
