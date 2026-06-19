import ePub from "@likecoin/epub-ts";

import type { BrowserHarness } from "./protocol.ts";

const harness: BrowserHarness = {
  async transport(epubUrl) {
    const response = await fetch(epubUrl);
    if (!response.ok) {
      throw new Error(`EPUB fetch failed: ${response.status}`);
    }
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return {
      status: "transported",
      byteLength: bytes.byteLength,
      sha256: toHex(digest),
      epubtsVersion: ePub.VERSION,
    };
  },
};

globalThis.epubInspect = harness;

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}
