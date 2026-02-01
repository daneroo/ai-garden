import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { scanDirectory } from "./scanner.ts";

let testDir: string;

beforeAll(async () => {
  testDir = await mkdtemp(join(tmpdir(), "booktui-test-"));

  // Create directory structure
  await mkdir(join(testDir, "fiction"), { recursive: true });
  await mkdir(join(testDir, "fiction", "nested"), { recursive: true });
  await mkdir(join(testDir, ".hidden"), { recursive: true });

  // Audio files
  await writeFile(join(testDir, "book-a.m4b"), "fake-audio-content");
  await writeFile(join(testDir, "fiction", "book-b.mp3"), "fake-mp3");
  await writeFile(join(testDir, "fiction", "nested", "book-c.m4b"), "fake-nested");

  // Non-audio files (should be skipped)
  await writeFile(join(testDir, "readme.txt"), "not audio");
  await writeFile(join(testDir, "cover.jpg"), "not audio");

  // Hidden directory content (should be skipped)
  await writeFile(join(testDir, ".hidden", "secret.mp3"), "hidden audio");

  // Hidden file (should be skipped)
  await writeFile(join(testDir, ".dotfile.mp3"), "hidden file");
});

afterAll(async () => {
  await rm(testDir, { recursive: true, force: true });
});

describe("scanDirectory", () => {
  it("finds .m4b and .mp3 files recursively", async () => {
    const results = await scanDirectory(testDir);
    expect(results).toHaveLength(3);
  });

  it("returns relative paths", async () => {
    const results = await scanDirectory(testDir);
    const paths = results.map((f) => f.relativePath);
    expect(paths).toContain("book-a.m4b");
    expect(paths).toContain("fiction/book-b.mp3");
    expect(paths).toContain("fiction/nested/book-c.m4b");
  });

  it("sorts results by relative path ascending", async () => {
    const results = await scanDirectory(testDir);
    const paths = results.map((f) => f.relativePath);
    expect(paths).toEqual([...paths].sort());
  });

  it("skips hidden directories", async () => {
    const results = await scanDirectory(testDir);
    const paths = results.map((f) => f.relativePath);
    expect(paths.some((p) => p.includes(".hidden"))).toBe(false);
  });

  it("skips hidden files", async () => {
    const results = await scanDirectory(testDir);
    const paths = results.map((f) => f.relativePath);
    expect(paths.some((p) => p.includes(".dotfile"))).toBe(false);
  });

  it("skips non-audio files", async () => {
    const results = await scanDirectory(testDir);
    const paths = results.map((f) => f.relativePath);
    expect(paths.some((p) => p.endsWith(".txt"))).toBe(false);
    expect(paths.some((p) => p.endsWith(".jpg"))).toBe(false);
  });

  it("includes file size", async () => {
    const results = await scanDirectory(testDir);
    for (const f of results) {
      expect(f.size).toBeGreaterThan(0);
    }
  });

  it("returns empty array for directory with no audio files", async () => {
    const emptyDir = await mkdtemp(join(tmpdir(), "booktui-empty-"));
    const results = await scanDirectory(emptyDir);
    expect(results).toHaveLength(0);
    await rm(emptyDir, { recursive: true, force: true });
  });

  it("handles non-existent directory gracefully", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const results = await scanDirectory(join(testDir, "does-not-exist"));
    expect(results).toHaveLength(0);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
