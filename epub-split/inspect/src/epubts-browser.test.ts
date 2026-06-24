import { createHash } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { BrowserTransport } from "./epubts-browser.ts";

const FIXTURES = resolve(import.meta.dir, "../test/fixtures");
const TEST_BOOKS = resolve(import.meta.dir, "../../test-books");

async function bookInfo(
  absolutePath: string,
): Promise<{ sha256: string; size: number }> {
  const bytes = await Bun.file(absolutePath).arrayBuffer();
  const sha256 = createHash("sha256").update(Buffer.from(bytes)).digest("hex");
  return { sha256, size: bytes.byteLength };
}

describe("BrowserTransport.open", () => {
  let transport: BrowserTransport;

  beforeAll(async () => {
    transport = await BrowserTransport.launch();
  }, 60_000);

  afterAll(async () => {
    await transport.close();
  }, 5_000);

  test(
    "opens a committed EPUB 3 test book",
    async () => {
      const path = resolve(TEST_BOOKS, "abbott-flatland.epub");
      const { sha256, size } = await bookInfo(path);
      const output = await transport.open(path, sha256, size);
      expect(output.meta.openStatus).toBe("opened");
      expect(output.meta.parser).toBe("epubts-browser");
      expect(output.meta.parserVersion).toMatch(/^\d+\.\d+/);
      expect(output.content?.metadata.title).not.toBeNull();
    },
    60_000,
  );

  test(
    "opens EPUB 2 (epubts-browser does not reject it)",
    async () => {
      const path = resolve(FIXTURES, "epub2-minimal.epub");
      const { sha256, size } = await bookInfo(path);
      const output = await transport.open(path, sha256, size);
      expect(output.meta.openStatus).toBe("opened");
      expect(output.content?.metadata.title).toBe("Epub Two Minimal");
    },
    60_000,
  );

  test(
    "malformed-truncated-zip.epub returns open-failed",
    async () => {
      const path = resolve(FIXTURES, "malformed-truncated-zip.epub");
      const { sha256, size } = await bookInfo(path);
      const output = await transport.open(path, sha256, size);
      expect(output.meta.openStatus).toBe("open-failed");
      expect(output.meta.openFailure).toBeDefined();
      expect(output.content).toBeUndefined();
    },
    60_000,
  );

  test(
    "output satisfies ParserOutput schema invariants (Zod-validated by buildParserOutput)",
    async () => {
      const path = resolve(TEST_BOOKS, "aristotle-nicomachean-ethics.epub");
      const { sha256, size } = await bookInfo(path);
      const output = await transport.open(path, sha256, size);
      expect(output.schemaVersion).toBe(2);
      expect(["opened", "open-failed", "epub2-unsupported"]).toContain(
        output.meta.openStatus,
      );
      if (output.meta.openStatus === "opened") {
        expect(output.content).toBeDefined();
        expect(output.meta.openFailure).toBeUndefined();
        expect(output.meta.domParser).toBeUndefined();
      }
    },
    60_000,
  );
});
