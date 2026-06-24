import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";

import { openStoryteller } from "./storyteller.ts";

const FIXTURES = resolve(import.meta.dir, "../test/fixtures");
const TEST_BOOKS = resolve(import.meta.dir, "../../test-books");

describe("openStoryteller", () => {
  test(
    "opens a committed EPUB 3 test book",
    async () => {
      const output = await openStoryteller(resolve(TEST_BOOKS, "abbott-flatland.epub"));
      expect(output.meta.openStatus).toBe("opened");
      expect(output.meta.parser).toBe("storyteller");
      expect(output.meta.parserVersion).toMatch(/^\d+\.\d+/);
      expect(output.content?.metadata.title).not.toBeNull();
    },
    30_000
  );

  test(
    "EPUB 2 returns epub2-unsupported (not open-failed)",
    async () => {
      const output = await openStoryteller(resolve(FIXTURES, "epub2-minimal.epub"));
      expect(output.meta.openStatus).toBe("epub2-unsupported");
      expect(output.content).toBeUndefined();
      expect(output.meta.openFailure).toBeUndefined();
    },
    30_000
  );

  test(
    "malformed-truncated-zip.epub returns open-failed",
    async () => {
      const output = await openStoryteller(resolve(FIXTURES, "malformed-truncated-zip.epub"));
      expect(output.meta.openStatus).toBe("open-failed");
      expect(output.meta.openFailure).toBeDefined();
      expect(output.content).toBeUndefined();
    },
    30_000
  );

  test(
    "output satisfies ParserOutput schema invariants (Zod-validated by buildParserOutput)",
    async () => {
      const output = await openStoryteller(resolve(TEST_BOOKS, "aristotle-nicomachean-ethics.epub"));
      expect(output.schemaVersion).toBe(1);
      expect(["opened", "open-failed", "epub2-unsupported"]).toContain(output.meta.openStatus);
      if (output.meta.openStatus === "opened") {
        expect(output.content).toBeDefined();
        expect(output.meta.openFailure).toBeUndefined();
      }
      if (output.meta.openStatus === "epub2-unsupported") {
        expect(output.content).toBeUndefined();
        expect(output.meta.openFailure).toBeUndefined();
      }
    },
    30_000
  );
});
