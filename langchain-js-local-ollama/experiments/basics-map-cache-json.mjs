import { ChatOllama } from "langchain/chat_models/ollama";
import { Ollama } from "langchain/llms/ollama";

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
  console.log(`
# Basics Map/Reduce Operation

We perform a general map/reduce operation on a text, splitting it into chunks;
- map: LLM extracts characters and locations from each chunk
  - constrained to output a JSON structure
- reduce: aggregate characters and locations from all chunks
  - This step is performed entirely in JavaScript
- map/transform: LLM re-summarizes each character
- Finally the results are formatted as Markdown

The list of characters and locations are expected to conform to a JSON output schema.

`);

  // const maxDocs = 89; // hero: 15 - Part One, 89 - Epilogue
  // const sourceNickname = "hero-of-ages.epub";

  const maxDocs = 999;
  const sourceNickname = "neon-shadows.txt";
  // const sourceNickname = "thesis.epub";

  const docs = await getDocs({ sourceNickname, maxDocs });

  const chunkSize = 1000;
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

  // Level 0: Extract characters' name/description from each chunk
  console.log(`\n## Level 0 Character Extraction\n`);
  console.log(`- Level 0 input summary:`);
  console.log(`  - ${docs.length} docs, length: ${docsLength(docs)}`);
  const chunks = await getChunks({ docs, ...chunkParams });
  console.log(
    `  - split into ${chunks.length} chunks, length: ${docsLength(chunks)}`
  );

  const rawCharacterDocs = await extractRawCharacters(
    chunks,
    modelName,
    schema,
    templateFString
  );

  // Level 1: Aggregate by character
  const aggregatedCharacterDocs = await aggregateByCharacter(rawCharacterDocs);

  // Level 2: summarize each character, return a single concatenated document
  const summaryDocs = await reSummarizeAggregatedCharacters(
    aggregatedCharacterDocs,
    modelName
  );
  printDocs(
    aggregatedCharacterDocs,
    "Level 1 Aggregate Character Descriptions"
  );
  printDocs(summaryDocs, "Level 2 Character Summaries");
  // Legacy from when we had multiple summaries (levels)
  // const summaries = [concatenatedSummaryDoc];
  // const last2Summaries = summaries.slice(-2).reverse();
  // for (const summary of last2Summaries) {
  //   console.log(`\n## ${summary.metadata.source}\n`);
  //   console.log(summary.pageContent);
  //   console.log();
  // }
}

