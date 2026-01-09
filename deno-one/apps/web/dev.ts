import { Builder } from "fresh/dev";
import { app } from "./main.tsx";

const builder = new Builder();

if (import.meta.main) {
  await builder.listen(() => Promise.resolve(app));
}
