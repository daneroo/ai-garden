import {
  getSourceForBlog,
  getSourceForEPub,
  getSourceForPDF,
  getSourceForText,
} from "./sources.mjs";

import { TokenTextSplitter } from "langchain/text_splitter";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import { loadSummarizationChain } from "langchain/chains";

const { name, question, loader } = await getSourceForEPub();
// const { name, question, loader } = await getSourceForPDF();
// const { name, question, loader } = await getSourceForText();
// const { name, question, loader } = await getSourceForBlog();

console.log(`## 1- Fetch/spit document (${name})\n`);

const docs = await loader.load();

const splitter = new TokenTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 50,
});

const splitDocuments = await splitter.splitDocuments(docs);
console.log(`  - split into ${splitDocuments.length} document chunks`);

// console.log(JSON.stringify(splitDocuments, null, 2));

const summaryTemplate = `
You are an expert in summarizing classical philosophy articles.
Your goal is to create a summary of an article.
Below you find the transcript of aa article:
--------
{text}
--------

The transcript of the article will also be used as the basis for a question and answer bot.
Provide a few example questions and answers that could be asked about the article. Make these questions very specific.

Total output will be a summary of the article and a list of example questions the user could ask about the article.

SUMMARY AND QUESTIONS:
`;

const SUMMARY_PROMPT = PromptTemplate.fromTemplate(summaryTemplate);

const summaryRefineTemplate = `
You are an expert in summarizing classical philosophy articles.
Your goal is to create a summary of an article.
We have provided an existing summary up to a certain point: {existing_answer}

Below you find the transcript of an article:
--------
{text}
--------

Given the new context, refine the summary and example questions.
The transcript of the article will also be used as the basis for a question and answer bot.
Provide some example questions and answers that could be asked about the article.
Make these questions very specific.
If the context isn't useful, return the original summary and questions.

Total output will be a summary of the article and a list of example questions the user could ask about the article.

SUMMARY AND QUESTIONS:
`;

const SUMMARY_REFINE_PROMPT = PromptTemplate.fromTemplate(
  summaryRefineTemplate
);

// Llama 2 7b wrapped by Ollama
const model = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama2",
  // model: "mistral",
});

const summarizeChain = loadSummarizationChain(model, {
  type: "refine",
  verbose: true,
  questionPrompt: SUMMARY_PROMPT,
  refinePrompt: SUMMARY_REFINE_PROMPT,
});

console.log(`## 2- Summary Chain (${name})\n`);
ß;
const summary = await summarizeChain.run(splitDocuments);

console.log(`## 3- FFinal Summary and Questions for ${name}\n`);

console.log(summary);
