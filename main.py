from gpt4all import GPT4All
from bs4 import BeautifulSoup
import glob
import time

# $ ls ~/.cache/gpt4all/ggml-*
# ggml-gpt4all-j-v1.3-groovy.bin  ggml-gpt4all-l13b-snoozy.bin    ggml-vicuna-13b-1.1-q4_2.bin

# gptj =         GPT4All("ggml-gpt4all-j-v1.3-groovy")
# gptj = GPT4All("ggml-gpt4all-j-v1.3-groovy")
# describe vicuna-13b
# gptj = GPT4All("ggml-vicuna-13b-1.1-q4_2")
# bestLlama
# gptj = GPT4All("ggml-gpt4all-l13b-snoozy.bin")
gptj = GPT4All("/Users/daniel/.cache/gpt4all/ggml-gpt4all-l13b-snoozy.bin")
messages = [{"role": "user", "content": "Name 3 colors"}]
gptj.chat_completion(messages)

# print(f"models :{ gptj.list_models() }")    

def extract_text_from_html_file(file_path):
    """
    This function takes an HTML file path as input and returns the text content of the file.
    """
    with open(file_path, "r") as f:
        soup = BeautifulSoup(f, "html.parser")
        text = soup.get_text()
    return text


def summarize_first_lines_in_files(file_glob, nFiles, maxSegmentLen=6000):
    """
    This function takes a file glob as input and returns a dictionary containing the filename and the number of lines in each file.
    """
    files = glob.glob(file_glob, include_hidden=True)
    sorted_files = sorted(files)
    file_start_offset = 6
    for fi, file in enumerate(
        sorted_files[file_start_offset : file_start_offset + nFiles]
    ):
        with open(file, "r") as f:
            # lines = f.readlines()
            # print(f"file: {file}: raw lines:{len(lines)}")
            text = extract_text_from_html_file(file)
            # print(f"text: {text}")
            lines = text.splitlines()
            non_blank_lines = [line for line in lines if line.strip()]
            # print(f"file: {file}: non-blank lines:{len(non_blank_lines)}")

            segments = []
            current_segment = ""
            for line in non_blank_lines:
                if len(current_segment) + len(line) > maxSegmentLen:
                    segments.append(current_segment)
                    current_segment = ""
                current_segment += line + "\n"
            if current_segment:
                segments.append(current_segment)

            print(
                f"=-=- file: file-{fi:03d} ({file}) segments:{len(segments)} non-blank lines:{len(non_blank_lines)}"
            )

            start_time = time.monotonic()
            for i, segment in enumerate(segments):
                segment_name = f"file-{fi:03d}-segment-{i:03d}"
                print(f"segment: {segment_name} ({file})")

                messages = [
                    {
                        "role": "system",
                        #         "content": """### Instruction:
                        # The prompt below is a question to answer, a task to complete, or a conversation
                        # to respond to; decide which and write an appropriate response.
                        # \n### Prompt: """,
                        "content": """### Instruction: 
                summarize the book excerpt below in at most 30 words. consider plot, characters and physical environment.
                \n### Excerpt: """,
                    },
                    {
                        "role": "user",
                        "content": f"{segment}",
                    },
                ]
                # completion = gptj.chat_completion(messages)
                completion = gptj.chat_completion(
                    messages,
                    default_prompt_header=False,
                    default_prompt_footer=True,
                    verbose=False,
                )

                if isinstance(completion, dict):
                    # always 1 choice for now
                    choices = completion.get("choices")
                    if isinstance(choices, (list, tuple)):
                        try:
                            response = choices[0].get("message").get("content")
                            print(f"response: {response}")
                        except (AttributeError, IndexError, TypeError):
                            print("completion is not of expected shape")
                            print(f"completion: {completion}")

                    usage = completion.get("usage")
                    end_time = time.monotonic()
                    elapsed = round(end_time - start_time, 2)
                    if isinstance(usage, dict):
                        usage["elapsed"] = elapsed
                    print(f"usage: {usage}")
                else:
                    print("completion is not a dictionary")
                print("_______")


# summarize_first_lines_in_files("books/heroes/.html_split_*", 10000)
