import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";

console.log(`# Basics Output Parser

Here we simply invoke a chain (RunnableSequece)
that includes an StructuredOutputParser (Zod) as it's last step.

\n`);

const verbose = false;
const modelName = "llama2";
const speechUnit = "joke";
const topic = "a bear";

const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: modelName,
  maxConcurrency: 1,
});

console.log(`## Chat modelName: ${modelName}:\n`);

const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    setup: z.string().describe("The premise of the joke"),
    punchline: z.string().describe("The punchline of the joke"),
  })
);

if (verbose) {
  console.log(parser.getFormatInstructions());
}
const promptTemplate = PromptTemplate.fromTemplate(`
Tell me a joke about {topic}
{format_instructions}
Tell me a joke about {topic}`);

// const chain = promptTemplate.pipe(model).pipe(outputParser);
// Rewrite the piped chain expression as a runnable sequence:
const chain = RunnableSequence.from([promptTemplate, model, parser]);

if (verbose) {
  console.log(`- Chain: ${JSON.stringify(chain, null, 2)}`);
}

// Iterate until successful
while (true) {
  try {
    const result = await chain.invoke({
      topic,
      format_instructions: parser.getFormatInstructions(),
    });
    if (verbose) {
      console.log(`- Result: ${JSON.stringify(result, null, 2)}\n`);
    }
    console.log(`Here is a joke about ${topic} as a JSON Object:\n`, result);
    break;
  } catch (err) {
    // console.error(err);
    console.log(`Failed to parse text. Retrying...`);
  }
}
