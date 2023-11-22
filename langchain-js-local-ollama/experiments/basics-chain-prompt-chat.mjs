import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";

console.log(`# Basics Prompt+LLM Chain

Here we simply invoke the most basic chains.

PromptTemplate + LLM = 🔗
⬇
invoke
= input variable(s) ⮕ prompt template ⮕ prompt ⮕ model ⮕ result
\n`);

const verbose = false;

const modelsAndInputs = [
  {
    modelName: "llama2",
    speechUnit: "story",
    topic: "a dog",
  },
  {
    modelName: "mistral",
    speechUnit: "joke",
    topic: "a bear",
  },
];
for (const modelAndInputs of modelsAndInputs) {
  const { modelName, speechUnit, topic } = modelAndInputs;
  const model = new ChatOllama({
    baseUrl: "http://localhost:11434",
    model: modelName,
    maxConcurrency: 1,
  });

  console.log(`## Chat modelName: ${modelName}:\n`);

  const promptTemplate = PromptTemplate.fromTemplate(
    "Tell me a {speechUnit} about {topic}"
  );

  const chain = promptTemplate.pipe(model);

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
  ${result.content}\n`);
}
