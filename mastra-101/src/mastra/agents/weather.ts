import { openai } from "@ai-sdk/openai";
import { ollama } from "ollama-ai-provider";
import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { weatherTool } from "../tools";

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

console.log("Creating Weather Agent with model:", MODEL);

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
`,
  model: getModel(MODEL),
  tools: { weatherTool },
});

/**
 * Parses a model string in the format "provider:model" where model may contain colons
 * Examples:
 * - "openai:gpt-4"        -> provider: "openai", model: "gpt-4"
 * - "ollama:llama2:7b"    -> provider: "ollama", model: "llama2:7b"
 * - "openai:gpt-4:mini"   -> provider: "openai", model: "gpt-4:mini"
 * - "google:gemini-1.5-pro" -> provider: "google", model: "gemini-1.5-pro"
 *
 * We use spread operator (...) to handle model names containing colons:
 * - split(":") creates ["provider", "part1", "part2", ...]
 * - [provider, ...modelParts] destructures first element and collects rest
 * - join(":") reconstructs the model name with original colons
 */
function getModel(modelString: string) {
  const [provider, ...modelParts] = modelString.split(":");
  const model = modelParts.join(":");

  console.log(
    `Getting model for Weather Agent: provider: ${provider}, model: ${model}`
  );
  switch (provider) {
    case "openai":
      return openai(model);
    case "google":
      try {
        console.log("Creating Gemini model with:", { model });
        // Simple approach
        const geminiModel = google(model);
        console.log("Gemini model created successfully");
        return geminiModel;
      } catch (error) {
        console.error("Error creating Gemini model:", error);
        throw error;
      }
    case "ollama":
      try {
        console.log("Creating Ollama model with:", { model });

        // looks like this is what is required to get streaming
        // could use createOllama if we need to customize endpoimt, etc..
        const ollamaModel = ollama.chat(model, {
          simulateStreaming: true,
        });

        console.log("Ollama (chat) model created successfully");
        return ollamaModel;
      } catch (error) {
        console.error("Error creating Ollama model:", error);
        throw error;
      }
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}
