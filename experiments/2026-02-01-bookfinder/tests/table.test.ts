import { describe, expect, it } from "vitest";
import { truncateMiddle } from "../src/table";

describe("truncateMiddle", () => {
  it("returns input when within width", () => {
    expect(truncateMiddle("abcdef", 6)).toBe("abcdef");
  });

  it("truncates long text", () => {
    const out = truncateMiddle("abcdefghijklmnopqrstuvwxyz", 10);
    expect(out.length).toBe(10);
    expect(out.includes("...")).toBe(true);
  });
});
