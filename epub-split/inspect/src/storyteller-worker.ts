import { Epub, EpubVersionError, MemoryAdapter } from "@storyteller-platform/epub";

import { optionalDate } from "./epubts-utils.ts";

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
  process.stdout.write(JSON.stringify({ ok: true, metadata, spine, manifest }));
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
