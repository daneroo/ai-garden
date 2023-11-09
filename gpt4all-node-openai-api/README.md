# gpt4all-openai

This calls the GPT4All App's API (openai API compatible) to generate text.

- We call it from node.js
  - as a fetch request
  - with openai node.js library

## From Node.js

```bash
pnpm install
pnpm start
# or
node index.mjs
```

## From CLI

- Make sure GPT4All App is running and API is enabled (default port is 4891).
- Models located at `~/Library/Application\ Support/nomic.ai/GPT4All/`

As od 2023-11-09, we were running Mistral 7B models, OpenOrca, and Instruct variants:

- mistral-7b-instruct-v0.1.Q4_0.gguf
- mistral-7b-openorca.Q4_0.gguf

```bash
# echo false, stream false max_tokens 150

## mistral-7b-instruct-v0.1.Q4_0.gguf

hyperfine 'curl --silent -X POST -H "Content-Type: application/json" -d "{\"model\": \"mistral-7b-instruct-v0.1.Q4_0.gguf\", \"prompt\": \"What is the prime number theorem (PNT)?\", \"max_tokens\": 150, \"temperature\": 0.28, \"top_p\": 0.95, \"n\": 1, \"echo\": false, \"stream\": false}" "http://localhost:4891/v1/completions"'

  Time (mean ± σ):      4.445 s ±  0.456 s    [User: 0.006 s, System: 0.008 s]
  Range (min … max):    4.015 s …  4.994 s    10 runs

curl --silent -X POST -H "Content-Type: application/json" -d "{\"model\": \"mistral-7b-instruct-v0.1.Q4_0.gguf\", \"prompt\": \"What is the prime number theorem (PNT)?\", \"max_tokens\": 150, \"temperature\": 0.28, \"top_p\": 0.95, \"n\": 1, \"echo\": false, \"stream\": false}" "http://localhost:4891/v1/completions" | jq

## mistral-7b-openorca.Q4_0.gguf

hyperfine 'curl --silent -X POST -H "Content-Type: application/json" -d "{\"model\": \"mistral-7b-openorca.Q4_0.gguf\", \"prompt\": \"What is the prime number theorem (PNT)?\", \"max_tokens\": 150, \"temperature\": 0.28, \"top_p\": 0.95, \"n\": 1, \"echo\": false, \"stream\": false}" "http://localhost:4891/v1/completions"'

  Time (mean ± σ):      4.730 s ±  0.281 s    [User: 0.006 s, System: 0.008 s]
  Range (min … max):    4.137 s …  4.965 s    10 runs

curl --silent -X POST -H "Content-Type: application/json" -d "{\"model\": \"mistral-7b-openorca.Q4_0.gguf\", \"prompt\": \"What is the prime number theorem (PNT)?\", \"max_tokens\": 150, \"temperature\": 0.28, \"top_p\": 0.95, \"n\": 1, \"echo\": false, \"stream\": false}" "http://localhost:4891/v1/completions" | jq

```
