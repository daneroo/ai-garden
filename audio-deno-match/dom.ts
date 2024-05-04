import {
  DOMParser,
  Node,
} from "https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts";

export function parseHTML(html: string) {
  return new DOMParser().parseFromString(html, "text/html");
}

export function getTextNodes(node: Node): string[] {
  let texts: string[] = [];
  if (node.nodeType === Node.TEXT_NODE) {
    texts.push(node.textContent.trim());
  }
  for (const child of node.childNodes) {
    texts = texts.concat(getTextNodes(child));
  }
  return texts;
}
