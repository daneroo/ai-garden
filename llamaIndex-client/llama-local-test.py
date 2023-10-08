from llama_index import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    ServiceContext,
)
from llama_index.llms import LlamaCPP
from llama_index.llms.llama_utils import messages_to_prompt, completion_to_prompt

# Pre 0.1.79 model_url = "https://huggingface.co/TheBloke/Llama-2-13B-chat-GGML/resolve/main/llama-2-13b-chat.ggmlv3.q4_0.bin"
model_url = "https://huggingface.co/TheBloke/Llama-2-13B-chat-GGUF/resolve/main/llama-2-13b-chat.Q4_0.gguf"

llm = LlamaCPP(
    # You can pass in the URL to a GGML model to download it automatically
    model_url=model_url,
    # optionally, you can set the path to a pre-downloaded model instead of model_url
    model_path=None,
    temperature=0.1,
    max_new_tokens=256,
    # llama2 has a context window of 4096 tokens, but we set it lower to allow for some wiggle room
    context_window=3900,
    # kwargs to pass to __call__()
    generate_kwargs={},
    # kwargs to pass to __init__()
    # set to at least 1 to use GPU
    model_kwargs={"n_gpu_layers": 1},
    # transform inputs into Llama2 format
    messages_to_prompt=messages_to_prompt,
    completion_to_prompt=completion_to_prompt,
    verbose=False,
    # verbose=True,
)
print("\n# Loaded model\n")

print("\n## Simple Q&A\n")

question = "Hello! Can you tell me a poem about cats and dogs?"
print(f"Question: {question}")
response = llm.complete("Hello! Can you tell me a poem about cats and dogs?")
print(f"Response: {response.text}")

print("\n## Streaming Q&A\n")

question = "Can you write me a poem about fast cars?"
print(f"Question: {question}")
print(f"Answer: ", end="", flush=True)
response_iter = llm.stream_complete(question)
for response in response_iter:
    print(response.delta, end="", flush=True)
