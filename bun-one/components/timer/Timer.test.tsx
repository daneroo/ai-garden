import { afterAll, describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import { Timer } from "./Timer";

// Register DOM globally before any RTL execution to avoid "global document" error
GlobalRegistrator.register();

// Import RTL dynamically so it sees the DOM we just registered
const { cleanup, render, screen } = await import("@testing-library/react");

afterAll(() => {
  GlobalRegistrator.unregister();
});

describe("Timer", () => {
  test("renders with initial display value", () => {
    render(<Timer initialSeconds={60} />);
    expect(screen.getByText("1:00")).toBeDefined();
    cleanup();
  });

  test("renders with default 5 minute display", () => {
    render(<Timer />);
    expect(screen.getByText("5:00")).toBeDefined();
    cleanup();
  });

  test("shows Running status initially", () => {
    render(<Timer />);
    expect(screen.getByText("Running")).toBeDefined();
    cleanup();
  });
});
