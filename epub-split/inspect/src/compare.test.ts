import { describe, expect, test } from "bun:test";

import { compareBook, projectNodeBrowserMismatches, projectNodeStorytellerMismatches, type BaselineHistogram } from "./compare.ts";
import type { ManifestItem, ParserOutput, SpineHashItem, SpineItem } from "./schema.ts";

// ── hand-built ParserOutput helpers ─────────────────────────────────────────

function opened(
  parser: ParserOutput["meta"]["parser"],
  title: string | null,
  creator: string | null,
  date: string | null,
  spine: { href: string; linear: boolean }[] = [],
  manifest: { id: string; href: string; mediaType: string | null }[] = [],
  spineHashes: { href: string; sha256: string }[] = []
): ParserOutput {
  return {
    schemaVersion: 4,
    meta: { parser, parserVersion: "1.0.0", openStatus: "opened" },
    content: { metadata: { title, creator, date }, spine, manifest, spineHashes },
  };
}

// ── compareBook ──────────────────────────────────────────────────────────────

describe("compareBook", () => {
  test("all fields agree", () => {
    const a = opened("epubts-node", "Flatland", "Abbott", "1884-01-01");
    const b = opened("epubts-browser", "Flatland", "Abbott", "1884-01-01");
    const result = compareBook(a, b);
    expect(result.metadata.title).toEqual({ status: "agree", a: "Flatland", b: "Flatland" });
    expect(result.metadata.creator).toEqual({ status: "agree", a: "Abbott", b: "Abbott" });
    expect(result.metadata.date).toEqual({ status: "agree", a: "1884-01-01", b: "1884-01-01" });
    expect(result.parserA).toBe("epubts-node");
    expect(result.parserB).toBe("epubts-browser");
  });

  test("differ — both present but unequal (entity truncation case)", () => {
    const a = opened("epubts-node", "Legends ", null, null);
    const b = opened("epubts-browser", "Legends & Lattes", null, null);
    const result = compareBook(a, b);
    expect(result.metadata.title).toEqual({
      status: "differ",
      a: "Legends ",
      b: "Legends & Lattes",
    });
  });

  test("a-only — a has value, b is null", () => {
    const a = opened("epubts-node", "Some Title", null, null);
    const b = opened("epubts-browser", null, null, null);
    const result = compareBook(a, b);
    expect(result.metadata.title).toEqual({ status: "a-only", a: "Some Title", b: null });
  });

  test("b-only — a is null, b has value", () => {
    const a = opened("epubts-node", null, null, null);
    const b = opened("epubts-browser", "Some Title", null, null);
    const result = compareBook(a, b);
    expect(result.metadata.title).toEqual({ status: "b-only", a: null, b: "Some Title" });
  });

  test("both-null — neither has a value", () => {
    const a = opened("epubts-node", null, null, null);
    const b = opened("epubts-browser", null, null, null);
    const result = compareBook(a, b);
    expect(result.metadata.title).toEqual({ status: "both-null", a: null, b: null });
  });

  test("throws when either input is not opened", () => {
    const a: ParserOutput = {
      schemaVersion: 4,
      meta: { parser: "epubts-node", parserVersion: "1.0.0", openStatus: "open-failed", openFailure: { category: "Error", message: "bad" } },
    };
    const b = opened("epubts-browser", "Title", null, null);
    expect(() => compareBook(a, b)).toThrow("compareBook requires both outputs to be opened");
  });

  test("mixed fields: agree, differ, both-null", () => {
    const a = opened("epubts-node", "Title A", "Author", null);
    const b = opened("epubts-browser", "Title B", "Author", null);
    const result = compareBook(a, b);
    expect(result.metadata.title.status).toBe("differ");
    expect(result.metadata.creator.status).toBe("agree");
    expect(result.metadata.date.status).toBe("both-null");
  });
});

// ── compareSpine (via compareBook) ───────────────────────────────────────────

function item(href: string, linear = true): SpineItem {
  return { href, linear };
}

