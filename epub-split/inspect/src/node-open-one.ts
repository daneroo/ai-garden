import { Book } from "@likecoin/epub-ts/node";

// Worker: open exactly one EPUB via the node path and emit a single JSON line.
// Run as a subprocess so the parent can hard-kill a synchronous LinkeDOM hang
// that an in-process timer could never interrupt.
const path = process.argv[2];
if (!path) {
  process.stderr.write("usage: node-open-one <epub-path>\n");
  process.exit(2);
}

try {
  const bytes = await Bun.file(path).arrayBuffer();
  const book = new Book(bytes, { replacements: "none" });
  await book.opened;
  const packaging = (book as { packaging?: { version?: unknown } }).packaging;
  const version =
    typeof packaging?.version === "string"
      ? { status: "exposed", value: packaging.version }
      : { status: "skipped" };
  process.stdout.write(JSON.stringify({ ok: true, version }));
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
