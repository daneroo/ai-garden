import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { getSource } from "../lib/sources.mjs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";

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
to extract characters and locations from a text.
It is invoked repeatedly on chunks of the text.

The list of characters and locations are expected to conform to a JSON output schema.

\n`);

  // const maxDocs = 89; // hero: 15 - Part One, 89 - Epilogue
  // const sourceNickname = "hero-of-ages.epub";

  const maxDocs = 999;
  // const sourceNickname = "neon-shadows.txt";
  const sourceNickname = "thesis.epub";

  const docs = await getDocs({ sourceNickname, maxDocs });

  const chunkSize = 8000;
  const chunkOverlap = 100;
  const maxChunks = 9999999;
  const chunkParams = { chunkSize, chunkOverlap, maxChunks };

  const verbose = false;
  const modelName = "llama2"; // llama2, mistral

  console.log(`## Parameters\n`);
  console.log(`  - sourceNickname: ${sourceNickname}`);
  console.log(`  - modelName: ${modelName}`);
  console.log(`  - chunkSize: ${chunkSize}`);

  const schemaAndTemplateFString = {
    schema: z
      .object({
        characters: z.array(
          z.object({
            name: z.string().describe("name of the character"),
            description: z
              .string()
              .describe("short description of the character"),
          })
        ),
      })
      .describe("A list of characters"),
    templateFString: `
You are an attentive and thorough reader.
Your goal is to create a comprehensive list of characters in a story.
Prefer full names over nicknames or first names.
Below you find an extract of the story:
--------
{text}
--------

- Only show the list of characters.
- For each character, specify their name and a very short description.

Format the output as JSON.
{format_instructions}

Only include the JSON Output. 

ABSOLUTELY No other text is allowed.
For example, do NOT include the following text in your output:
---
Here is the list of characters in the story, formatted as a JSON object:
---

JSON:
    `,
  };

  const { schema, templateFString } = schemaAndTemplateFString;

  async function summarize(docs, level) {
    console.log(`\n## Level ${level} Character Summarization\n`);
    console.log(`- Level ${level} input summary:`);
    console.log(`  - ${docs.length} docs, length: ${docsLength(docs)}`);
    const chunks = await getChunks({ docs, ...chunkParams });
    console.log(
      `  - split into ${chunks.length} chunks, length: ${docsLength(chunks)}`
    );

    const summary = await reduce(
      chunks,
      modelName,
      schema,
      templateFString,
      level
    );
    return summary;
  }
  const level0Summary = await summarize(docs, 0);

  // No recursion for now
  const summaries = [level0Summary];

  // while (summaries[summaries.length - 1].pageContent.length > 5000) {
  //   const level = summaries.length;
  //   const summary = await summarize([summaries[summaries.length - 1]], level);
  //   summaries.push(summary);
  // }
  // Now print the last 2 summaries
  const last2Summaries = summaries.slice(-2).reverse();
  for (const summary of last2Summaries) {
    console.log(`\n## ${summary.metadata.source}\n`);
    // console.log(summary.pageContent);
    console.log();
  }
}

// return the total length of all docs in
// formatted as a single string
function docsLength(docs) {
  const bytes = docs.reduce((total, doc) => total + doc.pageContent.length, 0);
  if (bytes < 1000) {
    return `${bytes} bytes`;
  }
  const kB = (bytes / 1000).toFixed(2);
  return `${kB} kB`;
}

// summarize an array of docs into a single document
async function reduce(chunks, modelName, schema, templateFString, level) {
  const summaryDocs = [];
  console.log(`\n- Level ${level} progress:`);

  for (const [i, chunk] of chunks.entries()) {
    const start = +new Date();
    const result = await cachedAllInOne({
      modelName,
      schema,
      templateFString,
      chunkContent: chunk.pageContent,
    });

    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    const rate = (chunk.pageContent.length / elapsed).toFixed(2);
    console.log(
      `  - Level ${level} Chunk ${i}/${chunks.length} (${elapsed}s rate:${rate}b/s):`
    );
    console.log(result);
    const doc = new Document({
      pageContent: JSON.stringify(result, null, 2),
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

async function allInOne({ modelName, schema, templateFString, chunkContent }) {
  const model = new ChatOllama({
    // We will use out own Cache implementation
    // cache: cache,
    baseUrl: "http://localhost:11434",
    model: modelName,
    maxConcurrency: 1,
    temperature: 0.1,
    format: "json", // seems to help llama2, in this case
    // timeout: 30_000, //30s THIS DOES NOT ACTUALLY TIMEOUT!
    // verbose: true,
  });
  const parser = StructuredOutputParser.fromZodSchema(schema);

  // console.log("Parser instructions:\n", parser.getFormatInstructions());

  const promptTemplate = PromptTemplate.fromTemplate(templateFString);

  const chain = RunnableSequence.from([promptTemplate, model, parser]);

  let attempts = 0;
  while (attempts < 5) {
    try {
      attempts++;
      const result = await chain.invoke({
        text: chunkContent,
        format_instructions: parser.getFormatInstructions(),
      });
      return result;
    } catch (err) {
      console.error(err);
      console.log(
        `  .. Failed to parse text (attempt ${attempts}). Retrying...`
      );
    }
  }
  return {
    characters: [],
  };
}

function cacheKey({ modelName, schema, templateFString, chunkContent }) {
  // hash the prompt template and chunk content
  // to create a cache key
  const hash = crypto.createHash("sha256");
  const parser = StructuredOutputParser.fromZodSchema(schema);
  const formatInstructions = parser.getFormatInstructions();
  // console.log(
  //   `******- Hashing schema from format intructions:`,
  //   formatInstructions
  // );
  hash.update(formatInstructions);
  hash.update(templateFString);
  hash.update(chunkContent);
  const contentHash = hash.digest("hex");
  return `${modelName}-${contentHash}`;
}

async function cachedAllInOne({
  modelName,
  schema,
  templateFString,
  chunkContent,
}) {
  const key = cacheKey({ modelName, schema, templateFString, chunkContent });
  const cacheFilePath = join("cache", `${key}.txt`);
  console.debug(`  .. Cache file path: ${cacheFilePath}`);

  try {
    // Check if the cache file exists and return its content if it does
    const cachedResult = JSON.parse(await fs.readFile(cacheFilePath, "utf8"));
    return cachedResult;
  } catch (error) {
    // If the file doesn't exist, catch the error and proceed to compute the result
    if (error.code !== "ENOENT") {
      throw error; // Re-throw non-file-not-found errors
    }

    // Call allInOne to get the result
    const result = await allInOne({
      modelName,
      schema,
      templateFString,
      chunkContent,
    });

    // Store the result in the cache file
    await fs.writeFile(cacheFilePath, JSON.stringify(result), "utf8");

    return result;
  }
}

async function getDocs({ sourceNickname, maxDocs }) {
  const { name, loader, contentDocumentStartIndex } = getSource(sourceNickname);
  const docs = (await loader.load())
    .slice(contentDocumentStartIndex)
    .slice(0, maxDocs);
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