describe("compareBook — spine", () => {
  test("identical spine sequences agree", () => {
    const spine = [item("ch01.xhtml"), item("ch02.xhtml")];
    const a = opened("epubts-node", null, null, null, spine);
    const b = opened("epubts-browser", null, null, null, spine);
    const result = compareBook(a, b);
    expect(result.spine.status).toBe("agree");
    expect(result.spine.countA).toBe(2);
    expect(result.spine.countB).toBe(2);
    expect(result.spine.onlyInA).toEqual([]);
    expect(result.spine.onlyInB).toEqual([]);
  });

  test("empty spines agree", () => {
    const a = opened("epubts-node", null, null, null, []);
    const b = opened("epubts-browser", null, null, null, []);
    expect(compareBook(a, b).spine.status).toBe("agree");
  });

  test("asymmetric hrefs: extra item in A", () => {
    const a = opened("epubts-node", null, null, null, [item("ch01.xhtml"), item("ch02.xhtml")]);
    const b = opened("epubts-browser", null, null, null, [item("ch01.xhtml")]);
    const result = compareBook(a, b);
    expect(result.spine.status).toBe("differ");
    expect(result.spine.onlyInA).toEqual(["ch02.xhtml"]);
    expect(result.spine.onlyInB).toEqual([]);
  });

  test("asymmetric hrefs: extra item in B", () => {
    const a = opened("epubts-node", null, null, null, [item("ch01.xhtml")]);
    const b = opened("epubts-browser", null, null, null, [item("ch01.xhtml"), item("ch02.xhtml")]);
    const result = compareBook(a, b);
    expect(result.spine.status).toBe("differ");
    expect(result.spine.onlyInA).toEqual([]);
    expect(result.spine.onlyInB).toEqual(["ch02.xhtml"]);
  });

  test("same set different order: differ with empty onlyInA/onlyInB", () => {
    const a = opened("epubts-node", null, null, null, [item("ch01.xhtml"), item("ch02.xhtml")]);
    const b = opened("epubts-browser", null, null, null, [item("ch02.xhtml"), item("ch01.xhtml")]);
    const result = compareBook(a, b);
    expect(result.spine.status).toBe("differ");
    expect(result.spine.onlyInA).toEqual([]);
    expect(result.spine.onlyInB).toEqual([]);
    expect(result.spine.countA).toBe(2);
    expect(result.spine.countB).toBe(2);
  });

  test("linear flag is ignored in comparison", () => {
    const a = opened("epubts-node", null, null, null, [{ href: "ch01.xhtml", linear: true }]);
    const b = opened("epubts-browser", null, null, null, [{ href: "ch01.xhtml", linear: false }]);
    expect(compareBook(a, b).spine.status).toBe("agree");
  });
});

// ── compareManifest (via compareBook) ───────────────────────────────────────

function mitem(id: string, href: string): ManifestItem {
  return { id, href, mediaType: "application/xhtml+xml" };
}

describe("compareBook — manifest", () => {
  test("identical manifest sets agree", () => {
    const manifest = [mitem("ch01", "ch01.xhtml"), mitem("ch02", "ch02.xhtml")];
    const a = opened("epubts-node", null, null, null, [], manifest);
    const b = opened("epubts-browser", null, null, null, [], manifest);
    const result = compareBook(a, b);
    expect(result.manifest.status).toBe("agree");
    expect(result.manifest.countA).toBe(2);
    expect(result.manifest.onlyInA).toEqual([]);
    expect(result.manifest.onlyInB).toEqual([]);
  });

  test("empty manifests agree", () => {
    const a = opened("epubts-node", null, null, null, [], []);
    const b = opened("epubts-browser", null, null, null, [], []);
    expect(compareBook(a, b).manifest.status).toBe("agree");
  });

  test("different order still agrees (set comparison)", () => {
    const a = opened("epubts-node", null, null, null, [], [mitem("ch01", "ch01.xhtml"), mitem("ch02", "ch02.xhtml")]);
    const b = opened("epubts-browser", null, null, null, [], [mitem("ch02", "ch02.xhtml"), mitem("ch01", "ch01.xhtml")]);
    expect(compareBook(a, b).manifest.status).toBe("agree");
  });

  test("extra item in A: onlyInA populated", () => {
    const a = opened("epubts-node", null, null, null, [], [mitem("ch01", "ch01.xhtml"), mitem("ch02", "ch02.xhtml")]);
    const b = opened("epubts-browser", null, null, null, [], [mitem("ch01", "ch01.xhtml")]);
    const result = compareBook(a, b);
    expect(result.manifest.status).toBe("differ");
    expect(result.manifest.onlyInA).toEqual(["ch02.xhtml"]);
    expect(result.manifest.onlyInB).toEqual([]);
  });

  test("extra item in B: onlyInB populated", () => {
    const a = opened("epubts-node", null, null, null, [], [mitem("ch01", "ch01.xhtml")]);
    const b = opened("epubts-browser", null, null, null, [], [mitem("ch01", "ch01.xhtml"), mitem("ch02", "ch02.xhtml")]);
    const result = compareBook(a, b);
    expect(result.manifest.status).toBe("differ");
    expect(result.manifest.onlyInA).toEqual([]);
    expect(result.manifest.onlyInB).toEqual(["ch02.xhtml"]);
  });

  test("mediaType is ignored in comparison", () => {
    const a = opened("epubts-node", null, null, null, [], [{ id: "ch01", href: "ch01.xhtml", mediaType: "application/xhtml+xml" }]);
    const b = opened("epubts-browser", null, null, null, [], [{ id: "ch01", href: "ch01.xhtml", mediaType: null }]);
    expect(compareBook(a, b).manifest.status).toBe("agree");
  });
});

