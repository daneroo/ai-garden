# LangChain Q&A with Javascript and Local Ollama Engine

See <https://js.langchain.com/docs/use_cases/question_answering/local_retrieval_qa>

> For example, here we show how to run Llama 2 locally (e.g., on your laptop) using local embeddings, a local vector store, and a local LLM. You can check out other open-source models supported by Ollama here.

## TODO

- LangChain (JS)
  - [x] ollama local with llama2/mistral - Q&A and Summarization
  - [ ] GPT4All local App
    - [ ] mistral-7b-instruct-v0.1.Q4_0.gguf - Q&A and Summarization
  - [ ] LocalAI local
    - [ ] llama2
    - [ ] whisper
    - tts

## Results

First summarization results:

```bash
time node summarize.mjs | tee -a "FinalSummary-Aristotle-ollama-llama2.$(gdate -u -Is)".raw.txt
```

- Ran summary and questions on llama and mistral (chunk 4000/200) - 71 docs
  - llama2: 52m,60m
  - mistral: 24 minutes
- Ran summary-only on llama and mistral (chunk 3000/200) - 101 docs
  - llama2: 27m
  - mistral: 30m

## Experiments

- Document Loaders - `sources.mjs`: loader.load -> docs[]
- Tokenizer - `splitr.mjs`: RecursiveCharacterTextSplitter vs TokenTextSplitter

## Operation

Before you invoke the `index.mjs` script, you need to start the `ollama` server.

```bash
# in a separate terminal
ollama serve

pnpm start
# or
node index.mjs
```

## Setup

```bash
pnpm init
pnpm add langchain @xenova/transformers hnswlib-node cheerio
pnpm install

```
