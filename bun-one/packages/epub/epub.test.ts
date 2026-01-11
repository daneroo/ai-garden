import { describe, expect, test } from "bun:test";
import { getMetadata } from "./epub";

describe("epub", () => {
  test("getMetadata returns stub metadata", () => {
    const meta = getMetadata("/fake/path.epub");
    expect(meta.title).toBe("Untitled");
    expect(meta.author).toBe("Unknown");
    expect(meta.chapters.length).toBe(0);
  });
});
