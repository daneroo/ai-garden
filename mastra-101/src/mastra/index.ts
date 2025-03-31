import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { DefaultStorage } from "@mastra/core/storage/libsql";

import { weatherAgent } from "./agents";
import { LibSQLVector } from "@mastra/core/vector/libsql";
import { ragAgent } from "./agents/rag";

// Initialize Mastra instance
const libsqlVector = new LibSQLVector({
  connectionUrl: "file:./data/libsql/vector.db",
});

export const mastra = new Mastra({
  storage: new DefaultStorage({
    config: {
      url: "file:./data/libsql/memory.db",
    },
  }),
  agents: { weatherAgent, ragAgent },
  vectors: {
    libsql: libsqlVector,
  },
  logger: createLogger({
    name: "Mastra",
    level: "debug",
    // level: "info",
  }),
});
