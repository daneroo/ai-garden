import { MDocument } from "@mastra/rag";
import { ollama } from "ollama-ai-provider";

async function main() {
  try {
    // Load the paper
    const response = await fetch(
      "https://www.gutenberg.org/files/8438/8438-h/8438-h.htm"
    );
    const htmlText = await response.text();

    // Create document and chunk it semantically
    const doc = MDocument.fromHTML(htmlText);
    const chunks = await doc.chunk({
      headers: [
        ["h2", "Book"], // Book headers for structure and metadata
        ["h3", "Chapter"], // Chapter headers for structure and metadata
      ],
      // sections: [
      //   // ["h2", "Book"], // Book sections
      //   ["h3", "Chapter"], // Chapter sections
      // ],
    });

    console.log("Number of chunks:", chunks.length);
    showChunks(chunks);
  } catch (error) {
    console.error("Error processing document:", error);
    process.exit(1);
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

main();
