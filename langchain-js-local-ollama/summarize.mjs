import { getSource } from "./lib/sources.mjs";

// import { getSummaryWithQuestionsPrompts } from "./prompts.mjs";
import { getSummaryPrompts } from "./prompts.mjs";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import { loadSummarizationChain } from "langchain/chains";

const ollamaModelName = "llama3.1:8b"; // mistral

const sourceNickname = "thesis.epub"; // thesis.epub, thesis.pdf, thesis.txt, blog.web, secret-history.epub
const { name, loader } = getSource(sourceNickname);

console.log(`\n# Summarization using ollama ${ollamaModelName}\n`);
console.log(`\n## 1- Fetch/split document (${name})\n`);

const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 3000,
  chunkOverlap: 200,
});

const splitDocuments = await splitter.splitDocuments(docs);
console.log(`  - split into ${splitDocuments.length} document chunks`);
// console.log(JSON.stringify(splitDocuments, null, 2));

const model = new Ollama({
  baseUrl: "http://localhost:11434",
  model: ollamaModelName,
});

const { questionPrompt, refinePrompt } = getSummaryPrompts();

const summarizeChain = loadSummarizationChain(model, {
  type: "refine",
  verbose: true,
  questionPrompt: PromptTemplate.fromTemplate(questionPrompt),
  refinePrompt: PromptTemplate.fromTemplate(refinePrompt),
});

console.log(`\n## 2- Summary Chain (${ollamaModelName} - ${name})\n`);
const summary = await summarizeChain.run(splitDocuments);

console.log(`\n## 3- Final Summary for ${name} using ${ollamaModelName}\n`);

console.log(summary);
