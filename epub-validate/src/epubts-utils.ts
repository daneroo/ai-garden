// epub.ts emits this sentinel when packaging.metadata.pubdate is absent or
// parsed from an empty string. Year 101, January 1 — never a real date.
const EPUBTS_ZERO_DATE = "0101-01-01T00:00:00+00:00";

export function optional(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function optionalDate(value: unknown): string | null {
  const s = optional(value);
  return s === EPUBTS_ZERO_DATE ? null : s;
}
