// Test script for the ollama-ai-provider package based on README
import { ollama } from "ollama-ai-provider";
import { streamText } from "ai";

const MODELS = [
  "llama3.1:8b",
  "qwen2.5-coder:7b",
  // these don;t work with tool calling
  "deepseek-r1:7b", // commented out as they don't work
  "deepseek-r1:8b",
];

async function testModel(modelName, prompt) {
  console.log(`\n=== Testing model: ${modelName} ===`);
  console.log(`Sending prompt: "${prompt}"\n`);

  try {
    // Create the Ollama model
    const model = ollama(modelName);

    // Get the stream result
    const result = streamText({
      maxRetries: 5,
      maxTokens: 512,
      model,
      prompt,
      temperature: 0.3,
    });

    console.log("Streaming response:\n");

    // Process the text stream
    for await (const textPart of result.textStream) {
      process.stdout.write(textPart);
    }

    console.log("\n");
    console.log("Token usage:", await result.usage);
    console.log("Finish reason:", await result.finishReason);
    console.log("=".repeat(50));
  } catch (error) {
    console.error(`\nError with model ${modelName}:`, error);
    console.log("=".repeat(50));
  }
}

async function main() {
  const prompt =
    process.argv.slice(2).join(" ") ||
    "Write a haiku about artificial intelligence";

  for (const model of MODELS) {
    await testModel(model, prompt);
  }
}

main();
