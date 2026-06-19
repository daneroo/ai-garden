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

export interface BrowserTransportSuccess {
  status: "transported";
  parserStatus: "not-implemented";
  byteLength: number;
  sha256: string;
  epubtsVersion: string;
  diagnostics: BrowserDiagnostic[];
}

export interface BrowserTransportFailure {
  status: "transport-failed";
  parserStatus: "not-implemented";
  failure: AttemptFailure;
  diagnostics: BrowserDiagnostic[];
}

export type ParserPathAttempt =
  | ParserAttempt
  | BrowserTransportSuccess
  | BrowserTransportFailure;

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
}

export interface BrowserRuntime {
  name: "chromium";
  version: string;
  packages: {
    epubts: string;
    playwright: string;
  };
}
