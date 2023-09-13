import { Configuration, OpenAIApi } from "openai";

// careful localhost does not work here
const openAIApiBaseURL = "http://127.0.0.1:4891/v1";

const verbose = true;

const prompts = [
  "What is the prime number theorem (PNT)?",
  "In which Lord of the Rings book does Tom Bombadil first appear?",
  "Who is Michael Jordan?",
];
const models = [
  "llama-2-7b-chat.ggmlv3.q4_0.bin",
  "wizardlm-13b-v1.1-superhot-8k.ggmlv3.q4_0.bin",
];

const methods = {
  "node Fetch": withFetch,
  "openai API": withOpenaiAPI,
};

console.log(`\n# OpenAI API invocations (local: ${openAIApiBaseURL})`);
console.log(
  `Will invoke ${prompts.length} prompts with ${models.length} models`
);
console.log(`Verbosity: ${verbose ? "on" : "off"}`);

for (const model of models) {
  console.log(`\n## Model: ${model}`);
  for (const prompt of prompts) {
    for (const [methodName, asyncFunc] of Object.entries(methods)) {
      try {
        console.log(`\n- Prompt: ${prompt} (with ${methodName})`);
        const responseData = await asyncFunc(prompt, model, openAIApiBaseURL);
        if (verbose) {
          console.log(
            "- Response (full):",
            JSON.stringify(responseData, null, 2)
          );
        } else {
          console.log(
            "- Response (short):",
            JSON.stringify(responseData?.choices?.[0]?.text, null, 2)
          );
        }
      } catch (error) {
        console.error("Error:", error.message);
        console.error("Make sure");
        console.error("- GPT4All is running (API enabled - port 4891");
        console.error(
          `- model ${data.model} is available (~/Library/Application Support/nomic.ai/GPT4All)`
        );
        process.exit();
      }
    }
  }
}

// just completes with default params, but any can be added in partialCompletionParams
// expects at least prompt (and a model)
function augmentedCompletionParams(partialCompletionParams) {
  const defaultCompletionParams = {
    max_tokens: 150,
    temperature: 0.28,
    top_p: 0.95,
    n: 1,
    echo: false,
    stream: false,
  };
  return {
    ...defaultCompletionParams,
    ...partialCompletionParams,
  };
}

async function withFetch(prompt, model, baseURL = openAIApiBaseURL) {
  const completionParams = augmentedCompletionParams({
    prompt: prompt,
    model: model,
  });
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(completionParams),
  };

  const url = `${baseURL}/completions`;
  const response = await fetch(url, requestOptions);
  const responseData = await response.json();
  return responseData;
}

async function withOpenaiAPI(prompt, model, baseURL = openAIApiBaseURL) {
  const completionParams = augmentedCompletionParams({
    prompt: prompt,
    model: model,
  });

  const configuration = new Configuration({
    apiKey: "not needed for a local LLM",
    basePath: baseURL,
  });
  const openai = new OpenAIApi(configuration);
  const completion = await openai.createCompletion(completionParams);
  return completion?.data;
}
