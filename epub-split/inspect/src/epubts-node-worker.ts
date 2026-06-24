// Worker: open exactly one EPUB via the node path and emit a single JSON line.
// Run as a subprocess so the parent can hard-kill a synchronous DOM-parser hang
// that an in-process timer could never interrupt.
//
// argv[2] = epub path. argv[3] = domParser ("linkedom" default, or "jsdom").
// argv[4] = parserVersion (passed by the parent; avoids re-resolving the pkg).
// epub.ts parses through the global DOMParser, installing LinkeDOM's only when
// one is not already present. Setting globalThis.DOMParser to jsdom's before
// importing the node build therefore swaps the parser engine without forking
// epub.ts. LinkeDOM hangs on a few books; jsdom opens them.
import { createHash } from "node:crypto";

import { optional, optionalDate } from "./epubts-utils.ts";

const path = process.argv[2];
const domParser = process.argv[3] === "jsdom" ? "jsdom" : "linkedom";
const parserVersion = process.argv[4] ?? "unknown";

if (!path) {
  process.stderr.write("usage: epubts-node-worker <epub-path> [linkedom|jsdom] <parserVersion>\n");
  process.exit(2);
}

if (domParser === "jsdom") {
  const { JSDOM } = await import("jsdom");
  (globalThis as { DOMParser?: unknown }).DOMParser = new JSDOM("").window.DOMParser;
}

const { Book } = await import("@likecoin/epub-ts/node");

type RawNavItem = { label: string; href?: string; subitems?: RawNavItem[] };
type NormalizedTocItem = { label: string; href: string | null; subitems: NormalizedTocItem[] };

function normalizeToc(items: RawNavItem[]): NormalizedTocItem[] {
  return items.map((item) => ({
    label: item.label,
    href: item.href ?? null,
    subitems: normalizeToc(item.subitems ?? []),
  }));
}

try {
  const bytes = await Bun.file(path).arrayBuffer();
  const book = new Book(bytes, { replacements: "none" });
  await book.opened;
  const bookAny = book as {
    packaging?: {
      metadata?: { title?: unknown; creator?: unknown; pubdate?: unknown };
      spine?: Array<{ idref: string; linear: string }>;
      manifest?: Record<string, { href: string; type?: string }>;
    };
    archive?: { getText(url: string): Promise<string> | undefined };
    path?: { directory: string; resolve(href: string): string };
    navigation?: { toc: Array<{ label: string; href: string; subitems?: unknown[] }> };
  };
  const packaging = bookAny.packaging;
  const metadata = {
    title: optional(packaging?.metadata?.title),
    creator: optional(packaging?.metadata?.creator),
    date: optionalDate(packaging?.metadata?.pubdate),
  };
  const spine = (packaging?.spine ?? []).map((item) => ({
    href: packaging?.manifest?.[item.idref]?.href ?? item.idref,
    linear: item.linear !== "no",
  }));
  const manifest = Object.entries(packaging?.manifest ?? {})
    .map(([id, item]) => ({ id, href: item.href, mediaType: item.type ?? null }))
    .sort((a, b) => a.id.localeCompare(b.id));
  // book.path.resolve(href) uses epub-ts's own path resolver which always
  // produces an absolute "/" -prefixed result (it anchors to "/" when no
  // absolute segment is found). archive.getText strips the leading "/" via
  // substr(1) to get the zip entry path. Using resolve() handles both root-OPF
  // and OEBPS-layout epubs, and correctly normalises any "../" hrefs.
  const spineHashes = await Promise.all(
    spine.map(async (item) => {
      const archiveUrl = bookAny.path?.resolve(item.href) ?? ("/" + item.href);
      const content = await bookAny.archive?.getText(archiveUrl);
      const sha256 = content != null
        ? createHash("sha256").update(content).digest("hex")
        : "<unreadable>";
      return { href: item.href, sha256 };
    })
  );
  const toc = normalizeToc(bookAny.navigation?.toc ?? []);
  process.stdout.write(JSON.stringify({ ok: true, parserVersion, domParser, metadata, spine, manifest, spineHashes, toc }));
  book.destroy();
} catch (error: unknown) {
  process.stdout.write(
    JSON.stringify({
      ok: false,
      category: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    })
  );
}
process.exit(0);
