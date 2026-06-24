import { Epub, MemoryAdapter } from "@storyteller-platform/epub";

import { optionalDate } from "./epubts-utils.ts";

// Worker: open exactly one EPUB via the Storyteller path and emit a single JSON
// line. Run as a subprocess so the parent can hard-kill any synchronous hang,
// matching the epubts-node worker. The in-memory read-only adapter opens the
// archive without unpacking it to disk; Storyteller validates EPUB 3, so an
// EPUB 2 archive surfaces as an EpubVersionError open failure.
const path = process.argv[2];
if (!path) {
  process.stderr.write("usage: storyteller-worker <epub-path>\n");
  process.exit(2);
}

try {
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  const reader = await Epub.using(MemoryAdapter).from(bytes, { readonly: true });
  const declared = await reader.getVersion();
  const version =
    typeof declared === "string"
      ? { status: "exposed", value: declared }
      : { status: "skipped" };
  const entries = await reader.getMetadata();
  const values = (type: string) => entries
    .filter((entry) => entry.type === type && typeof entry.value === "string")
    .map((entry) => entry.value as string);
  const metadata = {
    title: values("dc:title")[0] ?? null,
    creator: values("dc:creator")[0] ?? null,
    date: optionalDate(values("dc:date")[0]),
  };
  process.stdout.write(JSON.stringify({ ok: true, version, metadata }));
  await reader.discardAndClose();
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
