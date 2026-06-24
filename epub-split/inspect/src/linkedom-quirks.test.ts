import { test } from "bun:test";

// Placeholders for two epubts-node / LinkeDOM quirks the refactor must keep
// surfacing. They are `test.todo` (not executed by default) because the
// epubts-node adapter does not produce a ParserOutput until Gate 3 — once it
// does, flip these to real `test`s and assert against the named fixture.

// QUIRK 1 — entity truncation (characterizable; fixture exists).
// On the node path, LinkeDOM truncates a metadata value at the first character
// entity. The committed fixture test/fixtures/entity-ampersand-in-title.epub has
//   <dc:title>Legends &amp; Lattes</dc:title>
// Expected once the Gate 3 adapter lands:
//   - epubts-node  title === "Legends"            (truncated at the '&')
//   - epubts-browser / storyteller title === "Legends & Lattes"  (intact)
// This is exactly the parity-baseline entity-truncation finding reproduced as a
// minimized unit test (His Majesty's Dragon, Legends & Lattes, Bookshops &
// Bonedust, …), and Gate 6's comparator must report it as a node-vs-browser
// mismatch rather than normalize it away.
test.todo(
  "epubts-node truncates 'Legends & Lattes' to 'Legends' on entity-ampersand-in-title.epub (Gate 3)",
  () => {
    throw new Error("pending: epubts-node adapter produces ParserOutput in Gate 3");
  }
);

// QUIRK 2 — synchronous LinkeDOM hang (NOT yet characterized).
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
