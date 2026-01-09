import { Builder } from "fresh/dev";
import { app } from "./main.tsx";

// Production server: builds islands and serves
const builder = new Builder();
await builder.listen(() => Promise.resolve(app));
