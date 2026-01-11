import { assertEquals } from "@std/assert";

import { hello } from "./module.ts";

Deno.test("Testing hello", () => {
  const result = hello();
  assertEquals(result, "Hello, world!");
});