// ── compareSpineHashes (via compareBook) ────────────────────────────────────

function hash(href: string, sha256: string): SpineHashItem {
  return { href, sha256 };
}

describe("compareBook — spineHashes", () => {
  test("identical hashes agree", () => {
    const hashes = [hash("ch01.xhtml", "aaa"), hash("ch02.xhtml", "bbb")];
    const a = opened("epubts-node", null, null, null, [], [], hashes);
    const b = opened("epubts-browser", null, null, null, [], [], hashes);
    const result = compareBook(a, b);
    expect(result.spineHashes.status).toBe("agree");
    expect(result.spineHashes.matchCount).toBe(2);
    expect(result.spineHashes.mismatchCount).toBe(0);
  });

  test("empty spine hashes agree", () => {
    const a = opened("epubts-node", null, null, null, [], [], []);
    const b = opened("epubts-browser", null, null, null, [], [], []);
    expect(compareBook(a, b).spineHashes.status).toBe("agree");
  });

  test("hash mismatch: differ with mismatchCount", () => {
    const a = opened("epubts-node", null, null, null, [], [], [hash("ch01.xhtml", "aaa")]);
    const b = opened("epubts-browser", null, null, null, [], [], [hash("ch01.xhtml", "bbb")]);
    const result = compareBook(a, b);
    expect(result.spineHashes.status).toBe("differ");
    expect(result.spineHashes.mismatchCount).toBe(1);
    expect(result.spineHashes.matchCount).toBe(0);
  });

  test("sentinel <unreadable> matches sentinel (both fail same item → agree)", () => {
    const a = opened("epubts-node", null, null, null, [], [], [hash("ch01.xhtml", "<unreadable>")]);
    const b = opened("epubts-browser", null, null, null, [], [], [hash("ch01.xhtml", "<unreadable>")]);
    const result = compareBook(a, b);
    expect(result.spineHashes.status).toBe("agree");
    expect(result.spineHashes.matchCount).toBe(1);
    expect(result.spineHashes.mismatchCount).toBe(0);
  });

  test("sentinel vs real hash: differ", () => {
    const a = opened("epubts-node", null, null, null, [], [], [hash("ch01.xhtml", "<unreadable>")]);
    const b = opened("epubts-browser", null, null, null, [], [], [hash("ch01.xhtml", "aaa")]);
    const result = compareBook(a, b);
    expect(result.spineHashes.status).toBe("differ");
    expect(result.spineHashes.mismatchCount).toBe(1);
    expect(result.spineHashes.matchCount).toBe(0);
  });

  test("length mismatch triggers differ", () => {
    const a = opened("epubts-node", null, null, null, [], [], [hash("ch01.xhtml", "aaa"), hash("ch02.xhtml", "bbb")]);
    const b = opened("epubts-browser", null, null, null, [], [], [hash("ch01.xhtml", "aaa")]);
    const result = compareBook(a, b);
    expect(result.spineHashes.status).toBe("differ");
    expect(result.spineHashes.mismatchCount).toBe(1);
  });

  test("missing position is not a match even against a real <unreadable> sentinel", () => {
    // The shorter side has no position 2; the longer side has a genuine <unreadable>
    // there. "no item" must not be conflated with "item present but unreadable".
    const a = opened("epubts-node", null, null, null, [], [], [hash("ch01.xhtml", "aaa")]);
    const b = opened("epubts-browser", null, null, null, [], [], [hash("ch01.xhtml", "aaa"), hash("ch02.xhtml", "<unreadable>")]);
    const result = compareBook(a, b);
    expect(result.spineHashes.status).toBe("differ");
    expect(result.spineHashes.matchCount).toBe(1);
    expect(result.spineHashes.mismatchCount).toBe(1);
  });
});

