# LangChain Q&A with Javascript and Local Ollama Engine

See <https://js.langchain.com/docs/use_cases/question_answering/local_retrieval_qa>

> For example, here we show how to run Llama 2 locally (e.g., on your laptop) using local embeddings, a local vector store, and a local LLM. You can check out other open-source models supported by Ollama here.

## Results

First summarization results:

- llama2: 38 minutes -redo with recursive tokenizer
- mistral: 24 minutes

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
