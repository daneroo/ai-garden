# Workshop 5 - Pinecone & LangChain

## Operations

## virtual environment setup (once)

```bash
# init (once)
poetry init

# update / use
poetry install
poetry env info
# show envs and activated status
poetry env list

poetry shell

poetry run python main.py

# cleanup
poetry env remove
```

## Setup venv and .gitignore

```txt
venv/
__pycache__/
*.pyc
```

## Install dependencies

```bash
pip -q install pinecone-client==2.2.2 openai tiktoken==0.4.0 langchain==0.0.276 unstructured==0.10.8


pip freeze > requirements.txt
```
