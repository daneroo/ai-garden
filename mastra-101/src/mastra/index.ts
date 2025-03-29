import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";

import { weatherAgent } from "./agents";
import { LibSQLVector } from "@mastra/core/vector/libsql";

export const mastra = new Mastra({
  agents: { weatherAgent },
  vectors: {
    libsql: new LibSQLVector({
      connectionUrl: "file:./data/libsql/vector.db",
    }),
  },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
  }),
});
