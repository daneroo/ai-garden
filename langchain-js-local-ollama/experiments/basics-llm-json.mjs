import { Ollama } from "langchain/llms/ollama";

console.log(`# Basics LLMs with JSON Output (Ollama)!

Here we simply construct an LLM object with a modelName as parameter,
and ask it to predict some text.
And subsequently we ask it to predict some text, but this time we
specify the output format as JSON.
\n`);

const modelNames = ["llama2", "mistral"];
for (const modelName of modelNames) {
  const llm = new Ollama({
    baseUrl: "http://localhost:11434",
    model: modelName,
    maxConcurrency: 1,
    format: "json",
  });

  console.log(`## model: ${modelName}:\n`);
  const questions = [
    "Name three colors",
    "Name three colors; format the output as JSON",
  ];

  // const text = texts[0];
  for (const question of questions) {
    console.log(`- Q: ${question}`);
    const llmResult = await llm.predict(question);
    console.log(`- A: ${llmResult}\n`);
  }
}
