from gpt4all import GPT4All

# Available models: https://raw.githubusercontent.com/nomic-ai/gpt4all/main/gpt4all-chat/metadata/models.json
# local models
# $ ls ~/.cache/gpt4all/ggml-*
# ggml-gpt4all-j-v1.3-groovy.bin  ggml-gpt4all-l13b-snoozy.bin    ggml-vicuna-13b-1.1-q4_2.bin


# gptj = GPT4All("ggml-gpt4all-j-v1.3-groovy")
# describe vicuna-13b
# gptj = GPT4All("ggml-vicuna-13b-1.1-q4_2")
# bestLlama
# gptj = GPT4All("/Users/daniel/.cache/gpt4all/ggml-gpt4all-l13b-snoozy.bin")
gptj = GPT4All("ggml-gpt4all-l13b-snoozy.bin")

# # Do I need a model to list the models?
# models = gptj.list_models()
# # print(f"models :{ models }")
# print("Models")
# for model in models:
#     print(f"model: {model['filename']}")
#     print(f"  {model['description']}")


# for each prompt, generate 3 completions
prompts = [
    "Name 3 colors",
    "Who is Michael Jordan?",
]
for prompt in prompts:
    messages = [{"role": "user", "content": prompt}]
    print(f"prompt: {prompt}")
    gptj.chat_completion(messages, streaming=True, verbose=False)
