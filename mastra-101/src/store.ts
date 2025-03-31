import { MDocument } from "@mastra/rag";
import { ollama } from "ollama-ai-provider";
import { embedMany, embed } from "ai";
import { parse, HTMLElement } from "node-html-better-parser";
import { writeFile } from "node:fs/promises";
import { QueryResult } from "@mastra/core";
import { mastra } from "./mastra";
import crypto from "node:crypto";

// TODO: These should be cli flags!
const FORCE_RECREATE_INDEX = false;
const VERBOSE = false;
// invoke async main (which is hoisted, so this is ok)
main();

async function main() {
  try {
    // Load the paper
    console.log("\n- Loading data source HTML...");
    const response = await fetch(
      "https://www.gutenberg.org/files/8438/8438-h/8438-h.htm"
    );
    const htmlText = await response.text();

    // const gutenChunks = await gutenParse(htmlText);
    // console.log("Number of GutenChunks:", gutenChunks.length);
    // console.log("\nGutenChunks:");
    // showChunks(gutenChunks, 20, 40);
    // // Exit early to analyze chunks
    // process.exit(0);

    // Create document and chunk it
    console.log("\n- Parsing/Chunking HTML...");
    const root = parse(htmlText);
    const structuredText =
      root.querySelector("body")?.structuredText ?? root.structuredText;
    const doc = MDocument.fromText(structuredText, {
      title: "The Nicomachean Ethics of Aristotle",
    });
    const chunks = await doc.chunk({
      // size: 1000,
    });

    // Parse and chunk the Gutenberg text
    const avgChunkLength = Math.round(
      chunks.reduce((a, b) => a + b.text.length, 0) / chunks.length
    );
    const maxChunkLength = Math.max(...chunks.map((c) => c.text.length));
    const minChunkLength = Math.min(...chunks.map((c) => c.text.length));
    console.log(
      `  - Number of chunks: ${chunks.length} avg: ${avgChunkLength} min: ${minChunkLength} max: ${maxChunkLength}`
    );
    if (VERBOSE) {
      console.log(`\n- Showing chunks: (VERBOSE:${VERBOSE})`);
      showChunks(chunks, 5, 30);
    }

    // Initialize vector store
    //  This should be imported from mastra
    const vectorStore = mastra.getVector("libsql");

    // Generate embeddings
    console.log("\n- Generating embeddings...");
    const { embeddings } = await embedMany({
      model: ollama.embedding("mxbai-embed-large"),
      values: chunks.map((chunk) => chunk.text),
    });

    // Create index
    const indexName = "ethics";
    console.log(`\n- Creating/Updating index ${indexName}...`);
    const idxs = await vectorStore.listIndexes();
    console.log(`  - Existing Vector store indexes: ${idxs}`);

    if (idxs.includes(indexName)) {
      console.log(
        `  - Index: ${indexName} already exists && FORCE_RECREATE_INDEX: ${FORCE_RECREATE_INDEX}`
      );
      const description = await vectorStore.describeIndex(indexName);
      console.log(
        `    - Index ${indexName} description: ${JSON.stringify(description)}`
      );

      if (FORCE_RECREATE_INDEX) {
        console.log(
          `  - Deleting index: ${indexName}... because FORCE_RECREATE_INDEX: ${FORCE_RECREATE_INDEX}`
        );
        await vectorStore.deleteIndex(indexName);
      }
    }
    console.log(`  - Creating index: ${indexName}...`);
    await vectorStore.createIndex({
      indexName,
      dimension: 1024, // Dimensions for mxbai-embed-large
    });

    // Store embeddings and metadata
    console.log("\n- Storing embeddings and metadata...");
    await vectorStore.upsert({
      indexName,
      vectors: embeddings,
      ids: chunks.map((chunk) =>
        // let's get a consistent id (content hash sha256)
        crypto.createHash("sha256").update(chunk.text).digest("hex")
      ),
      metadata: chunks.map((chunk) => ({
        text: chunk.text,
        book: chunk.metadata.book,
        // xpath: chunk.metadata.xpath,
      })),
    });
    console.log(`  - Upserted ${embeddings.length} embeddings`);
    const description = await vectorStore.describeIndex(indexName);
    console.log(
      `    - Index ${indexName} description: ${JSON.stringify(description)}`
    );

    // let test a query!
    console.log("\n- Querying index...");
    const query = "What is the ultimate virtue?";
    console.log(`  - Querying index: ${indexName} with: ${query}...`);
    const { embedding } = await embed({
      value: query,
      model: ollama.embedding("mxbai-embed-large"),
    });

    const results = await vectorStore.query({
      indexName,
      queryVector: embedding,
      topK: 2,
    });

    console.log("- Query results:");
    showResult(results);

    console.log("- Done!");
  } catch (error) {
    console.error("Error processing document:", error);
    process.exit(1);
  }
}

