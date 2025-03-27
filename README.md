# ai-garden

*Note:* We are switching to `uv` for python, and `mastra` for JavaScript.

- poetry based projects for experimenting with ai and related data gathering
  - Workshop 5 - OpenAI, Pinecone & LangChain
- Legacy
  - Experimentation folder using GPT4ALL on my Mac Mini M2
  - gpt4all-node-openai-api: node.js call to GPT4ALL App (Enable API:true port:4891)

GPT4all'a native Mac App stores it's models in `/Users/daniel/Library/Application Support/nomic.ai/GPT4All/`
The python module stores them in `/Users/daniel/.cache/gpt4all/`

## Operations

- We will use poetry for dep management and virtual envs
- We will use `just`/`Justfile` for task automation (see workshop-5 for initial template)
- Credentials (when needed) are stored in gitignored `.../.env` (not checked in)

## Model Storage

- Ollama, LM Studio, GPT4All (cli and app separately)

Starter script:

```bash
declare -A dirs=(
    [Ollama]="$HOME/.ollama"
    [LMStudio]="$HOME/.cache/lm-studio/models/"
    [GPT4All]="$HOME/.cache/gpt4all/"
    [NomicAI]="$HOME/Library/Application Support/nomic.ai/GPT4All/"
)
for key in "${!dirs[@]}"; do
    total_size=$(du -sh "${dirs[$key]}" | cut -f1)
    echo "$total_size :  $key (${dirs[$key]})"
done
ollama list
```

## TODO

- [ ] Try out [Mastra](https://mastra.ai/docs) for JS
  - `pnpm create mastra@latest`
  - [ ] [Mastra MCP](https://mastra.ai/blog/introducing-mastra-mcp)
- [ ] Look at [MarkItDown](https://github.com/microsoft/markitdown) for examining pfds/epub
- [ ] Move to uv/ruff
  - find all venv's: /Users/daniel/Library/Caches/pypoetry/virtualenvs
- [ ] Cleanup repo
  - [ ] consolidate audio book sub-projects (non-AI)
    - [ ] audio-reader-vite - create new vite base consolidated app
  - [ ] remove old projects (audio-reader-html, audio-deno-match book-reader)
- [x] Cleanup python virtualenvs and unused models
  - `/Users/daniel/Library/Caches/pypoetry/virtualenvs/`
    - ai-implements-ai-fIOIe-Zf-py3.11
    - ai-implements-ai-fIOIe-Zf-py3.12
    - gpt4all-pyclient-\_gMVkbwA-py3.11
    - llamaindex-client-T9vbKWum-py3.11
    - local-interpreter-oEhRvI3n-py3.11
    - local-interpreter-oEhRvI3n-py3.12
    - workshop-5-doKmtUfd-py3.11
- Consolidate All 'runners'
  - javascript client (based on gpt4all-node-openai-api)
  - langchain using one or all of these runners
    - QA
    - RAG
    - Summarization
    - Map-Reduce (characters,Expressions,..)
- [ ] [AI Engineering Resources - Bill Malarky](https://github.com/billmalarky/shift-left)
- [ ] [Bark](https://github.com/suno-ai/bark#-usage-in-python)
- [ ] convert to monorepo
  - [ ] [syncabook](https://github.com/r4victor/syncabook)
  - gpt4all
    - [ ] make python3.10 compatible (glob/hidden)
    - [ ] write level 0 as json text files
    - [ ] iterate up the levels (create if not exists on results)

## Ollama

- [Ollama](./ollama/README.md)

## LocalAI

- [LocalAI](./LocalAI/README.md)

## Gpt4All - openai

Using [GPT4All Chat UI - API](https://docs.gpt4all.io/gpt4all_chat.html#server-mode)
We can also use [openai node module](https://github.com/openai/openai-node) to talk to the local App:

see `./gpt4all-openai`

```bash
pnpm add openai
```

## GPT4All

Download Note\*: By default, models are stored in `~/.cache/gpt4all/` (you can change this with model_path). If the file already exists, model download will be skipped.

## Poetry

```bash
# init (once)
poetry init

# update / use
poetry install
# add a dependency
poetry add yourdep


poetry env info
# show envs and activated status
poetry env list

poetry shell

poetry run python main.py

# cleanup
poetry env remove
```

## External Repos

### gpt4all

There is a branch (PR for now <https://github.com/nomic-ai/gpt4all/pull/839>)
With a new gpt4all-api subproject

```bash
git clone git@github.com:nomic-ai/gpt4all.git
# or git clone https://github.com/nomic-ai/gpt4all.git
# look into the feature branch 'till merged
git checkout gpt4all-api
cd gpt4all-api

```

### syncabook

```bash
cd ext-repos
git clone git@github.com:r4victor/syncabook.git
# or
git clone https://github.com/r4victor/syncabook.git
```

## References

- [ ] [ollama](https://github.com/jmorganca/ollama)
- [ ] [LocalAI](https://github.com/mudler/LocalAI), [Flowise](https://flowiseai.com/)
  - LLMs, TTS, whisper,bark
- [GPT4All docs](https://docs.gpt4all.io)
- [syncabook](https://github.com/r4victor/syncabook)
- [Dockerized gpt4all invoke with golang](https://github.com/drbh/gmessage)
