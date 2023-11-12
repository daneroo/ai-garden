# LangChain Q&A with Javascript and Local Ollama Engine

See <https://js.langchain.com/docs/use_cases/question_answering/local_retrieval_qa>

> For example, here we show how to run Llama 2 locally (e.g., on your laptop) using local embeddings, a local vector store, and a local LLM. You can check out other open-source models supported by Ollama here.

## TODO

- LangChain (JS)
  - [x] ollama local with llama2/mistral - Q&A and Summarization
  - [ ] Tokenizer / splitter max chunk size per model
  - [ ] maxConcurrency >1 ?
  - [ ] [custom callback handlers](https://js.langchain.com/docs/modules/callbacks/how_to/create_handlers)
- Later...
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
- Map/Reduce - `mappr.mjs` - characters in Hero of Ages

  - Refine - llama2 5 docs/77 chunks chunkSize:1000 - 8 characters: 815s
  - Refine - llama2 5 docs/37 chunks chunkSize:2000 - 10 characters: 536s
  - Refine - llama2 5 docs/19 chunks chunkSize:4000 - 8 characters: 272s
  - Refine - llama2 5 docs/11 chunks chunkSize:8000 - 8 characters: 235s

  - Refine - llama2 15 docs/37 chunks chunkSize:8000 - 12 characters: 866s

  - Refine - mistral 5 docs/77 chunks chunkSize:1000 - 7 characters: 347s - Vin Missing
  - Refine - mistral 5 docs/37 chunks chunkSize:2000 - 11 characters: 143s
  - Refine - mistral 5 docs/19 chunks chunkSize:4000 - 11 characters: 138s
  - Refine - mistral 5 docs/11 chunks chunkSize:8000 - 6 characters: 68s

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