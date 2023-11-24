import { ChatOllama } from "langchain/chat_models/ollama";
import { PromptTemplate } from "langchain/prompts";
import { RunnableSequence } from "langchain/schema/runnable";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";

console.log(`# Basics Output Parser

Here we simply invoke a chain (RunnableSequence)
that includes an StructuredOutputParser (Zod) as it's last step.

We are parsing an output that is a list of colors and moods.
The output is a JSON Object, so we use Zod to specify the schema.

Mistral seemed much better at this than Llama2.
But after tuning prompt and schema, Llama2 is better.
And now both are pretty reliable.
Temperature of the model was set to 0, which helped a lot.


- Five colors/moods
  - Model: mistral - Total attempts: 10 Success rate: 100.00%
  - Model: mistral - Total attempts: 10 Success rate: 100.00%
  - Model: llama2 - Total attempts: 10 Success rate: 100.00%
  - Model: llama2 - Total attempts: 10 Success rate: 100.00%
- Novel characters
  - Model: mistral - Total attempts: 10 Success rate: 100.00%
  - Model: mistral - Total attempts: 10 Success rate: 100.00%
  - Model: llama2 - Total attempts: 10 Success rate: 100.00%
  - Model: llama2 - Total attempts: 10 Success rate: 100.00%
\n`);

const verbose = false;
const modelName = "llama2"; // llama2,mistral

const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: modelName,
  maxConcurrency: 1,
  // actually makes things worse??
  // format: "json",
  temperature: 0, // very helpful for this task
});

console.log(`## Chat modelName: ${modelName}\n`);
// console.log(`- Model: ${JSON.stringify(model, null, 2)}`);

const schemaAndTemplateFString = {
  colorsAndMoods: {
    schema: z
      .object({
        colors: z.array(
          z.object({
            name: z.string().describe("the name of the color"),
            mood: z.string().describe("The mood associated with the color"),
          })
        ),
      })
      .describe("A list of colors and moods"),
    templateFString: `
    Make a list of 3 colors.
    For each color, specify the name of the color and a mood associated with the color
    
    Format the output as JSON. 
    {format_instructions}
    
    Only include the JSON Output. No other text is allowed.
    `,
  },
  novelCharacters: {
    schema: z
      .object({
        characters: z.array(
          z.object({
            name: z.string().describe("name of the character"),
            // gender: z.enum(["man", "woman"]).describe("gender of the character"),
            description: z
              .string()
              .describe("short description of the character"),
          })
        ),
      })
      .describe("A list of characters"),
    templateFString: `
    - Pick a well known novel. 
    - Name 3 main characters in the novel.
    - Only show the list of characters.
    - For each character, specify their name and a very short description.
    
    Format the output as JSON.
    {format_instructions}
    
    `,
  },
};

// which schema and template to use
// const { schema, templateFString } = schemaAndTemplateFString.colorsAndMoods;
const { schema, templateFString } = schemaAndTemplateFString.novelCharacters;

const parser = StructuredOutputParser.fromZodSchema(schema);

if (verbose) {
  console.log("Parser instructions:\n", parser.getFormatInstructions());
}

const promptTemplate = PromptTemplate.fromTemplate(templateFString);

const chain = RunnableSequence.from([promptTemplate, model, parser]);
// const chain = RunnableSequence.from([promptTemplate, model]);

if (verbose) {
  console.log(`- Chain: ${JSON.stringify(chain, null, 2)}`);
}

// Iterate until successful
async function untilSuccessful() {
  let attempts = 0;
  while (true) {
    try {
      attempts++;
      const result = await chain.invoke({
        // topic,
        format_instructions: parser.getFormatInstructions(),
      });

      if (verbose) {
        console.log(`- Result: ${JSON.stringify(result, null, 2)}\n`);
      }
      return { result, attempts };
    } catch (err) {
      console.error(err);
      console.log(`  .. Failed to parse text. Retrying...`);
    }
  }
}

let totalAttempts = 0;
let totalSuccesses = 0;
for (let i = 0; i < 10; i++) {
  const { result, attempts } = await untilSuccessful();
  totalAttempts += attempts;
  totalSuccesses += 1;
  const successRate = ((1.0 / attempts) * 100).toFixed(2);
  console.log(
    `- #${i} success rate: ${successRate}% attempts: ${attempts}, result as a JSON Object:\n`,
    JSON.stringify(result)
  );
}
console.log(`\n## Summary:`);
// - Model: llama2 - Total attempts: 52 Success rate: 19.23%
const successRate = ((totalSuccesses / totalAttempts) * 100).toFixed(2);
console.log(
  `- Model: ${modelName} - Total attempts: ${totalAttempts} Success rate: ${successRate}%`
);
