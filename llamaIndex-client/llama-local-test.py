import argparse
import asyncio

from llama_index import (
    SimpleDirectoryReader,
    VectorStoreIndex,
    ServiceContext,
)
from llama_index import set_global_service_context
from llama_index.llms import LlamaCPP
from llama_index.llms.llama_utils import messages_to_prompt, completion_to_prompt
from llama_index.embeddings import HuggingFaceEmbedding
from llama_index.response_synthesizers import TreeSummarize

from rich.console import Console
from rich.markdown import Markdown
import time

console = Console()

"""
This example demonstrates llamaIndex-client usage with a local LlamaCPP model (llama-2-13b-chat).
"""

parser = argparse.ArgumentParser(description="Invoke a local LLM (Llama-2-13b-chat)")
# parser.add_argument("-l", "--list", action="store_true", help="List available models")
parser.add_argument("-v", "--verbose", action="store_true", help="Print verbose output")
parser.add_argument("--simple", action="store_true", help="Simple Q&A")
parser.add_argument("--streaming", action="store_true", help="Streaming Q&A")
parser.add_argument("--rag", action="store_true", help="RAG Q&A")
parser.add_argument("--summarize", action="store_true", help="Summarize text")

args = parser.parse_args()

if not (args.simple or args.streaming or args.rag or args.summarize):
    parser.print_help()
    exit(1)


def h2(message):
    console.print(Markdown(f"**{message}**"))


def progress(message):
    console.print(Markdown(f"... *{message}*"))


def load_model(verbose=False):
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
        verbose=verbose,
        # verbose=True,
    )
    progress("Loaded model")
    return llm


def simple_QA(llm):
    h2("Simple Q&A")

    question = "Hello! Can you tell me a poem about cats and dogs?"
    print(f"Question: {question}")
    response = llm.complete("Hello! Can you tell me a poem about cats and dogs?")
    print(f"Response: {response.text}")


def streaming_QA(llm):
    h2("Streaming Q&A")

    question = "Can you write me a poem about fast cars?"
    print(f"Question: {question}")
    print(f"Answer: ", end="", flush=True)
    response_iter = llm.stream_complete(question)
    for response in response_iter:
        print(response.delta, end="", flush=True)


def createQueryEngine(llm):
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")
    progress("Loaded embedding model")

    # create a service context
    service_context = ServiceContext.from_defaults(
        llm=llm,
        embed_model=embed_model,
    )
    progress("Created service context")

    set_global_service_context(service_context)

    progress("Set service context as default")

    # load documents
    reader = SimpleDirectoryReader(
        input_dir="./data/paul_graham", required_exts=[".txt"]
    )
    documents = reader.load_data()
    progress(f"Loaded ({len(documents)}) documents")

    # create vector store index
    index = VectorStoreIndex.from_documents(documents, service_context=service_context)
    progress("Created index")

    # set up query engine
    query_engine = index.as_query_engine()
    progress("Created query engine")
    return query_engine


# TODO(daneroo): this is not working yet
async def summarize(llm):
    h2("Summarize")
    truncate_length = 15000  # in bytes, document is 75014
    print(f"Had to truncate input to {truncate_length}...")

    reader = SimpleDirectoryReader(input_dir="./data/paul_graham")
    documents = reader.load_data()
    progress(f"Loaded ({len(documents)}) documents")
    progress(f"First document has length {len(documents[0].text)}")
    text = documents[0].text[:truncate_length]

    summarizer = TreeSummarize(
        verbose=True,
    )
    question = "Who is Paul Graham?"
    print(f"Question: {question}")
    response = await summarizer.aget_response(question, [text])
    # print(f"Response: {response.text}")
    print(f"Response: {response}")


def rag_QA(llm, query_engine):
    h2("RAG Q&A")
    question = "What did the author do growing up?"
    print(f"Question: {question}")
    for i in range(10):
        start_time = time.time()
        response = query_engine.query(question)
        end_time = time.time()
        print(f"Response {i+1}: {response}")
        print(f"Execution time {i+1}: {end_time - start_time} seconds")
    print("\n")


llm = load_model(verbose=args.verbose)

if args.simple:
    simple_QA(llm)

if args.streaming:
    streaming_QA(llm)

if args.rag:
    query_engine = createQueryEngine(llm)
    rag_QA(llm, query_engine)

if args.summarize:
    query_engine = createQueryEngine(llm)
    asyncio.run(summarize(llm))
