import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { getSource } from "../lib/sources.mjs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import crypto from "node:crypto";
// This now works, but llmKey: '_model:"base_chat_model",_type:"ollama"' does not distinguish between ollama models.
// import { LocalFileCache } from "langchain/cache/file_system";

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

  console.log(`## Chat modelName: ${modelName}:\n`);

  const promptTemplateText = `
  You are an expert in summarizing stories.
  Your goal is to create a summary of a story.
  Below you find an excerpt of the story:
  --------
  {text}
  --------
  
  Total output will be a summary of the excerpt.
  
  SUMMARY:
  `;

  for (const [i, chunk] of chunks.entries()) {
    const start = +new Date();
    const result = await cachedAllInOne({
      modelName,
      promptTemplateText,
      chunkContent: chunk.pageContent,
    });

    const elapsesSeconds = ((+new Date() - start) / 1000).toFixed(2);
    const rate = (chunk.pageContent.length / elapsesSeconds).toFixed(2);
    console.log(
      `\n- Chunk ${i} (${elapsesSeconds}s rate:${rate}b/s):\n${result}`
    );
  }
}

async function allInOne({ modelName, promptTemplateText, chunkContent }) {
  // const cacheDir = "cache";
  // const cache = new LocalFileCache(cacheDir);

  // if (false) {
  //   const prompt = "prompt";
  //   const llmKey = "llmKey";
  //   const generations = ["generation1", "generation2"];
  //   console.log("update", { prompt, llmKey, generations });

  //   await cache.update(prompt, llmKey, generations);
  //   const result = await cache.lookup(prompt, llmKey);
  //   console.log("lookup", { prompt, llmKey, result });
  // }

  const model = new ChatOllama({
    // We will use out own Cache implementation
    // cache: cache,
    baseUrl: "http://localhost:11434",
    model: modelName,
    maxConcurrency: 1,
    // verbose: true,
  });
  const promptTemplate = PromptTemplate.fromTemplate(promptTemplateText);
  const chain = RunnableSequence.from([promptTemplate, model]);
  const result = await chain.invoke({
    text: chunkContent,
  });
  return result.content;
}

function cacheKey({ modelName, promptTemplateText, chunkContent }) {
  // hash the prompt template and chunk content
  // to create a cache key
  const hash = crypto.createHash("sha256");
  hash.update(promptTemplateText);
  hash.update(chunkContent);
  const contentHash = hash.digest("hex");
  return `${modelName}-${contentHash}`;
}

async function cachedAllInOne({ modelName, promptTemplateText, chunkContent }) {
  const key = cacheKey({ modelName, promptTemplateText, chunkContent });
  const cacheFilePath = join("cache", `${key}.txt`);

  try {
    // Check if the cache file exists and return its content if it does
    const cachedResult = await fs.readFile(cacheFilePath, "utf8");
    return cachedResult;
  } catch (error) {
    // If the file doesn't exist, catch the error and proceed to compute the result
    if (error.code !== "ENOENT") {
      throw error; // Re-throw non-file-not-found errors
    }

    // Call allInOne to get the result
    const result = await allInOne({
      modelName,
      promptTemplateText,
      chunkContent,
    });

    // Store the result in the cache file
    await fs.writeFile(cacheFilePath, result, "utf8");

    return result;
  }
}
async function getChunks() {
  const maxDocs = 89; // hero: 15 - Part One, 89 - Epilogue
  // RecursiveCharacterTextSplitter
  const chunkSize = 8000;
  const chunkOverlap = 100;
  const maxChunks = 9999999;

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
