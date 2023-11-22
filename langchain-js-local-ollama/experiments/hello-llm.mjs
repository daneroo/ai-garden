import { Ollama } from "langchain/llms/ollama";

console.log(`# Hello LLMs (Ollama)!\n`);

const modelnames = ["llama2", "mistral"];
for (const modelname of modelnames) {
  const llm = new Ollama({
    baseUrl: "http://localhost:11434",
    model: modelname,
    maxConcurrency: 1,
  });

  console.log(`## model: ${modelname}:\n`);
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
