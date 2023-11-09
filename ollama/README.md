# Ollama

## Fetching new models

see: <https://ollama.ai/library>, e.g. mistral, llama2

Local models are stored in `~/.ollama/`

## Operation

```bash
# List local models
ollama list

# Run a model (interactive)
ollama run mistral

# Run a model single prompt
ollama run llama2 "Name 3 colors" --verbose
ollama run mistral "Name 3 colors" --verbose
ollama run mistral "What is the prime number theorem (PNT)?" --verbose
```

## API usage

See the docs: <https://github.com/jmorganca/ollama/blob/main/docs/api.md>

Start the server from the app, or from the command line: `ollama server`

```bash
curl -s -X POST http://localhost:11434/api/generate -d '{"model": "llama2","prompt":"Name three colors","stream":false}' |jq -r .response

hyperfine 'curl -s -X POST http://localhost:11434/api/generate -d "{\"model\": \"llama2\",\"prompt\":\"Name three colors\",\"stream\":false}"'

  Time (mean ± σ):     623.3 ms ±  43.5 ms    [User: 1.8 ms, System: 2.4 ms]
  Range (min … max):   603.8 ms … 743.9 ms    10 runs

## Setup

Simply download mac App from <https://ollama.ai/>

## References

- [Ollama on GitHub](https://github.com/jmorganca/ollama)
```
