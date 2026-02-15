import { describe, expect, test, vi, beforeAll, afterAll } from "vitest";
import { scanLibrary } from "./scanner";
import fs from "node:fs";
import path from "node:path";

// Mock metadata fetcher
vi.mock("./metadata", () => ({
  getAudioMetadata: vi.fn(async (_filePath: string) => ({
    duration: 120,
    bitrate: 64000,
    codec: "aac",
    title: "Test Book",
    artist: "Test Author",
    fileSize: 1024,
  })),
}));

const TEST_ROOT = path.join(process.cwd(), "test_library");

describe("Scanner", () => {
  beforeAll(() => {
    // Setup test directory structure
    if (fs.existsSync(TEST_ROOT))
      fs.rmSync(TEST_ROOT, { recursive: true, force: true });
    fs.mkdirSync(TEST_ROOT);

    // Case 1: Valid Full Book (Audio + Cover + Epub)
    const fullBookDir = path.join(TEST_ROOT, "Full Book");
    fs.mkdirSync(fullBookDir);
    fs.writeFileSync(path.join(fullBookDir, "book.m4b"), "fake audio content");
    fs.writeFileSync(path.join(fullBookDir, "book.epub"), "fake epub content");
    fs.writeFileSync(path.join(fullBookDir, "cover.jpg"), "fake cover");

    // Case 2: Valid Audio Book (Audio + Cover)
    const audioBookDir = path.join(TEST_ROOT, "Audio Book");
    fs.mkdirSync(audioBookDir);
    fs.writeFileSync(path.join(audioBookDir, "audio.m4b"), "fake audio");
    fs.writeFileSync(path.join(audioBookDir, "cover.png"), "fake cover");

    // Case 3: Invalid (Audio Only, No Cover)
    const invalidAudioDir = path.join(TEST_ROOT, "Invalid Audio");
    fs.mkdirSync(invalidAudioDir);
    fs.writeFileSync(path.join(invalidAudioDir, "audio.m4b"), "fake audio");

    // Case 4: Invalid (Epub Only)
    const epubOnlyDir = path.join(TEST_ROOT, "Epub Only");
    fs.mkdirSync(epubOnlyDir);
    fs.writeFileSync(path.join(epubOnlyDir, "book.epub"), "fake epub");

    // Case 5: Nested Valid Book
    const nestedDir = path.join(TEST_ROOT, "Category", "Nested Book");
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(nestedDir, "nested.m4b"), "fake audio");
    fs.writeFileSync(path.join(nestedDir, "cover.jpg"), "fake cover");
  });

  afterAll(() => {
    fs.rmSync(TEST_ROOT, { recursive: true, force: true });
  });

  test("scans library and groups valid books (m4b + cover required)", async () => {
    const result = await scanLibrary(TEST_ROOT);

    expect(result.errors).toHaveLength(0);
    expect(result.books).toHaveLength(3); // Full Book, Audio Book, Nested Book

    // Check Full Book
    const fullBook = result.books.find((b) => b.dirPath === "Full Book");
    expect(fullBook).toBeDefined();
    expect(fullBook?.epubFile).toBeDefined();
    expect(fullBook?.coverPath).toBe("Full Book/cover.jpg");

    // Check Audio Book
    const audioBook = result.books.find((b) => b.dirPath === "Audio Book");
    expect(audioBook).toBeDefined();
    expect(audioBook?.epubFile).toBeUndefined();
    expect(audioBook?.coverPath).toBe("Audio Book/cover.png");

    // Check Invalid
    const invalidBook = result.books.find((b) => b.dirPath === "Invalid Audio");
    expect(invalidBook).toBeUndefined();

    // Check Nested
    const nestedBook = result.books.find(
      (b) => b.dirPath === "Category/Nested Book",
    );
    expect(nestedBook).toBeDefined();
  });
});
