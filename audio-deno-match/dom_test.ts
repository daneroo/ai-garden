import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

import { getTextNodes, parseHTML } from "./dom.ts";

Deno.test("Testing parseHTML", () => {
  const html = "<html><body><h1>Hello, world!</h1></body></html>";
  const doc = parseHTML(html);
  assertEquals(doc?.body.innerHTML.trim(), "<h1>Hello, world!</h1>");
});

Deno.test("Testing getTextNodes", () => {
  const html =
    "<html><body><h1>Hello, world!</h1><p>This is a test.</p></body></html>";
  const doc = parseHTML(html);
  if (!doc) {
    throw new Error("Failed to parse HTML");
  }
  const texts = getTextNodes(doc);
  assertEquals(texts, ["Hello, world!", "This is a test."]);
});

Deno.test("Testing getTextNodes nested", () => {
  const html =
    "<html><body><h1>Hello, world!</h1><p>This is a <span>nested text node</span> test.</p></body></html>";
  const doc = parseHTML(html);
  if (!doc) {
    throw new Error("Failed to parse HTML");
  }
  const texts = getTextNodes(doc);
  assertEquals(texts, [
    "Hello, world!",
    "This is a",
    "nested text node",
    "test.",
  ]);
});
