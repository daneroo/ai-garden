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
    const pkg = book.packaging as {
      metadata: { title?: unknown; creator?: unknown; pubdate?: unknown };
      spine?: Array<{ idref: string; linear: string }>;
      manifest?: Record<string, { href: string; type?: string }>;
    };
    const spine = (pkg.spine ?? []).map((item) => ({
      href: pkg.manifest?.[item.idref]?.href ?? item.idref,
      linear: item.linear !== "no",
    }));
    const manifest = Object.entries(pkg.manifest ?? {})
      .map(([id, item]) => ({ id, href: item.href, mediaType: item.type ?? null }))
      .sort((a, b) => a.id.localeCompare(b.id));
    return {
      status: "opened",
      metadata: {
        title: optional(pkg.metadata.title),
        creator: optional(pkg.metadata.creator),
        date: optionalDate(pkg.metadata.pubdate),
      },
      spine,
      manifest,
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
