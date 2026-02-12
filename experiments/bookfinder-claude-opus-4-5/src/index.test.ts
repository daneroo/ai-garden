import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("booktui CLI", () => {
  it("shows help with --help", () => {
    const output = execSync("bun run src/index.ts --help", {
      cwd: import.meta.dirname + "/..",
      encoding: "utf-8",
    });
    expect(output).toContain("booktui");
    expect(output).toContain("--rootpath");
    expect(output).toContain("--json");
    expect(output).toContain("--concurrency");
  });

  it("shows version with --version", () => {
    const output = execSync("bun run src/index.ts --version", {
      cwd: import.meta.dirname + "/..",
      encoding: "utf-8",
    });
    expect(output.trim()).toBe("0.1.0");
  });
});
