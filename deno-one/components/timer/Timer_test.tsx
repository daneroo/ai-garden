/**
 * Simple render test for the Timer component.
 *
 * NOTE: preact-render-to-string is in root deno.jsonc under "Dev/test dependencies".
 * If we adopt a more elaborate testing framework, revisit this organization.
 */
import { assertEquals } from "@std/assert";
import { render } from "preact-render-to-string";
import { Timer } from "./Timer.tsx";

Deno.test("Timer renders with initial display value", () => {
  const html = render(<Timer initialSeconds={60} />);
  // Should display "1:00" for 60 seconds
  assertEquals(html.includes("1:00"), true);
});

Deno.test("Timer renders with default 5 minute display", () => {
  const html = render(<Timer />);
  // Default is 300 seconds = 5:00
  assertEquals(html.includes("5:00"), true);
});

Deno.test("Timer shows Running status initially", () => {
  const html = render(<Timer />);
  assertEquals(html.includes("Running"), true);
});
