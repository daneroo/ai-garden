import { Agent } from "@mastra/core/agent";
import { getModel } from "../../utils/provider";
import { ragTool } from "../tools/rag";

// You can easily change the model by updating this string
// Available options:
// const MODEL = "openai:gpt-4o";
// const MODEL = "openai:gpt-4o-mini";
const MODEL = "ollama:llama3.1:8b";
// const MODEL = "ollama:qwen2.5-coder:7b";
// the deepseek thinking models don;t seem to work
// const MODEL = "ollama:deepseek-r1:7b";
// const MODEL = "ollama:deepseek-r1:8b";

// Gemini Model Options:
// const MODEL = "google:gemini-2.0-flash"; // Next generation features, speed, thinking, realtime streaming
// const MODEL = "google:gemini-2.0-flash-lite"; // Cost efficiency and low latency version of 2.0 Flash
// const MODEL = "google:gemini-2.5-pro-exp-03-25"; // Enhanced thinking, reasoning, multimodal understanding, advanced coding

export const ragAgent = new Agent({
  name: "Ethics Research Assistant",
  instructions: `
      You are an AI research assistant specializing in aristotle's ethics and philosophy. Your role is to:
      1. Answer questions accurately based on the retrieved content
      2. Cite sources properly when providing information
      3. Acknowledge limitations and uncertainties
      4. Maintain academic rigor in responses
      5. Be clear and concise while being thorough

      Use the ragTool to find relevant information before answering questions.
  `,
  model: getModel(MODEL),
  tools: { ragTool },
});
