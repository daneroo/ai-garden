import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { openNode } from "./epubts-node.ts";

const FIXTURES = resolve(import.meta.dir, "../test/fixtures");
const TEST_BOOKS = resolve(import.meta.dir, "../../test-books");

describe("openNode", () => {
  test(
    "opens a committed EPUB 3 test book",
    async () => {
      const output = await openNode(resolve(TEST_BOOKS, "abbott-flatland.epub"));
      expect(output.meta.openStatus).toBe("opened");
      expect(output.meta.parser).toBe("epubts-node");
      expect(output.meta.parserVersion).toMatch(/^\d+\.\d+\.\d+/);
      expect(output.meta.domParser).toBe("linkedom");
      expect(output.content?.metadata.title).not.toBeNull();
    },
    30_000
  );

  test(
    "opens EPUB 2 (epubts-node does not reject it)",
    async () => {
      const output = await openNode(resolve(FIXTURES, "epub2-minimal.epub"));
      expect(output.meta.openStatus).toBe("opened");
      expect(output.content?.metadata.title).toBe("Epub Two Minimal");
    },
    30_000
  );

  test(
    "malformed-truncated-zip.epub returns open-failed",
    async () => {
      const output = await openNode(resolve(FIXTURES, "malformed-truncated-zip.epub"));
      expect(output.meta.openStatus).toBe("open-failed");
      expect(output.meta.openFailure).toBeDefined();
      expect(output.content).toBeUndefined();
    },
    30_000
  );

  test(
    "output satisfies ParserOutput schema invariants (Zod-validated by buildParserOutput)",
    async () => {
      // buildParserOutput throws if the output is invalid, so any output we get
      // here is already Zod-valid. Spot-check a few schema invariants.
      const output = await openNode(resolve(TEST_BOOKS, "aristotle-nicomachean-ethics.epub"));
      expect(output.schemaVersion).toBe(3);
      expect(["opened", "open-failed", "epub2-unsupported"]).toContain(output.meta.openStatus);
      if (output.meta.openStatus === "opened") {
        expect(output.content).toBeDefined();
        expect(output.meta.openFailure).toBeUndefined();
      }
    },
    30_000
  );
});
