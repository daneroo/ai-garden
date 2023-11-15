import os
from dotenv import load_dotenv                                                                                             
import interpreter

load_dotenv()
openai_api_key = os.environ["OPENAI_API_KEY"]


# interpreter.chat("Plot AAPL and META's normalized stock prices") # Executes a single command
interpreter.chat() # Starts an interactive chat
