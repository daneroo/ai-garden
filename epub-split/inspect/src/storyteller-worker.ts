import { createHash } from "node:crypto";
import { Epub, EpubVersionError, MemoryAdapter, type NavigationItem } from "@storyteller-platform/epub";

import { optionalDate } from "./epubts-utils.ts";

type NormalizedTocItem = { label: string; href: string | null; subitems: NormalizedTocItem[] };

function normalizeToc(items: NavigationItem[]): NormalizedTocItem[] {
  return items.map((item) => ({
    label: item.title,
    href: item.href ?? null,
    subitems: normalizeToc(item.children ?? []),
  }));
}

// Worker: open exactly one EPUB via the Storyteller path and emit a single JSON
// line. Run as a subprocess so the parent can hard-kill any synchronous hang.
// Storyteller validates EPUB 3 only; EPUB 2 archives throw EpubVersionError and
// are mapped to { ok: "epub2-unsupported" } so the parent can emit the correct
// openStatus rather than treating version gating as a failure.
const path = process.argv[2];
if (!path) {
  process.stderr.write("usage: storyteller-worker <epub-path>\n");
  process.exit(2);
}

try {
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  const reader = await Epub.using(MemoryAdapter).from(bytes, { readonly: true });
  const entries = await reader.getMetadata();
  const values = (type: string) =>
    entries
      .filter((entry) => entry.type === type && typeof entry.value === "string")
      .map((entry) => entry.value as string);
  const metadata = {
    title: values("dc:title")[0] ?? null,
    creator: values("dc:creator")[0] ?? null,
    date: optionalDate(values("dc:date")[0]),
  };
  // getSpineItems() returns ManifestItem[] in reading order but does not expose
  // the OPF linear attribute — default true (safe for EPUB 3, which storyteller
  // exclusively handles).
  const spineItems = await reader.getSpineItems();
  const spine = spineItems.map((item) => ({ href: item.href, linear: true }));
  const manifestRecord = await reader.getManifest();
  const manifest = Object.values(manifestRecord)
    .map((item) => ({ id: item.id, href: item.href, mediaType: item.mediaType ?? null }))
    .sort((a, b) => a.id.localeCompare(b.id));
  const spineHashes = await Promise.all(
    spineItems.map(async (item) => {
      try {
        const content = await reader.readItemContents(item.id, "utf-8");
        const sha256 = createHash("sha256").update(content).digest("hex");
        return { href: item.href, sha256 };
      } catch {
        return { href: item.href, sha256: "<unreadable>" };
      }
    })
  );
  // resolveToRoot normalises all hrefs to epub-root-relative paths. Without it,
  // books whose nav document sits in a subdirectory (e.g. Text/nav.xhtml) get
  // absolute temp-dir paths for TOC entries — non-deterministic across runs.
  const tocNav = await reader.getTableOfContents({ resolveToRoot: true });
  const toc = normalizeToc(tocNav?.children ?? []);
  process.stdout.write(JSON.stringify({ ok: true, metadata, spine, manifest, spineHashes, toc }));
  await reader.discardAndClose();
} catch (error: unknown) {
  if (error instanceof EpubVersionError) {
    process.stdout.write(JSON.stringify({ ok: "epub2-unsupported" }));
  } else {
    process.stdout.write(
      JSON.stringify({
        ok: false,
        category: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
process.exit(0);
