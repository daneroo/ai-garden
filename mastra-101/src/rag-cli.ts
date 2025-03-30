import { mastra } from "./mastra";

async function main() {
  try {
    const agent = mastra.getAgent("ragAgent");

    // Test queries about Aristotle's Ethics
    const queries = [
      "What is the highest good according to Aristotle?",
      "How does Aristotle define virtue?",
      "What is the relationship between happiness and virtue?",
    ];

    for (const query of queries) {
      console.log("\nQuery:", query);
      const response = await agent.generate(query);
      console.log("Response:", response.text);
      console.log("-".repeat(80));
    }
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
