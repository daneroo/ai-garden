import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { getSource } from "../lib/sources.mjs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
// import { LocalFileCache } from "langchain";

await main();
async function main() {
  console.log(`# Basics Map Operation

Here we simply invoke a chain (RunnableSequence)
to summarize a story "by parts".

It is invoked repeatedly on chunks of text.

\n`);

  const chunks = await getChunks();

  const verbose = false;
  const modelName = "llama2"; // llama2,mistral

  // const cache = await new LocalFileCache({});

  const model = new ChatOllama({
    cache: true,
    baseUrl: "http://localhost:11434",
    model: modelName,
    maxConcurrency: 1,
    // verbose: true,
  });

  console.log(`## Chat modelName: ${modelName}:\n`);

  const promptTemplate = PromptTemplate.fromTemplate(`
You are an expert in summarizing stories.
Your goal is to create a summary of a story.
Below you find an excerpt of the story:
--------
{text}
--------

Total output will be a summary of the excerpt.

SUMMARY:
`);

  const chain = RunnableSequence.from([promptTemplate, model]);

  for (const [i, chunk] of chunks.entries()) {
    const start = +new Date();
    const result = await chain.invoke({
      text: chunk.pageContent,
    });
    const elapsesSeconds = ((+new Date() - start) / 1000).toFixed(2);
    const rate = (chunk.pageContent.length / elapsesSeconds).toFixed(2);
    console.log(
      `\n- Chunk ${i} (${elapsesSeconds}s rate:${rate}b/s):\n${result.content}`
    );
  }
}

async function getChunks() {
  const maxDocs = 15; // hero: 15 - Part One, 89 - Epilogue
  // RecursiveCharacterTextSplitter
  const chunkSize = 8000;
  const chunkOverlap = 100;
  const maxChunks = 10; //9999999;

  const sourceNickname = "hero-of-ages.epub"; // neon-shadows.txt, hero-of-ages.epub
  const { name, loader, contentDocumentStartIndex } = getSource(sourceNickname);
  const docs = (await loader.load())
    .slice(contentDocumentStartIndex)
    .slice(0, maxDocs);
  console.log(`  - fetched ${docs.length} document(s)`);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const splitDocuments = (await splitter.splitDocuments(docs)).splice(
    0,
    maxChunks
  );
  console.log(
    `  - split into ${splitDocuments.length} document chunks maxSize: ${chunkSize}`
  );
  return splitDocuments;
}
