import { assertEquals } from 'https://deno.land/std@0.106.0/testing/asserts.ts';

import {
  getTextNodes,
  parseHTML,
} from './dom.ts';

Deno.test("Testing parseHTML", () => {
  const html = "<html><body><h1>Hello, world!</h1></body></html>";
  const doc = parseHTML(html);
  assertEquals(doc?.body.innerHTML.trim(), "<h1>Hello, world!</h1>");
});

Deno.test("Testing parseHTML - malformed - so forgiving", () => {
  // Even malformed html is parsed
  // I have not been able to create an example string, even null, that would cause this to return null
  const html = "<div>some good</div></div><div>some bad</div>";
  const doc = parseHTML(html);
  assertEquals(
    doc?.body.innerHTML.trim(),
    "<div>some good</div><div>some bad</div>"
  );
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
  assertEquals(
    doc.body.innerHTML.trim(),
    "<p>paragraph 1</p><p>paragraph 2</p>"
  );
  assertEquals(doc.body.childElementCount, 2);
  const secondPara = doc.body.children[1];
  secondPara.innerHTML = "new paragraph 2";
  assertEquals(doc.body.innerHTML, "<p>paragraph 1</p><p>new paragraph 2</p>");
});

Deno.test("Testing construct body by appending", () => {
  const doc = parseHTML("");
  const h1 = doc.createElement("h1");
  h1.textContent = "Hello, world!";
  doc.body.appendChild(h1);
  const div1 = doc.createElement("div");
  div1.innerHTML = "<p>paragraph 1 with <em>emphasis</em></p>";
  doc.body.appendChild(div1);
  assertEquals(
    doc.body.innerHTML,
    "<h1>Hello, world!</h1><div><p>paragraph 1 with <em>emphasis</em></p></div>"
  );
});

Deno.test("Testing getTextNodes nested", () => {
  const html =
    "<html><body><h1>Hello, world!</h1><p>This is a <span>nested text node</span> test.</p></body></html>";
  const doc = parseHTML(html);
  const texts = getTextNodes(doc);
  assertEquals(texts, [
    "Hello, world!",
    "This is a",
    "nested text node",
    "test.",
  ]);
});
