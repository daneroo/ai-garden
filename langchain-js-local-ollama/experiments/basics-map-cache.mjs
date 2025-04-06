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
import { Document } from "langchain/document";

await main();
async function main() {
  console.log(`# Basics Map/reduce Operation

Here we simply invoke a chain (RunnableSequence)
to summarize a story "by parts".
It is invoked repeatedly on chunks of text.

The summaries themselves are then concatenated.
This is the reduction part.

This summarization is repeated until a sufficiently concise summary is reached.

\n`);

  // const maxDocs = 89; // hero: 15 - Part One, 89 - Epilogue
  // const sourceNickname = "hero-of-ages.epub";

  const maxDocs = 999;
  // const sourceNickname = "neon-shadows.txt";
  // const sourceNickname = "thesis.epub";
  // const sourceNickname = "secret-history.epub";
  // const sourceNickname = "long-game.epub";
  const sourceNickname = "ancestors-tale.epub";

  const docs = await getDocs({ sourceNickname, maxDocs });

  const chunkSize = 8000000;
  const chunkOverlap = 100;
  const maxChunks = 9999999;
  const chunkParams = { chunkSize, chunkOverlap, maxChunks };

  const verbose = false;
  const modelName = "llama3.1:8b"; // llama2,mistral,llama3.1:8b,qwen2.5-coder:32b

  console.log(`## Parameters\n`);
  console.log(`  - sourceNickname: ${sourceNickname}`);
  console.log(`  - modelName: ${modelName}`);
  console.log(`  - chunkSize: ${chunkSize}`);

  const textKind = "scientific text"; // or "historical document", "essay", "transcript", etc.
  const promptTemplateText = `
  You are an expert in summarizing this type of ${textKind}.
  Your task is to write a clear and concise summary of the following excerpt(s).
  
  Guidelines:
  - Do not preface the summary with phrases like "Here is a summary" or "Summary:"
  - Do not reference your task, your role, or the type of text
  - Do not comment on what the excerpt appears to be (e.g., table of contents, copyright page, image reference)
  - Do not speculate about missing text or request more content
  - Always write a neutral summary in plain text, regardless of what the excerpt contains
  
  Examples of BAD summaries:
  x- "There seems to be no excerpt provided. Please provide the scientific text, and I will create a clear and concise summary for you."
  x- "This text appears to be the copyright page of a book, providing information about the publication history..."
  x- "There is no text provided. The only content is an image file referenced by '[../images/00001.jpeg]' and metadata indicating this."
  x- "This text contains ..."
  
  --------
  {text}
  --------
  `;

  async function summarize(docs, level) {
    console.log(`\n## Level ${level} Summarization\n`);
    console.log(`- Level ${level} input summary:`);
    console.log(`  - ${docs.length} docs, length: ${docsLength(docs)}`);
    const chunks = await getChunks({ docs, ...chunkParams });
    console.log(
      `  - split into ${chunks.length} chunks, length: ${docsLength(chunks)}`
    );

    const summary = await reduce(chunks, modelName, promptTemplateText, level);
    return summary;
  }
  console.log(`Summarizing ${sourceNickname}`);
  const level0Summary = await summarize(docs, 0);
  const summaries = [level0Summary];
  while (summaries[summaries.length - 1].pageContent.length > 5000) {
    const level = summaries.length;
    const summary = await summarize([summaries[summaries.length - 1]], level);
    summaries.push(summary);
  }
  // Now print the last 2 summaries
  const last2Summaries = summaries.slice(-2).reverse();
  for (const summary of last2Summaries) {
    console.log(`\n## ${summary.metadata.source}\n`);
    console.log(summary.pageContent);
    console.log();
  }
}

// return the total length of all docs in
// formatted as a single string
function docsLength(docs) {
  const bytes = docs.reduce(
    (total, doc) => total + (doc?.pageContent?.length ?? 0),
    0
  );
  if (bytes < 1000) {
    return `${bytes} bytes`;
  }
  const kB = (bytes / 1000).toFixed(2);
  return `${kB} kB`;
}

// summarize an array of docs into a single document
async function reduce(chunks, modelName, promptTemplateText, level) {
  const summaryDocs = [];
  console.log(`\n- Level ${level} progress:`);

  for (const [i, chunk] of chunks.entries()) {
    const start = +new Date();
    const result = await cachedAllInOne({
      modelName,
      promptTemplateText,
      chunkContent: chunk.pageContent,
    });

    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    const rate = (chunk.pageContent.length / elapsed).toFixed(2);
    console.log(`  - Level ${level} Chunk ${i} (${elapsed}s rate:${rate}b/s):`);
    // console.log(result);
    const doc = new Document({
      pageContent: result,
      metadata: { source: `Level ${level} Summary of chunk ${i}` },
    });
    summaryDocs.push(doc);
  }
  console.log(`\n- Level ${level} output summary:`);
  console.log(
    `  - ${summaryDocs.length} docs, length: ${docsLength(summaryDocs)}`
  );

  const concatenatedSummaryDoc = new Document({
    pageContent: summaryDocs.reduce(
      (total, doc) => total + doc.pageContent + "\n\n",
      ""
    ),
    metadata: { source: `Level ${level} Summary` },
  });
  return concatenatedSummaryDoc;
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

async function getDocs({ sourceNickname, maxDocs }) {
  const { name, loader, contentDocumentStartIndex } = getSource(sourceNickname);
  const docs = (await loader.load())
    .slice(contentDocumentStartIndex)
    .slice(0, maxDocs)
    // filter out docs that have no pageContent
    .filter((doc) => "pageContent" in doc);
  return docs;
}
async function getChunks({ docs, chunkSize, chunkOverlap, maxChunks }) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });

  const splitDocuments = (await splitter.splitDocuments(docs)).slice(
    0,
    maxChunks
  );
  return splitDocuments;
}
