import type { PARSER_NAMES } from "./config.ts";

export type RootName = "test" | "drop" | "space";
export type ParserName = (typeof PARSER_NAMES)[number];

export interface RootConfig {
  name: RootName;
  path: string;
}

export interface ParserAttempt {
  status: "not-implemented";
}

export interface BrowserDiagnostic {
  source: "console" | "page-error";
  level: string;
  message: string;
}

export interface AttemptFailure {
  stage: "browser-transport";
  category: string;
  message: string;
}

// The OPF-declared EPUB version (e.g. "2.0", "3.0") when the parser exposes it.
// epub.ts reads the package `version` attribute but discards it, so the
// epubts-browser path always reports `skipped`; `exposed` stays available for
// parsers that do surface it. Version reporting is intentionally not a blocker
// for the body-text/spine work that follows.
export type DeclaredVersion =
  | { status: "exposed"; value: string }
  | { status: "skipped" };

export interface MetadataFields {
  title: string | null;
  creator: string | null;
  date: string | null;
}

export interface BrowserOpenSuccess {
  status: "opened";
  version: DeclaredVersion;
  metadata: MetadataFields;
}

export interface BrowserOpenFailure {
  status: "open-failed";
  stage: "browser-open";
  category: string;
  message: string;
}

export type BrowserOpenOutcome = BrowserOpenSuccess | BrowserOpenFailure;

export interface BrowserTransportSuccess {
  status: "transported";
  byteLength: number;
  sha256: string;
  epubtsVersion: string;
  open: BrowserOpenOutcome;
  diagnostics: BrowserDiagnostic[];
}

export interface BrowserTransportFailure {
  status: "transport-failed";
  failure: AttemptFailure;
  diagnostics: BrowserDiagnostic[];
}

// epubts-node path (@likecoin/epub-ts/node + LinkeDOM, hosted on Bun). There is
// no browser transport here, so the attempt is the open outcome directly.
// `engine` records which DOM parser opened the book on the node path. epub.ts
// uses LinkeDOM by default; a few books hang LinkeDOM's parser, so those fall
// back to jsdom. The fallback is surfaced here and in the detail report.
export type DOMParserImpl = "linkedom" | "jsdom";

export interface NodeOpenSuccess {
  status: "node-opened";
  version: DeclaredVersion;
  engine: DOMParserImpl;
  metadata: MetadataFields;
}

export interface NodeOpenFailure {
  status: "node-open-failed";
  stage: "node-open";
  category: string;
  message: string;
}

export type NodeOpenOutcome = NodeOpenSuccess | NodeOpenFailure;

// storyteller path (@storyteller-platform/epub, in-memory read-only). Like
// the node path, there is no browser transport, so the attempt is the open
// outcome directly. Storyteller validates EPUB 3 and exposes the declared
// version, so EPUB 2 archives surface as an open failure.
export interface StorytellerOpenSuccess {
  status: "storyteller-opened";
  version: DeclaredVersion;
  metadata: MetadataFields;
}

export interface StorytellerOpenFailure {
  status: "storyteller-open-failed";
  stage: "storyteller-open";
  category: string;
  message: string;
}

export type StorytellerOpenOutcome =
  | StorytellerOpenSuccess
  | StorytellerOpenFailure;

export type ParserPathAttempt =
  | ParserAttempt
  | BrowserTransportSuccess
  | BrowserTransportFailure
  | NodeOpenSuccess
  | NodeOpenFailure
  | StorytellerOpenSuccess
  | StorytellerOpenFailure;

export interface BookIdentity {
  root: RootName;
  relativePath: string;
  size: number;
  sha256: string;
  shortSha: string;
}

// Per-field comparison across the three parser paths. Every status carries
// individual parser values so any result is fully traceable.
//
// Three-parser statuses (all three parsers opened the book):
//   all-agree        — browser == node == storyteller
//   node-differs     — browser == storyteller, node is the outlier
//   storyteller-differs — browser == node, storyteller is the outlier
//   browser-differs  — node == storyteller, browser is the outlier
//   all-differ       — all three values distinct
//
// Two-parser statuses (storyteller unavailable — EPUB 2 or open failure):
//   browser-node-agree  — browser == node (storyteller absent)
//   browser-node-differ — browser != node (storyteller absent)
//
// "unavailable" — no metadata from any available parser.
export type FieldComparison =
  | { status: "all-agree"; browser: string | null; node: string | null; storyteller: string | null }
  | { status: "node-differs"; browser: string | null; node: string | null; storyteller: string | null }
  | { status: "storyteller-differs"; browser: string | null; node: string | null; storyteller: string | null }
  | { status: "browser-differs"; browser: string | null; node: string | null; storyteller: string | null }
  | { status: "all-differ"; browser: string | null; node: string | null; storyteller: string | null }
  | { status: "browser-node-agree"; browser: string | null; node: string | null }
  | { status: "browser-node-differ"; browser: string | null; node: string | null }
  | { status: "unavailable" };

export interface MetadataComparison {
  title: FieldComparison;
  creator: FieldComparison;
  date: FieldComparison;
}

export interface BookObservation {
  schemaVersion: number;
  book: BookIdentity;
  parsers: Record<ParserName, ParserPathAttempt>;
  comparison: MetadataComparison;
}

export interface BookInventoryEntry extends BookIdentity {
  report: string;
  detail: string | null;
  parserStates: Record<ParserName, ParserPathAttempt["status"]>;
  browserOpen: BrowserOpenOutcome["status"] | null;
  nodeEngine: DOMParserImpl | null;
}

export interface RootInventory {
  name: RootName;
  count: number;
}

export interface RunReport {
  schemaVersion: number;
  runner: {
    name: "epub-inspect";
    version: string;
    bun: string;
  };
  packages: {
    epubts: string;
    storyteller: string;
    playwright: string;
  };
  browser: {
    name: "chromium";
    version: string;
  };
  parserPaths: readonly ParserName[];
  roots: RootInventory[];
  books: BookInventoryEntry[];
  metadataHistogram: Record<ParserName, Record<keyof MetadataFields, {
    unavailable: number;
    missing: number;
    present: number;
  }>>;
  comparisonHistogram: Record<keyof MetadataFields, Record<FieldComparison["status"], number>>;
}

export interface DiscoveredBook {
  root: RootName;
  rootPath: string;
  absolutePath: string;
  relativePath: string;
}

export interface HashedBook extends DiscoveredBook {
  size: number;
  sha256: string;
  shortSha: string;
  reportFilename: string;
  parserAttempts: Partial<Record<ParserName, ParserPathAttempt>>;
}

export interface BrowserHarnessResult {
  status: "transported";
  byteLength: number;
  sha256: string;
  epubtsVersion: string;
  open: BrowserOpenOutcome;
}

export interface BrowserRuntime {
  name: "chromium";
  version: string;
  packages: {
    epubts: string;
    storyteller: string;
    playwright: string;
  };
}
