import { basename } from "node:path";
import {
  getSourceForTextSciFi,
  getSourceForLargeFantasyNovel,
} from "./sources.mjs";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Ollama } from "langchain/llms/ollama";
import { PromptTemplate } from "langchain/prompts";
import { loadSummarizationChain } from "langchain/chains";

const ollamaModelName = "llama2"; // llama2,mistral
const verbose = false;
const maxDocs = 15; // Part One
// RecursiveCharacterTextSplitter
const chunkSize = 8000;
const chunkOverlap = 100;
const maxChunks = 9999999;

// const { name, question, loader } = await getSourceForTextSciFi();
const { name, question, loader, contentDocumentStartIndex } =
  await getSourceForLargeFantasyNovel();

console.log(`\n# Map/Reduce using ollama ${ollamaModelName}\n`);

console.log(`\n## Load document (${name})\n`);

const docs = (await loader.load())
  .slice(contentDocumentStartIndex)
  .slice(0, maxDocs);
console.log(`  - fetched ${docs.length} document(s)`);
for (const [i, doc] of docs.entries()) {
  const source = basename(doc.metadata.source);
  console.log(
    `    - document ${i} length: ${doc.pageContent.length} characters source: ${source}:`
  );
  // snip
  const snip = doc.pageContent.substring(0, 100).replace(/\n/g, " ");
  console.log(`      ${snip}...`);
  // full
  // console.log(doc.pageContent);
}

console.log(`\n## Split document RecursiveCharacterTextSplitter (${name})\n`);

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

// for (const [i, doc] of splitDocuments.entries()) {
//   const source = basename(doc.metadata.source);

//   const loc = `${doc.metadata.loc.lines.from} - ${doc.metadata.loc.lines.to}`;
//   console.log(
//     `    - chunk ${i} length: ${doc.pageContent.length} characters source: ${source} - loc: ${loc}:`
//   );
//   // snip
//   const snip = doc.pageContent.substring(0, 100).replace(/\n/g, " ");
//   console.log(`        ${snip}...`);
//   // full
//   // console.log(doc.pageContent);
// }

const model = new Ollama({
  baseUrl: "http://localhost:11434",
  model: ollamaModelName,
  maxConcurrency: 1,
});

if (true) {
  console.log(`\n## Summary Chain - Refine (${ollamaModelName} - ${name})\n`);

  // const { questionPrompt, refinePrompt } = summaryPrompt();
  const { questionPrompt, refinePrompt } = characterFindingPrompt();

  const refineChain = loadSummarizationChain(model, {
    type: "refine",
    verbose,
    questionPrompt: PromptTemplate.fromTemplate(questionPrompt),
    refinePrompt: PromptTemplate.fromTemplate(refinePrompt),
  });

  const summary = await refineChain.run(splitDocuments);

  console.log(
    `\n### Final Summary Refine for ${name} using ${ollamaModelName}\n`
  );
  console.log(summary);
}

if (false) {
  console.log(`\n## Summary Chain Map/Reduce (${ollamaModelName} - ${name})\n`);

  const mapReduceChain = loadSummarizationChain(model, {
    type: "map_reduce",
    // expects input variables: {text}
    combineMapPrompt:
      PromptTemplate.fromTemplate(`(cmp) You are an attentive reader. 
Your goal is to create a list of characters.
Format the list as an bulleted list of characters.
You may include a short description of the character, in five words or less.
List the characters in the following book extract:

    "{text}"

    LIST OF CHARACTERS:`),
    // expects input variables: {text}
    combinePrompt:
      PromptTemplate.fromTemplate(`(cp) You are an attentive reader.
Your goal is to combine lists of characters.
Combine any duplicate entries.
Format the list as an bulleted list of characters.
You may include a short description of the character, in five words or less.
Combine the following list of characters from a book:

    "{text}"

    LIST OF CHARACTERS:`),

    returnIntermediateSteps: true,
    verbose,
  });

  const res = await mapReduceChain.call({
    input_documents: splitDocuments,
  });
  console.log(
    `\n### Final Summary Map/Reduce for ${name} using ${ollamaModelName}\n`
  );
  console.log({ res });
}
function characterFindingPrompt() {
  return {
    questionPrompt: `
  You are a copy editor for short stories.
  Your goal is to create a list of characters in a story.
  Below you find an extract of the story:
  --------
  {text}
  --------
  
  Total output will be a list characters in the story.
  
  LIST OF CHARACTERS:
  `,
    refinePrompt: `
    You are a copy editor for short stories.
    Your goal is to create a list of characters in a story.
    We have provided a list of existing characters up to a certain point: 
    
  {existing_answer}
  
  Below you find an extract of the story:
  --------
  {text}
  --------
  
  Given the new context, refine the list of characters.
  If the context isn't useful, return the original list of characters.
  
  Total output will be a list characters in the story.
  
  LIST OF CHARACTERS:
  `,
  };
}

function summaryPrompt() {
  return {
    questionPrompt: `
  You are an expert in summarizing stories.
  Your goal is to create a summary of a story.
  Below you find an extract of the story:
  --------
  {text}
  --------
  
  Total output will be a summary of the story.
  
  SUMMARY:
  `,
    refinePrompt: `
    You are an expert in summarizing stories.
    Your goal is to create a summary of a story.
    We have provided an existing summary up to a certain point: 
    
  {existing_answer}
  
  Below you find an extract of the story:
  --------
  {text}
  --------
  
  Given the new context, refine the summary.
  If the context isn't useful, return the original summary.
  
  Total output will be a summary of the story.
  
  SUMMARY:
  `,
  };
}
