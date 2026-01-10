import { assertEquals } from "@std/assert";
import { getMetadata } from "./epub.ts";

Deno.test("getMetadata returns stub metadata", () => {
  const meta = getMetadata("/fake/path.epub");
  assertEquals(meta.title, "Untitled");
  assertEquals(meta.author, "Unknown");
  assertEquals(meta.chapters.length, 0);
});