function showResult(results: QueryResult[], snippetLength = 40) {
  for (const result of results) {
    const { id, score, metadata } = result;
    if (!metadata) continue;

    // Show metadata on one line
    const metadataLine = Object.entries(metadata)
      .filter(([key]) => key !== "text")
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    console.log(`-id: ${id}, score: ${score}, ${metadataLine}`);

    // Show text snippet on next line
    const displayText = metadata.text.trim().replace(/\s+/g, " ");
    console.log(
      `  -text(${metadata.text.length}): |${displayText.slice(
        0,
        snippetLength
      )}...|`
    );
  }
}

function showChunks(chunks: any[], nChunks = 100, snippetLength = 40) {
  console.log(
    `\nShowing (max) ${nChunks} chunks (first ${snippetLength} chars each):`
  );
  chunks.slice(0, nChunks).forEach((chunk, i) => {
    console.log(
      `\nChunk ${i + 1}:`,
      "Metadata:",
      JSON.stringify(chunk.metadata, null, 2).replace(/\n/g, " ")
    );
    const displayText = chunk.text.trim().replace(/\s+/g, " ");
    console.log(
      `Text(${chunk.text.length}): |${displayText.slice(0, snippetLength)}...|`
    );
    console.log("-".repeat(80));
  });
}

async function gutenParse(htmlText: string) {
  const root = parse(htmlText);
  await writeFile(`./data/guten/html/all.html`, htmlText);
  await writeFile(`./data/guten/text/all.txt`, root.structuredText);

  // Initialize strings for frontmatter and endmatter
  let frontmatterHtml = "";
  let endmatterHtml = "";

  // Get all chapters first
  const chapters = new Set(root.querySelectorAll("div.chapter"));
  const chapterArray = Array.from(chapters);
  const lastChapter = chapterArray[chapterArray.length - 1];

  // Get all direct children of body
  const bodyChildren = root.querySelector("body")?.childNodes || [];

  let foundFirstChapter = false;
  let afterLastChapter = false;
  let chapterCount = 0;
  for (const node of bodyChildren) {
    if (node instanceof HTMLElement && chapters.has(node)) {
      chapterCount++;
      foundFirstChapter = true;
      if (node === lastChapter) {
        console.log("- Found last chapter.");
        afterLastChapter = true;
      }

      // Create and chunk this chapter
      const chapterTitle = node.querySelector("h2")?.text?.trim();
      const chapterDoc = MDocument.fromHTML(node.outerHTML, {
        title: "The Nicomachean Ethics of Aristotle",
        chapter: chapterTitle,
      });

      // Log the chapter title for debugging
      console.log(
        `- Found chapter ${chapterCount}: ${chapterTitle} (${node.outerHTML.length})`
      );
      // write the chapter to a file
      await writeFile(
        `./data/guten/html/chapter-${chapterCount}.html`,
        node.outerHTML
      );
      await writeFile(
        `./data/guten/text/chapter-${chapterCount}.txt`,
        parse(node.outerHTML).structuredText
      );

      // Chunk the chapter and show results
      const chunks = await chapterDoc.chunk({
        headers: [["h3", "section"]],
        size: 1000, // Control chunk size
      });
      // compare the length of the chunks to the length of the chapter
      const chunkLengths = chunks.map((c) => c.text.length);
      const totalChunksLength = chunkLengths.reduce((a, b) => a + b, 0);
      console.log(
        `  - chapter ${chapterCount} html: ${node.outerHTML.length}) sumchunks: ${totalChunksLength}`
      );
      for (const [i, chunk] of chunks.entries()) {
        console.log(`  - wrting chunk ${i} ${chunk.text.length}`);
        await writeFile(
          `./data/guten/html/chapter-${chapterCount}-chunk-${i}.html`,
          chunk.text
        );
        await writeFile(
          `./data/guten/text/chapter-${chapterCount}-chunk-${i}.txt`,
          chunk.text
        );
      }
      if (chunks.length > 0) {
        console.log(
          `  - needs (re)chunking at section level (${chunks.length}) ${totalChunksLength} (${chunkLengths})`
        );
        // showChunks(chunks, 2, 40);
      } else {
        console.log(`  - no chunk found convert to text at chapter level`);
      }
      // showChunks(chunks, 2, 40); // Show first 5 chunks of each chapter
    } else if (!foundFirstChapter) {
      // console.log("Found frontmatter...");
      if (node instanceof HTMLElement) {
        frontmatterHtml += node.outerHTML;
      }
    } else if (afterLastChapter) {
      // console.log("Found endmatter...");
      if (node instanceof HTMLElement) {
        endmatterHtml += node.outerHTML;
      }
    } else {
      // This is content between chapters
      // console.log("Found content between chapters...");
      const content = node instanceof HTMLElement ? node.outerHTML : node.text;
      if (content.trim() !== "") {
        console.log("Non-empty between chapters node:", {
          type: node.constructor.name,
          content,
          length: content.length,
        });
      }
    }
  }

  // Process frontmatter
  if (frontmatterHtml) {
    console.log(`Processing frontmatter(${frontmatterHtml.length})...`);
    await writeFile(
      `./data/guten/html/chapter-0-frontmatter.html`,
      frontmatterHtml
    );
    await writeFile(
      `./data/guten/text/chapter-0-frontmatter.txt`,
      parse(frontmatterHtml).structuredText
    );
    const frontmatterDoc = MDocument.fromHTML(frontmatterHtml, {
      title: "The Nicomachean Ethics of Aristotle",
      chapter: "Frontmatter",
      type: "frontmatter",
    });
    // const frontmatterChunks = await frontmatterDoc.chunk({
    //   separators: ["<p>", "<br>", "<div>"],
    //   maxSize: 1000,
    //   keepSeparator: "start",
    // });
    // console.log(`Number of frontmatter chunks: ${frontmatterChunks.length}`);
    // showChunks(frontmatterChunks, 3, 40);
  }

  // Process endmatter
  chapterCount++;
  if (endmatterHtml) {
    console.log(`Processing endmatter(${endmatterHtml.length})...`);
    await writeFile(
      `./data/guten/html/chapter-${chapterCount}-endmatter.html`,
      endmatterHtml
    );
    await writeFile(
      `./data/guten/text/chapter-${chapterCount}-endmatter.txt`,
      parse(endmatterHtml).structuredText
    );
    const endmatterDoc = MDocument.fromHTML(endmatterHtml, {
      title: "The Nicomachean Ethics of Aristotle",
      chapter: "Endmatter",
      type: "endmatter",
    });
    // const endmatterChunks = await endmatterDoc.chunk({
    //   separators: ["<p>", "<br>", "<div>"],
    //   maxSize: 1000,
    //   keepSeparator: "start",
    // });
    // console.log(`Number of endmatter chunks: ${endmatterChunks.length}`);
    // showChunks(endmatterChunks, 3, 40);
  }

  return []; // Return empty array for now
}
