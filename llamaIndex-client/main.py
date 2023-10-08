import os
from dotenv import load_dotenv
import logging
import sys
from llama_index import TreeIndex, SimpleDirectoryReader

"""
This example demonstrates llamaIndex-client usage with the openai API.
"""

load_dotenv()  # get OPENAI_API_KEY


def qAndA(query_engine, q):
    """
    Prints the query and response for a given query engine and query.

    Args:
        query_engine (llama_index.QueryEngine): The query engine to use for the query.
        q (str): The query string to use.

    Returns:
        None
    """
    print(f"Query: {q}")
    response = query_engine.query(q)
    print(f"Response: {response}")


if os.getenv("OPENAI_API_KEY") is None or os.getenv("OPENAI_API_KEY") == "":
    print("OPENAI_API_KEY is not set or empty, set it in your .env file")
    sys.exit(1)


logging.basicConfig(stream=sys.stdout, level=logging.INFO)
# logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

logging.getLogger().addHandler(logging.StreamHandler(stream=sys.stdout))

documents = SimpleDirectoryReader("data").load_data()
new_index = TreeIndex.from_documents(documents)

# set Logging to DEBUG for more detailed outputs
query_engine = new_index.as_query_engine()

print("\n# Basic examples")
qAndA(query_engine, "What did the author do growing up?")
qAndA(query_engine, "What did the author do after his time at Y Combinator?")

# [Demo] Leaf traversal with child_branch_factor=2
print("\n# Leaf traversal with child_branch_factor=2")
query_engine = new_index.as_query_engine(child_branch_factor=2)
qAndA(query_engine, "What did the author do growing up?")

# [Demo] Build Tree Index during Query-Time
print("\n# Build Tree Index during Query-Time")
documents = SimpleDirectoryReader("data").load_data()
index_light = TreeIndex.from_documents(documents, build_tree=False)
query_engine = index_light.as_query_engine(
    retriever_mode="all_leaf",
    response_mode="tree_summarize",
)
qAndA(query_engine, "What did the author do after his time at Y Combinator?")
