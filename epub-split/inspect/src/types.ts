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

export interface BrowserOpenSuccess {
  status: "opened";
  version: DeclaredVersion;
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
export interface NodeOpenSuccess {
  status: "node-opened";
  version: DeclaredVersion;
}

export interface NodeOpenFailure {
  status: "node-open-failed";
  stage: "node-open";
  category: string;
  message: string;
}

export type NodeOpenOutcome = NodeOpenSuccess | NodeOpenFailure;

// storyteller-node path (@storyteller-platform/epub, in-memory read-only). Like
// the node path, there is no browser transport, so the attempt is the open
// outcome directly. Storyteller validates EPUB 3 and exposes the declared
// version, so EPUB 2 archives surface as an open failure.
export interface StorytellerOpenSuccess {
  status: "storyteller-opened";
  version: DeclaredVersion;
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

export interface BookObservation {
  schemaVersion: number;
  book: BookIdentity;
  parsers: Record<ParserName, ParserPathAttempt>;
  comparison: {
    status: "not-implemented";
  };
}

export interface BookInventoryEntry extends BookIdentity {
  report: string;
  detail: string | null;
  parserStates: Record<ParserName, ParserPathAttempt["status"]>;
  browserOpen: BrowserOpenOutcome["status"] | null;
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
