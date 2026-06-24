// Minimal harness types for the in-browser epub.ts adapter.
// No Zod here — this code is bundled into the browser IIFE. Types are erased
// at compile time; the host side validates the shape after transport.

export type EntryOpenOutcome =
  | { status: "opened"; metadata: { title: string | null; creator: string | null; date: string | null }; spine: { href: string; linear: boolean }[] }
  | { status: "open-failed"; category: string; message: string };

export interface BrowserHarnessResult {
  status: "transported";
  byteLength: number;
  sha256: string;
  epubtsVersion: string;
  open: EntryOpenOutcome;
}

export interface BrowserHarness {
  transport(epubUrl: string): Promise<BrowserHarnessResult>;
}

declare global {
  var epubInspect: BrowserHarness;
}

export {};
