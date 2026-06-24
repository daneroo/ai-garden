import { describe, expect, test } from "bun:test";

import { buildInventory, type HashedOccurrence } from "./corpus.ts";
import type { RootName } from "./types.ts";

const ROOT_ORDER: RootName[] = ["test", "space", "drop"];

// Scan order test, space, drop. The same content appears in space and drop, and
// twice within space, so dedup must be counted against the later occurrence in
// scan order (the first-seen copy stays distinct).
const OCCURRENCES: HashedOccurrence[] = [
  { root: "test", relativePath: "happy.epub", size: 100, sha256: "aaaa" },
  { root: "space", relativePath: "shared.epub", size: 200, sha256: "bbbb" },
  { root: "space", relativePath: "shared-again.epub", size: 200, sha256: "bbbb" },
  { root: "space", relativePath: "solo.epub", size: 300, sha256: "cccc" },
  { root: "drop", relativePath: "copy-of-shared.epub", size: 200, sha256: "bbbb" },
  { root: "drop", relativePath: "drop-only.epub", size: 400, sha256: "dddd" },
];

describe("buildInventory", () => {
  const inventory = buildInventory(ROOT_ORDER, OCCURRENCES);

  test("per-root found/deduped/distinct follows scan order", () => {
    expect(inventory.roots).toEqual([
      { name: "test", found: 1, deduped: 0, distinct: 1 },
      // second 'bbbb' inside space is a same-root duplicate -> deduped
      { name: "space", found: 3, deduped: 1, distinct: 2 },
      // 'bbbb' was already seen in space -> deduped under the later root
      { name: "drop", found: 2, deduped: 1, distinct: 1 },
    ]);
  });

  test("groups occurrences by sha256, entries sorted by sha256", () => {
    expect(inventory.entries.map((entry) => entry.sha256)).toEqual([
      "aaaa",
      "bbbb",
      "cccc",
      "dddd",
    ]);
  });

  test("a multi-root entry keeps all occurrences in scan order", () => {
    const shared = inventory.entries.find((entry) => entry.sha256 === "bbbb");
    expect(shared?.occurrences).toEqual([
      { root: "space", relativePath: "shared.epub" },
      { root: "space", relativePath: "shared-again.epub" },
      { root: "drop", relativePath: "copy-of-shared.epub" },
    ]);
  });

  test("distinct total equals number of entries", () => {
    const distinct = inventory.roots.reduce((sum, root) => sum + root.distinct, 0);
    expect(distinct).toBe(inventory.entries.length);
  });

  test("an out-of-scan-order root is rejected", () => {
    expect(() =>
      buildInventory(["test"], [
        { root: "space", relativePath: "x.epub", size: 1, sha256: "ffff" },
      ])
    ).toThrow();
  });
});
