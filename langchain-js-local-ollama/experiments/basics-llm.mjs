import { Ollama } from "langchain/llms/ollama";

console.log(`# Basics LLMs (Ollama)!

Here we simply construct an LLM object with a modelName as parameter,
and ask it to predict some text.
\n`);

const modelNames = ["llama2", "mistral"];
for (const modelName of modelNames) {
  const llm = new Ollama({
    baseUrl: "http://localhost:11434",
    model: modelName,
    maxConcurrency: 1,
  });

  console.log(`## modelName: ${modelName}:\n`);
  const questions = [
    "What is the prime number theorem (PNT)?",
    "In which Lord of the Rings book does Tom Bombadil first appear?",
  ];

  // const text = texts[0];
  for (const question of questions) {
    console.log(`- Q: ${question}`);
    const llmResult = await llm.predict(question);
    console.log(`- A: ${llmResult}\n`);
  }
}
