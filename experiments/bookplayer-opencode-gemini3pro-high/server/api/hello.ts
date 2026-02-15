import { defineEventHandler } from "h3";

export default defineEventHandler((_event) => {
  return { message: "Hello from Nitro!" };
});
