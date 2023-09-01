import { Configuration, OpenAIApi } from "openai";

// curl -X POST   -H "Content-Type: application/json"   -d '{"model": "mpt-7b-chat", "prompt": "Who is Michael Jordan?", "max_tokens": 50, "temperature": 0.28, "top_p": 0.95, "n": 1, "echo": true, "stream": false}'   "http://localhost:4891/v1/completions"

// const url = "http://localhost:4891/v1/completions";
const url = "http://127.0.0.1:4891/v1/completions";
const data = {
  model: "mpt-7b-chat",
  prompt: "Who is Michael Jordan?",
  max_tokens: 50,
  temperature: 0.28,
  top_p: 0.95,
  n: 1,
  echo: true,
  stream: false,
};

const requestOptions = {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
};

try {
  const response = await fetch(url, requestOptions);
  const responseData = await response.json();
  console.log("fetch:", JSON.stringify(responseData, null, 2));
} catch (error) {
  console.error("Error:", error);
}

// from  GPT4All
// openai.api_base = "http://localhost:4891/v1"
// #openai.api_base = "https://api.openai.com/v1"
// openai.api_key = "not needed for a local LLM"

const configuration = new Configuration({
  apiKey: "not needed for a local LLM",
  // basePath: "http://localhost:4891/v1",
  basePath: "http://127.0.0.1:4891/v1",
});

// console.log(configuration);
const openai = new OpenAIApi(configuration);

// model=model,
// prompt=prompt,
// max_tokens=50,
// temperature=0.28,
// top_p=0.95,
// n=1,
// echo=True,
// stream=False

const completion = await openai.createCompletion({
  // model: "text-davinci-003", // OpenAI
  // model: "gpt-3.5-turbo", // GPT4all
  model: "mpt-7b-chat",
  // model: "gpt4all-j-v1.3-groovy",
  // prompt: "Pick three colors",
  prompt: "Who is Michael Jordan?",
  max_tokens: 50,
  temperature: 0.28,
  top_p: 0.95,
  n: 1,
  echo: true,
  stream: false,
});
console.log("openai:text", completion.data.choices[0].text);
console.log("openai:", JSON.stringify(completion.data));
