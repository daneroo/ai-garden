import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type RootName = "test" | "drop" | "space";

export interface RootConfig {
  name: RootName;
  path: string;
}

export const VALIDATE_DIRECTORY = resolve(
  dirname(fileURLToPath(import.meta.url)),
  ".."
);

export const BROWSER_BUNDLE_PATH = resolve(
  VALIDATE_DIRECTORY,
  "dist/epubts-browser.js"
);
export const REPORTS_DIRECTORY = resolve(VALIDATE_DIRECTORY, "reports");

export const ROOTS: readonly RootConfig[] = [
  {
    name: "test",
    path: resolve(VALIDATE_DIRECTORY, "..", "test-books"),
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

