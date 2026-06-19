import type { BrowserHarnessResult } from "../types.ts";

export interface BrowserHarness {
  transport(epubUrl: string): Promise<BrowserHarnessResult>;
}

declare global {
  var epubInspect: BrowserHarness;
}

export {};
