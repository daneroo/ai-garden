import { expect, test } from "bun:test";
import { resolve } from "node:path";

import { openNode } from "./epubts-node.ts";

const FIXTURES = resolve(import.meta.dir, "../test/fixtures");

// QUIRK 1 — entity truncation (Gate 3: now a real test with the adapter live).
// On the node path, LinkeDOM truncates a metadata value at the first character
// entity. The committed fixture has:
//   <dc:title>Legends &amp; Lattes</dc:title>
// LinkeDOM sees "Legends " (space included) and stops at the "&" — the rest is dropped.
// epubts-browser and storyteller keep "Legends & Lattes" intact.
// Gate 6's comparator must report this as a node-vs-browser mismatch rather
// than normalize it away (compareField is exact-lexical ===).
test(
  "epubts-node truncates 'Legends & Lattes' to 'Legends' on entity-ampersand-in-title.epub",
  async () => {
    const output = await openNode(resolve(FIXTURES, "entity-ampersand-in-title.epub"));
    expect(output.meta.openStatus).toBe("opened");
    expect(output.content?.metadata.title).toBe("Legends ");
  },
  30_000
);

// QUIRK 2 — synchronous LinkeDOM hang (NOT yet characterized into a fixture).
// A few real books drive LinkeDOM's parser into a synchronous busy loop that
// never returns; the adapter recovers by re-opening in a jsdom subprocess
// (domParser: "jsdom"). The trigger lives deep in epub.ts's parse of specific
// large books and has resisted minimization, so it stays corpus-only — verified
// through Daniel's full run, not here.
// TODO(Gate 3+): characterize the hang condition well enough to craft a small
// fixture; test/fixtures/ is the place to investigate the actual LinkeDOM
// failure. Until then this remains a corpus-only behavior with no unit test.
test.todo(
  "epubts-node falls back to jsdom on the LinkeDOM synchronous hang (corpus-only; characterize and fixture-ize)",
  () => {
    throw new Error("pending: hang condition not yet characterized into a fixture");
  }
);
