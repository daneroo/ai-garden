# ai-garden

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

## TODO

- [ ] convert to monorepo
  - [ ] [syncabook](https://github.com/r4victor/syncabook)
  - gpt4all
    - [ ] make python3.10 compatible (glob/hidden)
    - [ ] write level 0 as json text files
    - [ ] iterate up the levels (create if not exists on results)

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

- [GPT4All docs](https://docs.gpt4all.io)
- [syncabook](https://github.com/r4victor/syncabook)
- [Dockerized gpt4all invoke with golang](https://github.com/drbh/gmessage)
