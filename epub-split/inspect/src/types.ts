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
  parsers: Record<ParserName, ParserAttempt>;
  comparison: {
    status: "not-implemented";
  };
}

export interface BookInventoryEntry extends BookIdentity {
  report: string;
  detail: null;
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
}
