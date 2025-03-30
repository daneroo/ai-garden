import { ollama } from "ollama-ai-provider";
import { createVectorQueryTool } from "@mastra/rag";

// Create a tool for semantic search
export const ragTool = createVectorQueryTool({
  vectorStoreName: "libsql",
  indexName: "ethics",
  model: ollama.embedding("mxbai-embed-large"),
});
