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

try {
  const bytes = await Bun.file(path).arrayBuffer();
  const book = new Book(bytes, { replacements: "none" });
  await book.opened;
  const packaging = (book as {
    packaging?: {
      metadata?: { title?: unknown; creator?: unknown; pubdate?: unknown };
    };
  }).packaging;
  const metadata = {
    title: optional(packaging?.metadata?.title),
    creator: optional(packaging?.metadata?.creator),
    date: optionalDate(packaging?.metadata?.pubdate),
  };
  process.stdout.write(JSON.stringify({ ok: true, parserVersion, domParser, metadata }));
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
