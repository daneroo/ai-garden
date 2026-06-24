// The single Zod-validation site for all parser adapters. Each adapter returns
// a minimal raw open-result in its natural shape; this assembler builds the
// full ParserOutput and validates it. Parser-specific mess (LinkeDOM hang, jsdom
// fallback, raw entities, subprocess kills) never escapes this boundary.
import {
  PARSER_OUTPUT_SCHEMA_VERSION,
  parserOutputSchema,
  type ParserName,
  type ParserOutput,
} from "./schema.ts";

export type RawOpenResult =
  | {
      openStatus: "opened";
      parserVersion: string;
      domParser?: "linkedom" | "jsdom";
      metadata: { title: string | null; creator: string | null; date: string | null };
    }
  | { openStatus: "open-failed"; parserVersion: string; openFailure: { category: string; message: string } }
  | { openStatus: "epub2-unsupported"; parserVersion: string };

export function buildParserOutput(parser: ParserName, raw: RawOpenResult): ParserOutput {
  if (raw.openStatus === "opened") {
    return parserOutputSchema.parse({
      schemaVersion: PARSER_OUTPUT_SCHEMA_VERSION,
      meta: {
        parser,
        parserVersion: raw.parserVersion,
        openStatus: "opened",
        ...(raw.domParser !== undefined ? { domParser: raw.domParser } : {}),
      },
      content: { metadata: raw.metadata },
    });
  }
  if (raw.openStatus === "open-failed") {
    return parserOutputSchema.parse({
      schemaVersion: PARSER_OUTPUT_SCHEMA_VERSION,
      meta: {
        parser,
        parserVersion: raw.parserVersion,
        openStatus: "open-failed",
        openFailure: raw.openFailure,
      },
    });
  }
  return parserOutputSchema.parse({
    schemaVersion: PARSER_OUTPUT_SCHEMA_VERSION,
    meta: {
      parser,
      parserVersion: raw.parserVersion,
      openStatus: "epub2-unsupported",
    },
  });
}
