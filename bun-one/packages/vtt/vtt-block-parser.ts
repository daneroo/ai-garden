/**
 * VTT BLOCK PARSER
 * * INCLUDED:
 * - Multi-line block aggregation (Split by blank lines).
 * - Identification of SIGNATURE, NOTE, STYLE, REGION, and CUE types.
 * - Preservation of line order for audit/transposition logic.
 * * IGNORED:
 * - Rendering logic (Entities, Positioning, CSS).
 */

export type BlockType =
  | "SIGNATURE"
  | "NOTE"
  | "STYLE"
  | "REGION"
  | "CUE"
  | "UNKNOWN";

export interface VttBlock {
  type: BlockType;
  lines: string[];
}

export type ConventionChecker = (blocks: VttBlock[]) => string[];
/**
 * Ensures the Root Provenance is the very first data block after the signature.
 */
export function checkRootProvenancePosition(blocks: VttBlock[]): string[] {
  const firstDataBlock = blocks[1]; // Index 0 is SIGNATURE
  if (
    firstDataBlock &&
    !firstDataBlock.lines[0]?.startsWith("NOTE Provenance")
  ) {
    return ["Block 1: Missing mandatory Root Provenance header."];
  }
  return [];
}

/**
 * Runs a suite of checkers against a block array.
 * Gathers all warnings and throws if strict and issues exist.
 */
export function validateConventions(
  blocks: VttBlock[],
  checkers: ConventionChecker[],
  strict = true,
): string[] {
  // Execute all checkers and flatten the nested arrays of strings
  const warnings = checkers.flatMap((check) => check(blocks));

  if (strict && warnings.length > 0) {
    throw new Error(`[FATAL CONVENTIONS]\n${warnings.join("\n")}`);
  }

  return warnings;
}
export function aggregateBlocks(input: string): VttBlock[] {
  const paragraphs = input.trim().split(/\n\s*\n/);
  const blocks: VttBlock[] = [];

  const firstParagraph = paragraphs.shift();
  if (!firstParagraph) throw new Error("[FATAL] Empty VTT file.");

  const headerLines = firstParagraph.split("\n").map((l) => l.trim());
  if (!headerLines[0]?.startsWith("WEBVTT")) {
    throw new Error("[FATAL] File must start with 'WEBVTT' signature.");
  }
  blocks.push({ type: "SIGNATURE", lines: headerLines });

  for (const p of paragraphs) {
    const lines = p.split("\n").map((l) => l.trim());

    // Destructure to safely get the first and second lines
    const [firstLine, secondLine] = lines;

    // If there is no first line, it's a ghost paragraph; skip it.
    if (!firstLine) continue;

    let type: BlockType = "UNKNOWN";

    if (firstLine.startsWith("NOTE")) {
      type = "NOTE";
    } else if (firstLine.startsWith("STYLE")) {
      type = "STYLE";
    } else if (firstLine.startsWith("REGION")) {
      type = "REGION";
    } else if (
      firstLine.includes("-->") ||
      (secondLine && secondLine.includes("-->"))
    ) {
      type = "CUE";
    }

    blocks.push({ type, lines });
  }

  return blocks;
}
