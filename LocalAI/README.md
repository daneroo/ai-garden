# LocalAI

[Follow build on Mac](https://localai.io/basics/build/#build-on-mac).

## Setup

- Follow build instructions
  - [x] `make build`
  - [ ] `make BUILD_TYPE=metal build`
- Download models
- One of each
  - [x] gpt4all-j - download model and prompt
  - llama2/falcon

## Models

Figure out galleries.

### luna-ai-llama2

```bash
wget https://huggingface.co/TheBloke/Luna-AI-Llama2-Uncensored-GGUF/resolve/main/luna-ai-llama2-uncensored.Q4_0.gguf -O models/luna-ai-llama2

cp -rf prompt-templates/getting_started.tmpl models/luna-ai-llama2.tmpl

curl -s http://localhost:8080/v1/models | jq

curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
     "model": "luna-ai-llama2",
     "messages": [{"role": "user", "content": "How are you?"}],
     "temperature": 0.9
   }'

curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
     "model": "luna-ai-llama2",
     "messages": [{"role": "user", "content": "What is the Prime Number Theorem (math)?"}],
     "temperature": 0.9
   }'

hyperfine 'curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d "{ \"model\": \"luna-ai-llama2\", \"messages\": [{\"role\": \"user\", \"content\": \"What is the Prime Number Theorem (math)?\"}], \"temperature\": 0.9 }"'

```

### openorca

Prompts: not quite..

See if I can re-use `/Users/daniel/Library/Application Support/nomic.ai/GPT4All/`.

```bash
scp -p /Users/daniel/Library/Application\ Support/nomic.ai/GPT4All//mistral-7b-openorca.Q4_0.gguf models

curl -s http://localhost:8080/v1/models | jq
{
  "object": "list",
  "data": [
    {
      "id": "ggml-gpt4all-j",
      "object": "model"
    },
    {
      "id": "mistral-7b-openorca.Q4_0.gguf",
      "object": "model"
    }
  ]
}

curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
     "model": "mistral-7b-openorca.Q4_0.gguf",
     "messages": [{"role": "user", "content": "What is the P.N.T?"}],
     "temperature": 0.9
   }'

```

## Note for Metal

After running a simple benchmarks, this made no difference. Perhaps because the right defaults were already picked?

```bash
make BUILD_TYPE=metal build

# Set `gpu_layers: 1` to your YAML model config file and `f16: true`
# Note: only models quantized with q4_0 are supported!
```

## Build instructions

```bash
# install build dependencies
brew install abseil cmake go grpc protobuf wget

# clone the repo
git clone https://github.com/go-skynet/LocalAI.git

cd LocalAI

# build the binary
make build

# Download gpt4all-j to models/
wget https://gpt4all.io/models/ggml-gpt4all-j.bin -O models/ggml-gpt4all-j

# Use a template from the examples
cp -rf prompt-templates/ggml-gpt4all-j.tmpl models/

# Run LocalAI
./local-ai --models-path=./models/ --debug=true

# Now API is accessible at localhost:8080
curl http://localhost:8080/v1/models

curl http://localhost:8080/v1/chat/completions -H "Content-Type: application/json" -d '{
     "model": "ggml-gpt4all-j",
     "messages": [{"role": "user", "content": "How are you?"}],
     "temperature": 0.9
   }'
```
