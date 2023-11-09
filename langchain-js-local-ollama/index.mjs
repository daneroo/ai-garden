import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
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

console.log(`## 0- Fetch/spit/store document (cheerio)\n`);

const loader = new CheerioWebBaseLoader(
  "https://lilianweng.github.io/posts/2023-06-23-agent/"
);
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
const question = "What are the approaches to Task Decomposition?";
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

/*
  Based on the provided context, there are three approaches to task decomposition:

  1. Using simple prompts like "Steps for XYZ" or "What are the subgoals for achieving XYZ?" to elicit a list of tasks from a language model (LLM).
  2. Providing task-specific instructions, such as "Write a story outline" for writing a novel, to guide the LLM in decomposing the task into smaller subtasks.
  3. Incorporating human inputs to help the LLM learn and improve its decomposition abilities over time.
*/
