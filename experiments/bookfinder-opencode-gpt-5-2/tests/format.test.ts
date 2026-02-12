import { describe, expect, it } from "vitest";
import { formatDurationHMS, formatElapsedShort } from "../src/format";

describe("formatDurationHMS", () => {
  it("formats null as placeholder", () => {
    expect(formatDurationHMS(null)).toBe("--:--:--");
  });

  it("formats seconds to HH:MM:SS", () => {
    expect(formatDurationHMS(0)).toBe("00:00:00");
    expect(formatDurationHMS(1)).toBe("00:00:01");
    expect(formatDurationHMS(61)).toBe("00:01:01");
    expect(formatDurationHMS(3661)).toBe("01:01:01");
  });
});

describe("formatElapsedShort", () => {
  it("formats seconds with compact units", () => {
    expect(formatElapsedShort(0)).toBe("0s");
    expect(formatElapsedShort(36.1)).toBe("36s");
    expect(formatElapsedShort(60)).toBe("1m00s");
    expect(formatElapsedShort(72)).toBe("1m12s");
    expect(formatElapsedShort(3600)).toBe("1h00m00s");
    expect(formatElapsedShort(3672)).toBe("1h01m12s");
  });
});
