import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { EPubLoader } from "langchain/document_loaders/fs/epub";

export async function getSourceForEPub() {
  const name = "These Laurence - Aristotle’s Intrinsic Teleology (epub)";
  const question = "What is a shortcoming of Johnson’s interpretation";
  const loader = new EPubLoader(
    "/Users/daniel/Downloads/These-Laurence-2023-10-13/These Laurence - Instrumental Relations in Aristotle’s Intrinsic Teleology.epub",
    {
      splitPages: true,
    }
  );
  return { name, question, loader };
}

export async function getSourceForPDF() {
  const name = "These Laurence - Aristotle’s Intrinsic Teleology (pdf)";
  const question = "What is a shortcoming of Johnson’s interpretation";
  const loader = new PDFLoader(
    "/Users/daniel/Downloads/These-Laurence-2023-10-13/These Laurence - Instrumental Relations in Aristotle’s Intrinsic Teleology.pdf",
    {
      splitPages: true,
    }
  );
  return { name, question, loader };
}

export async function getSourceForText() {
  const name = "These Laurence - Aristotle’s Intrinsic Teleology (txt)";
  const question = "What is a shortcoming of Johnson’s interpretation";
  const loader = new TextLoader(
    "/Users/daniel/Downloads/These-Laurence-2023-10-13/These Laurence - Instrumental Relations in Aristotle’s Intrinsic Teleology.txt"
  );
  return { name, question, loader };
}
export async function getSourceForBlog() {
  const name = "Lilian Weng's Blog on Agents";
  const question = "What are the approaches to Task Decomposition?";
  const loader = new CheerioWebBaseLoader(
    "https://lilianweng.github.io/posts/2023-06-23-agent/"
  );
  return { name, question, loader };
}

export async function getSourceForTextSciFi() {
  const name = "Neon Shadows: Echoes of Neo-Tokyo 3 (txt)";
  const question =
    "What is Dr. Emiko Yamada's primary field of expertise, and what is her significant invention in the story?";
  const loader = new TextLoader("./source/neon-shadows.txt");
  const contentDocumentStartIndex = 0; // 0-based use docs.slice(contentDocumentStartIndex)
  return { name, question, loader, contentDocumentStartIndex };
}

export async function getSourceForLargeFantasyNovel() {
  const name = "The Hero of Ages: Mistborn Book 3 (epub)";
  const question = "What is the difference between a Mistling and a Mistborn?";
  const loader = new EPubLoader(
    "/Volumes/Reading/audiobooks/Brandon Sanderson - Mistborn/Brandon Sanderson - Mistborn 03 - The Hero of Ages/Brandon Sanderson - Mistborn 03 - The Hero of Ages.epub",
    {
      splitPages: true,
    }
  );
  const contentDocumentStartIndex = 3; // 0-based use docs.slice(contentDocumentStartIndex)
  return { name, question, loader, contentDocumentStartIndex };
}
