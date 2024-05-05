import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

import { getTextNodes, parseHTML } from "./dom.ts";

Deno.test("Testing parseHTML", () => {
  const html = "<html><body><h1>Hello, world!</h1></body></html>";
  const doc = parseHTML(html);
  assertEquals(doc?.body.innerHTML.trim(), "<h1>Hello, world!</h1>");
});

Deno.test("Testing parseHTML - no body", () => {
  const html = "<p>paragraph 1</p><p>paragraph 2</p>";
  const doc = parseHTML(html);
  assertEquals(
    doc?.body.innerHTML.trim(),
    "<p>paragraph 1</p><p>paragraph 2</p>"
  );
});

Deno.test("Testing parseHTML - no top body", () => {
  const html = "<p>paragraph 1</p><p>paragraph 2</p>";
  const doc = parseHTML(html);
  if (!doc) {
    throw new Error("Failed to parse HTML");
  }
  assertEquals(
    doc.body.innerHTML.trim(),
    "<p>paragraph 1</p><p>paragraph 2</p>"
  );
});

Deno.test("Testing parseHTML - empty", () => {
  const html = "";
  const doc = parseHTML(html);
  assertEquals(doc?.body.innerHTML.trim(), "");
});

Deno.test("Testing set innerHTML", () => {
  const doc = parseHTML("");
  if (!doc) {
    throw new Error("Failed to parse HTML");
  }
  const html = "<p>paragraph 1</p><p>paragraph 2</p>";
  doc.body.innerHTML = html;
  assertEquals(
    doc.body.innerHTML.trim(),
    "<p>paragraph 1</p><p>paragraph 2</p>"
  );
  const texts = getTextNodes(doc);
  assertEquals(texts, ["paragraph 1", "paragraph 2"]);
});

Deno.test("Testing replace innerHTML", () => {
  const html = "<p>paragraph 1</p><p>paragraph 2</p>";
  const doc = parseHTML(html);
  if (!doc) {
    throw new Error("Failed to parse HTML");
  }
  assertEquals(
    doc.body.innerHTML.trim(),
    "<p>paragraph 1</p><p>paragraph 2</p>"
  );
  assertEquals(doc.body.childElementCount, 2);
  const secondPara = doc.body.children[1];
  secondPara.innerHTML = "new paragraph 2";
  assertEquals(doc.body.innerHTML, "<p>paragraph 1</p><p>new paragraph 2</p>");
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
