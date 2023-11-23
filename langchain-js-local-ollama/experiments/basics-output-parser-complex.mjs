import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";

console.log(`# Basics Output Parser

Here we simply invoke a chain (RunnableSequence)
that includes an StructuredOutputParser (Zod) as it's last step.

We are parsing an output that is a list of colors and moods.
The output is a JSON Object, so we use Zod to parse it.

Mistral seems much better at this than Llama2.

- Five colors/moods
  - Model: llama2 - Total attempts: 52 Success rate: 19.23%
  - Model: llama2 - Total attempts: 39 Success rate: 25.64%
  - Model: mistral - Total attempts: 17 Success rate: 58.82%
  - Model: mistral - Total attempts: 11 Success rate: 90.91%
\n`);

const verbose = false;
const modelName = "llama2"; // llama2,mistral

const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: modelName,
  maxConcurrency: 1,
});

console.log(`## Chat modelName: ${modelName}\n`);
// console.log(`- Model: ${JSON.stringify(model, null, 2)}`);

const parser = StructuredOutputParser.fromZodSchema(
  z
    .array(
      z.object({
        color: z.string().describe("the name of the color"),
        mood: z.string().describe("The mood associated with the color"),
      })
    )
    .describe("A list of colors and moods")
);

if (verbose) {
  console.log("Parser instructions:\n", parser.getFormatInstructions());
}
const promptTemplate = PromptTemplate.fromTemplate(`
Make a list of 5 colors and an associated mood for each.
{format_instructions}
Make a list of 5 colors and an associated mood for each.`);

const chain = RunnableSequence.from([promptTemplate, model, parser]);

if (verbose) {
  console.log(`- Chain: ${JSON.stringify(chain, null, 2)}`);
}

// Iterate until successful
async function untilSuccessful() {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      const result = await chain.invoke({
        // topic,
        format_instructions: parser.getFormatInstructions(),
      });
      if (verbose) {
        console.log(`- Result: ${JSON.stringify(result, null, 2)}\n`);
      }
      return { result, attempts };
    } catch (err) {
      // console.error(err);
      console.log(`  .. Failed to parse text. Retrying...`);
    }
  }
}

let totalAttempts = 0;
let totalSuccesses = 0;
for (let i = 0; i < 10; i++) {
  const { result, attempts } = await untilSuccessful();
  totalAttempts += attempts;
  totalSuccesses += 1;
  const successRate = ((1.0 / attempts) * 100).toFixed(2);
  console.log(
    `- #${i} success rate: ${successRate}% attempts: ${attempts}, list of colors and moods as a JSON Object:\n`,
    JSON.stringify(result)
  );
}
console.log(`\n## Summary:`);
// - Model: llama2 - Total attempts: 52 Success rate: 19.23%
const successRate = ((totalSuccesses / totalAttempts) * 100).toFixed(2);
console.log(
  `- Model: ${modelName} - Total attempts: ${totalAttempts} Success rate: ${successRate}%`
);
