# Novel Q&A and Summarization System

A reproducible, fully local pipeline to index, summarize, and query novels from EPUB files — powered by Ollama and ChromaDB.

## Features

- Fully local (no OpenAI or Hugging Face keys required)
- Input: EPUB file
- Output: Chapter-level summarization and Q&A interface
- LLM and embedding models selectable via CLI
- Persistent vector store using ChromaDB
- Caching logic to skip redundant indexing, keyed on input and parameters
- Local tracing to filesystem in JSONL format
- Evaluation of LLM performance using predefined question-answer sets
- CLI driven via `main.py` using `argparse`
- Modular implementation in `lib/` directory
- All dependency management via `uv` only
- No use of `Makefile`, `justfile`, or manual edits to `pyproject.toml`

## Project Structure

- `main.py`: CLI entrypoint
- `lib/`: All application logic
  - `extract.py`: Extracts text and chapter structure from EPUB
  - `chunk.py`: Handles text splitting and chunking
  - `embed.py`: Embedding model wrapper
  - `llm.py`: LLM wrapper
  - `vectorstore.py`: ChromaDB setup and caching logic
  - `summarize.py`: Chapter summarization
  - `qa.py`: Retrieval and question answering
  - `eval.py`: Evaluation metrics and runner
- `data/`: EPUB and generated data files
- `evalsets/`: JSON files with gold Q&A data
- `traces/`: Local logs and tracing output

## Command Line Interface

- Supports model and embedding selection via `--model` and `--embedding`
- Models are specified in the format `provider:model`
- Commands include:
  - `run`: Load EPUB, chunk, embed, and index content
  - `summary`: Generate summaries of each chapter
  - `evaluate`: Run evaluation against a set of gold Q&A pairs

## Vector Store

- Uses ChromaDB with persistent storage at `./data/chroma_db`
- One collection per novel and parameter fingerprint
- Automatically reuses collections unless forced
- Embedding parameters and chunking strategy are hashed as part of cache key

## Tracing

- All LLM and embedding calls are logged to `traces/logs.jsonl`
- Each trace includes timestamp, model, prompt, and response
- No cloud services are used for tracing

## Evaluation

- Evaluates QA results against gold datasets
- Metrics may include exact match, embedding similarity, and LLM-as-a-judge
- Evaluation runs are parameterized by model, embedding, and chunking strategy
- Enables fair comparison of indexing and retrieval setups

## Exclusions

- No editing of `pyproject.toml`
- No use of `Makefile` or `justfile`
- No cloud tracing services (e.g., Phoenix, LangSmith)
- No global or hidden configuration files

## Future Considerations

- Visual trace viewer CLI or web interface
- Markdown or HTML export of summaries
- Hierarchical chunking and summarization
- Side-by-side framework comparison (e.g., LangChain vs LlamaIndex)
