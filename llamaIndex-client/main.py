import os
from dotenv import load_dotenv

load_dotenv()

# Now you can access the variables using os.getenv
my_var = os.getenv("OPENAI_API_KEY")
print(f"OpenAI API Key: {my_var}")
