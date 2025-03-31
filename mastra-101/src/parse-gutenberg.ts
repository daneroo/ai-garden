import {
  parse,
  HTMLElement,
  CommentNode,
  TextNode,
  Node,
} from "node-html-better-parser";
import { writeFile } from "node:fs/promises";

type Chapter = {
  title: string;
  nodes: (HTMLElement | CommentNode | TextNode)[];
};

await main();

async function main() {
  try {
    // Load the paper
    const response = await fetch(
      // "https://www.gutenberg.org/cache/epub/1656/pg1656-images.html"
      "https://www.gutenberg.org/files/8438/8438-h/8438-h.htm"
    );
    const htmlText = await response.text();

    await inspectStructure(htmlText);
  } catch (error) {
    console.error("Error processing document:", error);
  }
}

async function inspectStructure(htmlText: string) {
  const root = parse(htmlText);
  const body = root.querySelector("body");

  if (!body) {
    console.log("No body found");
    return;
  }

  console.log("\nTop-level children of body:");
  console.log("===========================");

  let foundFirstChapter = false;

  const frontmatter: Chapter = { title: "frontmatter", nodes: [] };
  const endmatter: Chapter = { title: "endmatter", nodes: [] };
  const chapters: Chapter[] = [];

  for (const node of body.childNodes) {
    // showNode(node);
    // TODO: should assert no nodes between chapters
    if (isChapter(node)) {
      foundFirstChapter = true;
      if (node instanceof HTMLElement) {
        chapters.push({
          title: node.querySelector("h2")?.text?.trim() ?? "",
          nodes: [node],
        });
      } else {
        throw new Error(
          "Chapter is not an HTMLElement which is impossible if it is a chapter"
        );
      }
    } else {
      if (
        node instanceof HTMLElement ||
        node instanceof TextNode ||
        node instanceof CommentNode
      ) {
        if (!foundFirstChapter) {
          frontmatter.nodes.push(node);
        } else {
          endmatter.nodes.push(node);
        }
      } else {
        throw new Error(
          "Node is not an HTMLElement which is impossible if it is not a chapter"
        );
      }
    }
  }

  console.log(
    `Found frontmatter: ${frontmatter.nodes.length} chapters: ${chapters.length} endmatter: ${endmatter.nodes.length}`
  );
  await writeNode("chapter-0-frontmatter", frontmatter);
  for (const [i, chapter] of chapters.entries()) {
    await writeNode(`chapter-${i + 1}-${chapter.title}`, chapter);
  }
  await writeNode(`chapter-${chapters.length + 1}-endmatter`, endmatter);
}

async function writeNode(filename: string, chapter: Chapter) {
  const htmlText = chapter.nodes
    .map((node) => {
      if (node instanceof HTMLElement) {
        return node.outerHTML;
      } else {
        return node.text;
      }
    })
    .join("\n\n");
  const structuredText = chapter.nodes
    .map((node) => {
      if (node instanceof HTMLElement) {
        return node.structuredText;
      } else {
        return node.text;
      }
    })
    .join("\n\n");
  await writeFile(`./data/gutenberg/html/${filename}.html`, htmlText);
  await writeFile(`./data/gutenberg/text/${filename}.txt`, structuredText);
}

function showNode(node: Node) {
  const snippetLength = 30;
  if (node instanceof HTMLElement) {
    const classNames = node.attributes.class;
    const textSnippet = stripWhitespaceAndSnippet(node.text, snippetLength);
    console.log(
      `- ${node.tagName}${classNames ? "." + classNames : ""} | ${textSnippet}`
    );
  } else {
    if (node instanceof TextNode || node instanceof CommentNode) {
      const tt = stripWhitespaceAndSnippet(node.text, snippetLength);
      if (tt.length > 0) {
        console.log(`- text: ${tt}`);
      }
    } else {
      console.log(`- other: ${JSON.stringify(node)}`);
    }
  }
}

function stripWhitespaceAndSnippet(
  text: string | undefined,
  snippetLength: number | undefined
): string {
  const stripped = text?.replace(/\s+/g, " ").trim() ?? "";
  return snippetLength ? stripped.slice(0, snippetLength) : stripped;
}

function isChapter(node: Node): boolean {
  return (
    node instanceof HTMLElement &&
    node.tagName === "div" &&
    node.attributes.class === "chapter"
  );
}