// print the documents with their metadata.source as title
// if pageContent is JSON it's :{"name": string, "descriptions": string[]}
// else it's the text to be rendered
async function printDocs(docs, title) {
  console.log(`\n## ${title}:\n`);
  for (const doc of docs) {
    console.log(`\n### ${doc.metadata.source}\n`);

    // if JSON it's :{"name": string, "descriptions": string[]}
    // else it's the text to be rendered
    try {
      const json = JSON.parse(doc.pageContent);
      const { name, descriptions } = json;
      console.log(
        `Description of ${name} (${descriptions.length} mentions):\n`
      );
      console.log(descriptions.map((d) => `- ${d}`).join("\n"));
    } catch (error) {
      console.log(doc.pageContent);
    }
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

// Aggregate the character descriptions from all chunks
// return one document per character,
// pageContent is JSON encoded as an array of descriptions
//  {
//   name: "Vin",
//   descriptions: ["desc1", "desc2"],
// };
// input: array of documents, each containing a JSON array of characters
async function aggregateByCharacter(rawCharacterDocs) {
  console.log(`\n## Level 1 Character Aggregation\n`);
  console.log(`- Level 1 input summary:`);
  console.log(
    `  - ${rawCharacterDocs.length} docs, length: ${docsLength(
      rawCharacterDocs
    )}`
  );

  const mergedCharacterMap = rawCharacterDocs.reduce((accObj, doc) => {
    // console.log(`  - Merging ${doc.metadata.source}`);
    const json = JSON.parse(doc.pageContent);
    // console.log({ json });
    json.characters.forEach((char) => {
      // Initialize with an empty array for new characters or append to existing array
      accObj[char.name] = accObj[char.name]
        ? [...accObj[char.name], char.description]
        : [char.description];
    });
    return accObj;
  }, {});

  console.log(`
<details>
<summary>- Level 1 progress:</summary>
`);

  // Output 1 document per character,
  // optionally filtered by minDescriptionCount
  // order by number of descriptions, or alphabetically (.sort())
  const minDescriptionCount = 0;
  let first = true;
  const aggregatedCharacterDocs = Object.entries(mergedCharacterMap)
    .filter(([key, descriptions]) => descriptions.length > minDescriptionCount)
    // .sort(([kA], [kB]) => kA.localeCompare(kB)) // Uncomment for alphabetical sorting
    .sort(([kA, dA], [kB, dB]) => dB.length - dA.length)
    .map(([name, descriptions]) => {
      if (first) {
        first = false;
        console.log(`
Example json output:
\`\`\`json
${JSON.stringify({ name, descriptions }, null, 2)}
\`\`\`
    `);
      }

      console.log(
        `  - Level 1 Character name:${name} mentions:${descriptions.length}`
      );

      return new Document({
        pageContent: JSON.stringify({ name, descriptions }, null, 2),
        // The `source` attribute will ne shown as title in the output
        metadata: {
          source: `${name} (${descriptions.length} mentions) - Level 1 Aggregation by Character`,
        },
      });
    });
  console.log(`</details>`);
  console.log(`\n- Level 1 output summary:`);
  console.log(
    `  - ${aggregatedCharacterDocs.length} docs, length: ${docsLength(
      aggregatedCharacterDocs
    )}`
  );

  return aggregatedCharacterDocs;
}

async function reSummarizeAggregatedCharacters(
  aggregatedCharacterDocs,
  modelName
) {
  console.log(`\n## Level 2 Character Description Summarization\n`);
  console.log(`- Level 2 input summary:`);
  console.log(
    `  - ${aggregatedCharacterDocs.length} docs, length: ${docsLength(
      aggregatedCharacterDocs
    )}`
  );

  console.log(`
<details>
<summary>- Level 2 progress:</summary>
`);

  const summaryDocs = []; // one per character
  for (const doc of aggregatedCharacterDocs) {
    const json = JSON.parse(doc.pageContent);
    const { name, descriptions } = json;
    // console.log(`+++++ ${name}: has ${descriptions.length} descriptions`);

    const start = +new Date();
    // re-summarize each character
    const llmResult = await cachedReSummarizeOneCharacter({
      modelName,
      name,
      descriptions,
    });
    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    const rate = (llmResult.length / elapsed).toFixed(2);
    console.log(
      `  - Level 2 Character name:${name} mentions:${descriptions.length} (${elapsed}s rate:${rate}b/s)`
    );
    const summaryDoc = new Document({
      pageContent: llmResult,
      // The `source` attribute will ne shown as title in the output
      metadata: {
        source: `${name} (${descriptions.length} mentions) - Level 2 Character Summary`,
      },
    });
    summaryDocs.push(summaryDoc);
  }
  console.log(`</details>`);

  return summaryDocs;
}

async function reSummarizeOneCharacter({ modelName, name, descriptions }) {
  const llm = new Ollama({
    baseUrl: "http://localhost:11434",
    model: modelName,
    maxConcurrency: 1,
  });
  const llmResult = await llm.predict(`
You will be given a description of a single story character.

Reformulate the following character description precisely.
You may recombine, rephrase, or reword the given description.
Keep all details.
Reformulate in paragraph form.

CHARACTER NAME: ${name}
DESCRIPTIONS:

${descriptions.join("\n")}

REFORMULATED DESCRIPTION:
`);
  return llmResult;
}

async function cachedReSummarizeOneCharacter({
  modelName,
  name,
  descriptions,
}) {
  // Synthetic values to fin into existing cacheKey signature
  const schema = z.object({});
  const templateFString = "";
  const chunkContent = name + descriptions.join("\n");

  const key = cacheKey({ modelName, schema, templateFString, chunkContent });
  const cacheFilePath = join("cache", `${key}.txt`);
  // console.debug(`  .. Cache file path: ${cacheFilePath}`);

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
    const result = await reSummarizeOneCharacter({
      modelName,
      name,
      descriptions,
    });

    // Store the result in the cache file
    await fs.writeFile(cacheFilePath, JSON.stringify(result), "utf8");

    return result;
  }
}

// This returns one document per chunk
async function extractRawCharacters(
  chunks,
  modelName,
  schema,
  templateFString
) {
  console.log(`
<details>
<summary>- Level 0 progress:</summary>
`);
  const characterDocs = [];
  for (const [i, chunk] of chunks.entries()) {
    const start = +new Date();
    const result = await cachedExtractFromChunkAsJSON({
      modelName,
      schema,
      templateFString,
      chunkContent: chunk.pageContent,
    });

    if (i == 0) {
      console.log(`
Example json output:
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`
  `);
    }

    const elapsed = ((+new Date() - start) / 1000).toFixed(2);
    const rate = (chunk.pageContent.length / elapsed).toFixed(2);
    console.log(
      `  - Level 0 Chunk ${i}/${chunks.length} ${result?.characters?.length} characters (${elapsed}s rate:${rate}b/s)`
    );
    // TODO(daneroo): in this case, we should not need to stringify, just return the parsed JSON
    const doc = new Document({
      pageContent: JSON.stringify(result, null, 2),
      metadata: { source: `Level 0 Summary of chunk ${i}` },
    });
    characterDocs.push(doc);
  }
  console.log(`</details>`);
  console.log(`\n- Level 0 output summary:`);
  console.log(
    `  - ${characterDocs.length} docs, length: ${docsLength(characterDocs)}`
  );
  return characterDocs;
}

// extract character/locations from a chunk of text
async function extractFromChunkAsJSON({
  modelName,
  schema,
  templateFString,
  chunkContent,
}) {
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
  //   `******- Hashing schema from format instructions:`,
  //   formatInstructions
  // );
  hash.update(formatInstructions);
  hash.update(templateFString);
  hash.update(chunkContent);
  const contentHash = hash.digest("hex");
  return `${modelName}-${contentHash}`;
}

async function cachedExtractFromChunkAsJSON({
  modelName,
  schema,
  templateFString,
  chunkContent,
}) {
  const key = cacheKey({ modelName, schema, templateFString, chunkContent });
  const cacheFilePath = join("cache", `${key}.txt`);
  // console.debug(`  .. Cache file path: ${cacheFilePath}`);

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
    const result = await extractFromChunkAsJSON({
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
