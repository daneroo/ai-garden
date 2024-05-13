import {
  DOMParser,
  type HTMLDocument,
  Node,
} from 'https://deno.land/x/deno_dom@v0.1.45/deno-dom-wasm.ts';

export type { HTMLDocument };
// This returns an HTMLDocument object
// I have not been able to create an example string, even null, that would cause this to return null
// So I will throw an error if it does, but assume it never will.
export function parseHTML(html: string): HTMLDocument {
  const htmlDoc = new DOMParser().parseFromString(html, "text/html");
  if (!htmlDoc) {
    throw new Error("Failed to parse HTML (should not happen)");
  }
  return htmlDoc;
}

export function getTextNodes(node: Node): string[] {
  let texts: string[] = [];
  if (node.nodeType === Node.TEXT_NODE) {
    const trimmed = node.textContent.trim();
    if (trimmed) {
      texts.push(trimmed);
    }
  }
  for (const child of node.childNodes) {
    texts = texts.concat(getTextNodes(child));
  }
  return texts;
}
