import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools";
import { getModel } from "../../utils/provider";
import { Memory } from "@mastra/memory";

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

// Initialize memory with semantic search enabled
const memory = new Memory({
  options: {
    lastMessages: 10, // Keep last 10 messages in context
    semanticRecall: {
      topK: 3, // Find 3 most relevant previous messages
      messageRange: 2, // Include 2 messages before and after each result
    },
  },
});

export const weatherAgent = new Agent({
  name: "Weather Agent",
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
      Consider previous conversation context when formulating responses.
  `,
  model: getModel(MODEL),
  tools: { weatherTool },
  memory, // Add memory to the agent
});
