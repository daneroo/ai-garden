# open-interpreter

Run a [local code interpreter](https://github.com/KillianLucas/open-interpreter/).

Try using: <https://huggingface.co/TheBloke/CodeLlama-13B-Instruct-GGUF/resolve/main/codellama-13b-instruct.Q4_0.gguf>

## Setup

```bash
# poetry env is not needed if the
# poetry:pyproject is correct: python = ">=3.11,<3.12"
poetry env use python3.11

poetry install
poetry shell
code .
# Start the LM Studio server
❯ interpreter --local


▌ Open Interpreter's local mode is powered by LM Studio.


You will need to run LM Studio in the background.

 1 Download LM Studio from https://lmstudio.ai/ then start it.

 2 Select a language model then click Download.


 4 Select your model at the top, then click Start Server.
Once the server is running, you can begin your conversation below.
```

## References

- <https://github.com/KillianLucas/open-interpreter/>
