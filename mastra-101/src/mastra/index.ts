import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";

import { weatherAgent } from "./agents";
import { LibSQLVector } from "@mastra/core/vector/libsql";
import { ragAgent } from "./agents/rag";

// Initialize Mastra instance
const libsqlVector = new LibSQLVector({
  connectionUrl: "file:./data/libsql/vector.db",
});

export const mastra = new Mastra({
  agents: { weatherAgent, ragAgent },
  vectors: {
    libsql: libsqlVector,
  },
  logger: createLogger({
    name: "Mastra",
    // level: "debug",
    level: "info",
  }),
});
