import os
import requests
import pinecone
from dotenv import load_dotenv
from langchain.document_loaders import UnstructuredFileLoader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Pinecone
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

# Loading environment variables
load_dotenv()

# Global variables
pinecone_index_name = "knowledge"
text_url = "https://github.com/trancethehuman/LLMSchool/blob/main/sample-data/transcript-lex-huberman-2023.txt?raw=true"
file_name = os.path.basename(text_url.split("?")[0])


print("Hello workshop-5")

# Check for required environment variables
required_env_vars = ["PINECONE_ENV", "PINECONE_API_KEY", "OPENAI_API_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    for var in missing_vars:
        print(f"Error: {var} environment variable is empty or undefined.")
    print("Exiting...")
    exit()
print("All required environment variables are defined.")

# Initialize pinecone
pinecone.init(
    api_key=os.getenv("PINECONE_API_KEY"),
    environment=os.getenv("PINECONE_ENV"),
)

# Check if file already exists, download it if not
if not os.path.exists(file_name):
    print("File not found. Downloading from the provided URL...")

    # Fetch the content from the text_url
    response = requests.get(text_url)
    content = response.text

    # Save the content to a local file
    with open(file_name, "w") as file:
        file.write(content)
else:
    print("File already exists. Skipping download.")

# Load the local file with UnstructuredURLLoader
loader = UnstructuredFileLoader(file_path=file_name, show_progress_bar=True)
documents = loader.load()

text_splitter = CharacterTextSplitter(chunk_size=1350, chunk_overlap=140)
docs = text_splitter.split_documents(documents)

embeddings = OpenAIEmbeddings()
pinecone_langchain_vectorstore = Pinecone.from_existing_index(
    pinecone_index_name, embeddings
)
pinecone_langchain_vectorstore.add_documents(docs)

llm = ChatOpenAI(
    openai_api_key=os.getenv("OPENAI_API_KEY"),
    model_name="gpt-3.5-turbo",
    temperature=0,
)
qa = RetrievalQA.from_chain_type(
    llm=llm, chain_type="stuff", retriever=pinecone_langchain_vectorstore.as_retriever()
)
result = qa.run("What is Huberman's view on health")
print(result)
