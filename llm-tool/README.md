# llm tool

This covers [Simn Willison's](https://simonwillison.net/) llm tool.

- [llm tool itself](https://llm.datasette.io/en/stable/)
- [llm-ollama](https://github.com/taketwo/llm-ollama)
- [llm-mlx](https://github.com/simonw/llm-mlx)

## Hello World

```bash
# list models
llm models

# simple test for local model
time llm -m llama3.2:3b 'How much is 2+2?'
while true; do time llm -m llama3.2:3b 'How much is 2+2?'; done

# Using Schemas
 llm -m llama3.2:3b --schema "name, age int, one_sentence_bio" "invent a cool dog"| jq
 llm -m gemma3:27b-it-qat --schema "name, age int, one_sentence_bio" "invent a cool dog"| jq

# I have not set any keys yet!
time llm -m o3-mini 'How much is 2+2?'
Error: No key found - add one using 'llm keys set openai' or set the OPENAI_API_KEY environment variable
```

## Installation

```bash
# brew warning: https://llm.datasette.io/en/stable/setup.html#homebrew-warning
brew install llm
# Have not tried this yet
uv tool install llm
```

Plugins:

```bash
# List plugins
llm plugins

llm install llm-ollama
llm uninstall llm-ollama

llm install llm-mlx
# or (did not do this yet)
uv tool install llm --python 3.12
```


