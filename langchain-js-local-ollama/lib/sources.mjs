import { homedir } from "node:os";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { EPubLoader } from "langchain/document_loaders/fs/epub";

/**
 * This type is actually just copied from langchain.DocumentLoader.
 * @typedef {Object} DocumentLoader
 * @property {function(): Promise<Document[]>} load - Loads documents.
 * @property {function(TextSplitter=): Promise<Document[]>} loadAndSplit - Loads and splits documents.
 */

/**
 * @typedef {Object} SourceInfo
 * @property {string} name - The name of the document.
 * @property {string} question - A related question.
 * @property {DocumentLoader} loader - A loader instance for the document (either EPubLoader or PDFLoader).
 */

/**
 * @typedef {Object.<string, SourceInfo>} SourceMap
 * @description A map of source identifiers to their respective source information.
 */

export function getSources() {
  const thesisBasePath = `${homedir()}/Downloads/These-Laurence-2023-10-13`;
  const volReadingAudiobooksBasePath = "/Volumes/Reading/audiobooks";
  return {
    "thesis.epub": {
      name: "These Laurence - Aristotle’s Intrinsic Teleology (epub)",
      question: "What is a shortcoming of Johnson’s interpretation",
      loader: new EPubLoader(
        `${thesisBasePath}/These Laurence - Instrumental Relations in Aristotle’s Intrinsic Teleology.epub`,
        {
          splitPages: true,
        }
      ),
    },
    "thesis.pdf": {
      name: "These Laurence - Aristotle’s Intrinsic Teleology (pdf)",
      question: "What is a shortcoming of Johnson’s interpretation",
      // { splitPages: true} is the default
      loader: new PDFLoader(
        `${thesisBasePath}/These-Laurence-2023-10-13/These Laurence - Instrumental Relations in Aristotle’s Intrinsic Teleology.pdf`
      ),
    },
    "thesis.txt": {
      name: "These Laurence - Aristotle’s Intrinsic Teleology (txt)",
      question: "What is a shortcoming of Johnson’s interpretation",
      loader: new TextLoader(
        `${thesisBasePath}/These Laurence - Instrumental Relations in Aristotle’s Intrinsic Teleology.txt`
      ),
    },
    "neon-shadows.txt": {
      name: "Neon Shadows: Echoes of Neo-Tokyo 3 (txt)",
      question:
        "What is Dr. Emiko Yamada's primary field of expertise, and what is her significant invention in the story?",
      loader: new TextLoader("./source/neon-shadows.txt"),
      contentDocumentStartIndex: 0, // 0-based use docs.slice(contentDocumentStartIndex)
    },
    "hero-of-ages.epub": {
      name: "The Hero of Ages: Mistborn Book 3 (epub)",
      question: "What is the difference between a Mistling and a Mistborn?",
      loader: new EPubLoader(
        `${volReadingAudiobooksBasePath}/Brandon Sanderson - Mistborn/Brandon Sanderson - Mistborn 03 - The Hero of Ages/Brandon Sanderson - Mistborn 03 - The Hero of Ages.epub`,
        {
          splitPages: true,
        }
      ),
      contentDocumentStartIndex: 3, // 0-based use docs.slice(contentDocumentStartIndex)
    },
    "secret-history.epub": {
      name: "Secret History: Mistborn Book 3.5 (epub)",
      question: "What is the difference between a Mistling and a Mistborn?",
      loader: new EPubLoader(
        `${volReadingAudiobooksBasePath}/Brandon Sanderson - Mistborn/Brandon Sanderson - Mistborn 03.5 - Secret History/Brandon Sanderson - Mistborn 03.5 - Secret History.epub`,
        {
          splitPages: true,
        }
      ),
      contentDocumentStartIndex: 3, // 0-based use docs.slice(contentDocumentStartIndex)
    },

    "blog.web": {
      name: "Lilian Weng's Blog on Agents",
      question: "What are the approaches to Task Decomposition?",
      loader: new CheerioWebBaseLoader(
        "https://lilianweng.github.io/posts/2023-06-23-agent/"
      ),
    },
  };
}

/**
 * Retrieves source information by its nickname.
 * @param {string} nickname - The nickname of the source.
 * @returns {(SourceInfo|undefined)} The source information if found, otherwise undefined.
 */
export function getSource(nickname) {
  const sources = getSources();
  return sources[nickname];
}