// ── parity projection ────────────────────────────────────────────────────────
//
// These constants are the values recorded in baseline/run.json (Gate 0A).
// The baseline directory is removed after Gate 6 parity passes; the expected
// mismatch counts are preserved here so the projection math can be verified
// without the baseline directory.

const BASELINE_HISTOGRAM: BaselineHistogram = {
  title: {
    "all-agree": 364,
    "node-differs": 2,
    "storyteller-differs": 0,
    "browser-differs": 0,
    "all-differ": 2,
    "browser-node-agree": 930,
    "browser-node-differ": 5,
    "unavailable": 1,
  },
  creator: {
    "all-agree": 368,
    "node-differs": 0,
    "storyteller-differs": 0,
    "browser-differs": 0,
    "all-differ": 0,
    "browser-node-agree": 934,
    "browser-node-differ": 1,
    "unavailable": 1,
  },
  date: {
    "all-agree": 368,
    "node-differs": 0,
    "storyteller-differs": 0,
    "browser-differs": 0,
    "all-differ": 0,
    "browser-node-agree": 804,
    "browser-node-differ": 0,
    "unavailable": 132,
  },
};

describe("parity projection", () => {
  test("projectNodeBrowserMismatches matches baseline expectation (title=9, creator=1, date=0)", () => {
    const result = projectNodeBrowserMismatches(BASELINE_HISTOGRAM);
    // title: node-differs(2) + browser-differs(0) + all-differ(2) + browser-node-differ(5) = 9
    expect(result.title).toBe(9);
    // creator: 0 + 0 + 0 + 1 = 1
    expect(result.creator).toBe(1);
    // date: 0 + 0 + 0 + 0 = 0
    expect(result.date).toBe(0);
  });

  test("projectNodeStorytellerMismatches matches baseline expectation (title=4, creator=0, date=0)", () => {
    const result = projectNodeStorytellerMismatches(BASELINE_HISTOGRAM);
    // title: node-differs(2) + storyteller-differs(0) + all-differ(2) = 4
    expect(result.title).toBe(4);
    // creator: 0 + 0 + 0 = 0
    expect(result.creator).toBe(0);
    // date: 0 + 0 + 0 = 0
    expect(result.date).toBe(0);
  });

  test("zero histogram produces zero mismatches", () => {
    const zero: BaselineHistogram = {
      title: { "all-agree": 100, "node-differs": 0, "storyteller-differs": 0, "browser-differs": 0, "all-differ": 0, "browser-node-agree": 0, "browser-node-differ": 0, "unavailable": 0 },
      creator: { "all-agree": 100, "node-differs": 0, "storyteller-differs": 0, "browser-differs": 0, "all-differ": 0, "browser-node-agree": 0, "browser-node-differ": 0, "unavailable": 0 },
      date: { "all-agree": 100, "node-differs": 0, "storyteller-differs": 0, "browser-differs": 0, "all-differ": 0, "browser-node-agree": 0, "browser-node-differ": 0, "unavailable": 0 },
    };
    expect(projectNodeBrowserMismatches(zero)).toEqual({ title: 0, creator: 0, date: 0 });
    expect(projectNodeStorytellerMismatches(zero)).toEqual({ title: 0, creator: 0, date: 0 });
  });
});
