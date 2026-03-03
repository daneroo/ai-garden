// App — top-level TUI component (Phase 6 adds results view)

import { ProgressView } from "./ProgressView.tsx";
import type { ScanState } from "./scan-state.ts";

export function App({ scanState }: { scanState: ScanState }) {
  return <ProgressView scanState={scanState} />;
}
