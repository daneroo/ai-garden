/**
 * Fresh Island wrapper for the Timer component.
 *
 * PATTERN: Named Export → Default Export Adapter
 *
 * The shared package uses NAMED exports (best practice for code sharing
 * and tree-shaking). Fresh Islands require DEFAULT exports for hydration
 * discovery. This file bridges the two conventions.
 *
 * This allows the Timer logic to live in a reusable package while
 * satisfying Fresh's island requirements.
 */
import { Timer } from "@deno-one/timer";
export default Timer;
