from bs4 import BeautifulSoup
from gpt4all import GPT4All
from pathlib import Path
import argparse

# Available models: https://raw.githubusercontent.com/nomic-ai/gpt4all/main/gpt4all-chat/metadata/models.json
# local models
# $ ls ~/.cache/gpt4all/ggml-*
# ggml-gpt4all-j-v1.3-groovy.bin  ggml-gpt4all-l13b-snoozy.bin    ggml-vicuna-13b-1.1-q4_2.bin

default_model_name = "llama-2-7b-chat.ggmlv3.q4_0.bin"
# default_model_name = "wizardlm-13b-v1.1-superhot-8k.ggmlv3.q4_0.bin"
default_model_path = Path.home() / ".cache" / "gpt4all"


# List the models
def list_available_models(verbose=False):
    models = GPT4All.list_models()
    print("Available Models (* is default size in GB if downloaded)")
    for model in models:
        is_default = model["filename"] == default_model_name
        starIfDefault = "* " if is_default else ""
        size = model_size(model["filename"])
        sizeInMBIfDownloaded = f" ({size / 1e9:.2f} GB)" if size > 0 else ""
        extra = ""
        if verbose:
            description = model["description"]
            soup = BeautifulSoup(description, "html.parser")
            description_text = soup.get_text()
            extra = f": {description_text}"
        # debug print verbose and extra
        print(f"- {starIfDefault}{model['filename']}{sizeInMBIfDownloaded}{extra}")


# model size in bytes, 0 if path does not exist
def model_size(model_name):
    model_path = default_model_path / model_name
    if not model_path.exists():
        return 0
    return model_path.stat().st_size


parser = argparse.ArgumentParser(description="Process some command line arguments.")
parser.add_argument("-l", "--list", action="store_true", help="List available models")
parser.add_argument("-v", "--verbose", action="store_true", help="Print verbose output")
parser.add_argument(
    "-m", "--model", type=str, help="Specify a model to use", default=default_model_name
)
parser.add_argument("-p", "--prompt", type=str, help="Specify a prompt to use")


args = parser.parse_args()

if args.list:
    list_available_models(verbose=args.verbose)
    exit(0)

model_name = args.model
prompts = [
    "What is the prime number theorem (PNT)?",
    "In which Lord of the Rings book does Tom Bombadil first appear?",
    "Who is Michael Jordan?",
    "Name 3 colors",
]
if args.prompt:
    prompts = [args.prompt]

# print the prompts length and model name
print(f"I will invoke {len(prompts)} prompts with model: {model_name}")
model = GPT4All(
    model_name=model_name,
)

# for each prompt, generate 3 completions
for prompt in prompts:
    print(f"\nPrompt: {prompt}")
    response = model.generate(prompt, streaming=False)
    print(f"Response: {response}")
