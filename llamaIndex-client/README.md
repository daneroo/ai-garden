# llamaIndex - client example

Just start by simulating the epub loader

```bash
just install
just run -h
just run -s memo
```

## llama-index

Models are downloaded to: `~/Library/Caches/llama_index/models/llama-2-13b-chat.Q4_0.gguf`

```bash
poetry run python llama-local-test.py
```

## llama-cpp-python

I Need to figure out how to install this package with poetry directly.

```bash
# inside poetry shell
# This worked
pip uninstall -y llama-cpp-python
CMAKE_ARGS="-DLLAMA_METAL=on" pip install llama-cpp-python
```

## References

- [llamaIndex](https://www.llamaindex.ai/)
- [ebooklib](https://github.com/aerkalov/ebooklib)
