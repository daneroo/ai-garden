import { App, staticFiles } from "fresh";
import Home from "./routes/index.tsx";

const app = new App();

app.use(staticFiles());

app.get("/", (ctx) => {
  return ctx.render(<Home />);
});

export default { fetch: app.handler() };
