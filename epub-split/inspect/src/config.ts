import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { RootConfig } from "./types.ts";

export const INSPECT_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  ".."
);

export const BROWSER_BUNDLE_PATH = resolve(
  INSPECT_DIRECTORY,
  "dist/epubts-browser.js"
);
export const REPORTS_DIRECTORY = resolve(INSPECT_DIRECTORY, "reports");
export const TEMP_REPORTS_DIRECTORY = resolve(
  INSPECT_DIRECTORY,
  ".reports-next"
);
export const BACKUP_REPORTS_DIRECTORY = resolve(
  INSPECT_DIRECTORY,
  ".reports-previous"
);

export const ROOTS: readonly RootConfig[] = [
  {
    name: "test",
    path: resolve(INSPECT_DIRECTORY, "..", "test-books"),
  },
  {
    name: "space",
    path: "/Volumes/Space/Reading/audiobooks",
  },
  {
    name: "drop",
    path: resolve(homedir(), "Library/CloudStorage/Dropbox/A-Reading/EBook"),
  },
];

export const PARSER_NAMES = [
  "epubts-browser",
  "epubts-node",
  "storyteller-node",
] as const;

export const REPORT_SCHEMA_VERSION = 6;
