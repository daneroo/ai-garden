import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";

import { StringOutputParser } from "langchain/schema/output_parser";

console.log(`# Basics Output Parser

Here we simply invoke a chain (RunnableSequece)
that includes an OutputParser as it's last step.

\n`);

const verbose = true;
const modelName = "llama2";
const speechUnit = "joke";
const topic = "a bear";

const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: modelName,
  maxConcurrency: 1,
});

console.log(`## Chat modelName: ${modelName}:\n`);

const promptTemplate = PromptTemplate.fromTemplate(
  "Tell me a {speechUnit} about {topic}"
);

const outputParser = new StringOutputParser();

// const chain = promptTemplate.pipe(model).pipe(outputParser);
// Rewrite the piped chain expression as a runnable sequence:
const chain = RunnableSequence.from([promptTemplate, model, outputParser]);

if (verbose) {
  console.log(`- Chain: ${JSON.stringify(chain, null, 2)}`);
}

const result = await chain.invoke({
  topic,
  speechUnit,
});

if (verbose) {
  console.log(`- Result: ${JSON.stringify(result, null, 2)}\n`);
}
console.log(`Here is a ${speechUnit} about ${topic}:\n
  ${result}\n`);
