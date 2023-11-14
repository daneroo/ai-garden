import { getSource } from "./lib/sources.mjs";

import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import {
  RunnableSequence,
  RunnablePassthrough,
} from "langchain/schema/runnable";
import { StringOutputParser } from "langchain/schema/output_parser";
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";
import { formatDocumentsAsString } from "langchain/util/document";

const sourceNickname = "thesis.epub";
const { name, question, loader } = getSource(sourceNickname);

console.log(`## 0- Fetch/spit/store document (${name})\n`);

const docs = await loader.load();

const splitter = new RecursiveCharacterTextSplitter({
  chunkOverlap: 0,
  chunkSize: 500,
});

const splitDocuments = await splitter.splitDocuments(docs);

const vectorstore = await HNSWLib.fromDocuments(
  splitDocuments,
  new HuggingFaceTransformersEmbeddings()
);

// 1- demonstrate similarity search
console.log(`## 1- Similarity search results: (question: ${question})\n`);

const retrievedDocs = await vectorstore.similaritySearch(question);
// aDoc = {
//   pageContent: "content",
//   metadata: {
//     source: "https://lilianweng.github.io/posts/2023-06-23-agent/",
//     loc: {
//       lines: {
//         from: 182,
//         to: 182,
//       },
//     },
//   },
// };
for (const doc of retrievedDocs) {
  // console.log(JSON.stringify(doc, null, 2));
  const { pageContent, metadata } = doc;
  const { source, loc } = metadata;
  console.log(
    `- ${source} (${loc.lines.from}-${loc.lines.to})\n${pageContent}`
  );
}
// extra newline
console.log("");

const retriever = vectorstore.asRetriever();

// Prompt
const prompt =
  PromptTemplate.fromTemplate(`Answer the question based only on the following context:
{context}

Question: {question}`);

// Llama 2 7b wrapped by Ollama
const model = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama2",
  // model: "mistral",
});

const chain = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocumentsAsString),
    question: new RunnablePassthrough(),
  },
  prompt,
  model,
  new StringOutputParser(),
]);

console.log(`## 2- Invoke chain (QA): (question: ${question})\n`);

const result = await chain.invoke(question);

console.log(result);
