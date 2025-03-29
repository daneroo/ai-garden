import { MDocument } from "@mastra/rag";
import { ollama } from "ollama-ai-provider";
import { embedMany, embed } from "ai";
import { parse, HTMLElement } from "node-html-better-parser";

import { LibSQLVector } from "@mastra/core/vector/libsql";
import { QueryResult } from "@mastra/core";

// invoke async main (which is hoisted, so this is ok)
main();

async function main() {
  try {
    // Load the paper
    const response = await fetch(
      "https://www.gutenberg.org/files/8438/8438-h/8438-h.htm"
    );
    const htmlText = await response.text();
    const gutenChunks = await gutenParse(htmlText);
    console.log("Number of GutenChunks:", gutenChunks.length);
    console.log("\nGutenChunks:");
    showChunks(gutenChunks, 20, 40);
    // Exit early to analyze chunks
    process.exit(0);

    // Create document and chunk it semantically
    const doc = MDocument.fromHTML(htmlText, {
      title: "The Nicomachean Ethics of Aristotle",
    });
    const chunks = await doc.chunk({
      headers: [
        ["h2", "chapter"], // book headers for structure and metadata
        // ["h3", "section"], // chapter headers for structure and metadata
      ],
    });

    // Parse and chunk the Gutenberg text
    console.log("Number of chunks:", chunks.length);
    showChunks(chunks, 20, 40);

    // Initialize vector store
    //  This should be imported from mastra
    // const vectorStore = mastra.getVector('libsql');
    const vectorStore = new LibSQLVector({
      connectionUrl: "file:./data/libsql/vector.db",
    });

    // Generate embeddings
    console.log("Generating embeddings...");
    const { embeddings } = await embedMany({
      model: ollama.embedding("mxbai-embed-large"),
      values: chunks.map((chunk) => chunk.text),
    });
    embeddings.forEach((embedding, i) => {
      console.log(
        `embedding(${i})(${embedding.length}) ${embedding.slice(0, 4)}`
      );
    });

    // Create index
    console.log("Creating index...");
    await vectorStore.createIndex({
      indexName: "ethics",
      dimension: 1024, // Dimensions for mxbai-embed-large
    });

    // Store embeddings and metadata
    console.log("Storing embeddings and metadata...");
    await vectorStore.upsert({
      indexName: "ethics",
      vectors: embeddings,
      metadata: chunks.map((chunk) => ({
        text: chunk.text,
        book: chunk.metadata.book,
        xpath: chunk.metadata.xpath,
      })),
    });
    // let test a query!
    const { embedding } = await embed({
      value: "What is the ultimate virtue?",
      model: ollama.embedding("mxbai-embed-large"),
    });

    const results = await vectorStore.query({
      indexName: "ethics",
      queryVector: embedding,
      topK: 2,
    });

    console.log("Query results:");
    showResult(results);

    console.log("Done!");
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
    console.log(`id: ${id}, score: ${score}, ${metadataLine}`);

    // Show text snippet on next line
    const displayText = metadata.text.trim().replace(/\s+/g, " ");
    console.log(
      `Text(${metadata.text.length}): |${displayText.slice(
        0,
        snippetLength
      )}...|`
    );
    console.log("-".repeat(80));
  }
}

function showChunks(chunks: any[], nChunks = 100, snippetLength = 40) {
  console.log(`\nFirst ${nChunks} chunks (first ${snippetLength} chars each):`);
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
  for (const node of bodyChildren) {
    if (node instanceof HTMLElement && chapters.has(node)) {
      foundFirstChapter = true;
      if (node === lastChapter) {
        afterLastChapter = true;
      }

      // Create and chunk this chapter
      const chapterTitle = node.querySelector("h2")?.text?.trim();
      const chapterDoc = MDocument.fromHTML(node.outerHTML, {
        title: "The Nicomachean Ethics of Aristotle",
        chapter: chapterTitle,
      });

      // Log the chapter title for debugging
      console.log("\nFound chapter:", chapterTitle);

      // Chunk the chapter and show results
      const chunks = await chapterDoc.chunk({
        headers: [["h3", "section"]],
        maxSize: 1000, // Control chunk size
      });
      console.log(
        `Number of chunks for chapter ${chapterTitle}: ${chunks.length}`
      );
      showChunks(chunks, 5, 40); // Show first 5 chunks of each chapter
    } else if (!foundFirstChapter) {
      if (node instanceof HTMLElement) {
        frontmatterHtml += node.outerHTML;
      }
    } else if (afterLastChapter) {
      if (node instanceof HTMLElement) {
        endmatterHtml += node.outerHTML;
      }
    } else {
      // This is content between chapters
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
    console.log("\nProcessing frontmatter...");
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
  if (endmatterHtml) {
    console.log("\nProcessing endmatter...");
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
