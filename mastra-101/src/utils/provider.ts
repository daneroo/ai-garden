import { openai } from "@ai-sdk/openai";
import { ollama } from "ollama-ai-provider";
import { google } from "@ai-sdk/google";

// Available model options:
// const MODEL = "openai:gpt-4o";
// const MODEL = "openai:gpt-4o-mini";
// const MODEL = "ollama:qwen2.5-coder:7b";
// the deepseek thinking models don;t seem to work
// const MODEL = "ollama:deepseek-r1:7b";
// const MODEL = "ollama:deepseek-r1:8b";

// Gemini Model Options:
// const MODEL = "google:gemini-2.0-flash"; // Next generation features, speed, thinking, realtime streaming
// const MODEL = "google:gemini-2.0-flash-lite"; // Cost efficiency and low latency version of 2.0 Flash
// const MODEL = "google:gemini-2.5-pro-exp-03-25"; // Enhanced thinking, reasoning, multimodal understanding, advanced coding

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
export function getModel(modelString: string) {
  const [provider, ...modelParts] = modelString.split(":");
  const model = modelParts.join(":");

  switch (provider) {
    case "openai":
      return openai(model);
    case "google":
      try {
        // Simple approach
        const geminiModel = google(model);
        return geminiModel;
      } catch (error) {
        console.error("Error creating Gemini model:", error);
        throw error;
      }
    case "ollama":
      try {
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
