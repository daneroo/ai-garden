import ePub from "@likecoin/epub-ts";

import { optional, optionalDate } from "../metadata-utils.ts";
import type { BrowserOpenOutcome, DeclaredVersion, MetadataFields } from "../types.ts";
import type { BrowserHarness } from "./protocol.ts";

const harness: BrowserHarness = {
  async transport(epubUrl) {
    const response = await fetch(epubUrl);
    if (!response.ok) {
      throw new Error(`EPUB fetch failed: ${response.status}`);
    }
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const open = await openBook(bytes);
    return {
      status: "transported",
      byteLength: bytes.byteLength,
      sha256: toHex(digest),
      epubtsVersion: ePub.VERSION,
      open,
    };
  },
};

globalThis.epubInspect = harness;

async function openBook(bytes: ArrayBuffer): Promise<BrowserOpenOutcome> {
  // Gate 3 is scoped to opening (container + package parse). Disabling resource
  // replacement keeps it there: with the default ("blobUrl" for archives),
  // epub.ts asynchronously builds cover/CSS blob URLs after `opened` resolves,
  // emitting console errors that race page teardown (non-deterministic) and
  // carry absolute bundle paths. "none" removes that side-effect entirely.
  const book = ePub(bytes, { replacements: "none" });
  try {
    await book.opened;
    return {
      status: "opened",
      version: declaredVersion(book),
      metadata: epubtsMetadata(book.packaging.metadata),
    };
  } catch (error) {
    return {
      status: "open-failed",
      stage: "browser-open",
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

function epubtsMetadata(metadata: {
  title?: unknown;
  creator?: unknown;
  pubdate?: unknown;
}): MetadataFields {
  return {
    title: optional(metadata.title),
    creator: optional(metadata.creator),
    date: optionalDate(metadata.pubdate),
  };
}



function declaredVersion(book: ReturnType<typeof ePub>): DeclaredVersion {
  const packaging = book.packaging as { version?: unknown } | undefined;
  return typeof packaging?.version === "string"
    ? { status: "exposed", value: packaging.version }
    : { status: "skipped" };
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}
