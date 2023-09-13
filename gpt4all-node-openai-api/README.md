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
- We are running the `llama-2-7b-chat.ggmlv3.q4_0.bin` model.
- And also `wizardlm-13b-v1.1-superhot-8k.ggmlv3.q4_0.bin`

```bash
# echo false, stream false max_tokens 150

# Llama-2-7B Chat
time curl --silent -X POST -H "Content-Type: application/json"   -d '{"model": "llama-2-7b-chat.ggmlv3.q4_0.bin", "prompt": "What is the prime number theorem (PNT)?", "max_tokens": 150, "temperature": 0.28, "top_p": 0.95, "n": 1, "echo": false, "stream": false}' "http://localhost:4891/v1/completions" | jq

# Wizard 1.1 13b
time curl --silent -X POST -H "Content-Type: application/json"   -d '{"model": "wizardlm-13b-v1.1-superhot-8k.ggmlv3.q4_0.bin", "prompt": "What is the prime number theorem (PNT)?", "max_tokens": 150, "temperature": 0.28, "top_p": 0.95, "n": 1, "echo": false, "stream": false}' "http://localhost:4891/v1/completions" | jq

```
