import { assertEquals } from "https://deno.land/std@0.106.0/testing/asserts.ts";

import { hello } from "./module.ts";

Deno.test("Testing hello", () => {
  const result = hello();
  assertEquals(result, "Hello, world!");
});
