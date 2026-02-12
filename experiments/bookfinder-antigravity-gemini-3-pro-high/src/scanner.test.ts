import { describe, expect, it } from "vitest";
import { Scanner } from "./scanner";

describe("Scanner", () => {
  it("should instantiate", () => {
    const scanner = new Scanner("/tmp");
    expect(scanner).toBeTruthy();
  });
});
