import { describe, it, expect } from "vitest";
import { parseBookFilename } from "./parse-filename.ts";

describe("parseBookFilename", () => {
  it("parses 'Author - Series - NN Title' pattern", () => {
    const result = parseBookFilename(
      "Steven Erikson - Malazan - 10 The Crippled God/Steven Erikson - Malazan - 10 The Crippled God.m4b",
    );
    expect(result.author).toBe("Steven Erikson");
    expect(result.series).toBe("Malazan");
    expect(result.number).toBe("10");
    expect(result.title).toBe("The Crippled God");
  });

  it("parses 'Author - Series NN - Title' pattern", () => {
    const result = parseBookFilename(
      "Iain M. Banks - Culture 09 - Surface Detail/Iain M. Banks - Culture 09 - Surface Detail.m4b",
    );
    expect(result.author).toBe("Iain M. Banks");
    expect(result.series).toBe("Culture");
    expect(result.number).toBe("09");
    expect(result.title).toBe("Surface Detail");
  });

  it("parses 'Author - Title' with no series", () => {
    const result = parseBookFilename("Frank Herbert - Dune.m4b");
    expect(result.author).toBe("Frank Herbert");
    expect(result.series).toBeNull();
    expect(result.number).toBeNull();
    expect(result.title).toBe("Dune");
  });

  it("parses 'Author - Series NN' with no separate title", () => {
    const result = parseBookFilename("Brandon Sanderson - Mistborn 01.m4b");
    expect(result.author).toBe("Brandon Sanderson");
    expect(result.number).toBe("01");
    expect(result.series).toBe("Mistborn");
  });

  it("handles single-part filename", () => {
    const result = parseBookFilename("Unknown Book.m4b");
    expect(result.author).toBe("Unknown Book");
    expect(result.title).toBe("Unknown Book");
  });

  it("handles paths with directories", () => {
    const result = parseBookFilename("some/nested/path/Author - Title.mp3");
    expect(result.author).toBe("Author");
    expect(result.title).toBe("Title");
  });

  it("parses multi-dash titles correctly", () => {
    const result = parseBookFilename("Author - Series 01 - Part One - The Beginning.m4b");
    expect(result.author).toBe("Author");
    expect(result.series).toBe("Series");
    expect(result.number).toBe("01");
    expect(result.title).toBe("Part One - The Beginning");
  });
});
