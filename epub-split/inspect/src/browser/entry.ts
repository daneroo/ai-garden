import ePub from "@likecoin/epub-ts";

import { optional, optionalDate } from "../epubts-utils.ts";
import type { BrowserHarness, EntryOpenOutcome } from "./protocol.ts";

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
      open: await openBook(bytes),
    };
  },
};

globalThis.epubInspect = harness;

async function openBook(bytes: ArrayBuffer): Promise<EntryOpenOutcome> {
  const book = ePub(bytes, { replacements: "none" });
  try {
    await book.opened;
    return {
      status: "opened",
      metadata: {
        title: optional(book.packaging.metadata.title),
        creator: optional(book.packaging.metadata.creator),
        date: optionalDate(book.packaging.metadata.pubdate),
      },
    };
  } catch (error) {
    return {
      status: "open-failed",
      category: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    try {
      book.destroy();
    } catch {
      // Teardown is best-effort; a destroy failure must not mask the outcome.
    }
  }
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}
