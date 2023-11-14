import { ConsoleCallbackHandler } from "langchain/callbacks";
import { basename } from "node:path";

export class MyConsoleCallbackHandler extends ConsoleCallbackHandler {
  /**
   * Called when the chain starts running.
   * @param {Run} run - The current run instance.
   */
  onChainStart(run) {
    const { id, name, start_time, inputs } = run;
    console.log(`< Chain (${name}) start`);
    if (name == "RefineDocumentsChain") {
      const { input_documents } = inputs;
      console.log(`  - Input documents: (${input_documents.length})`);
      for (const doc of input_documents) {
        const source = basename(doc.metadata.source);

        const loc = `${doc.metadata.loc.lines.from} - ${doc.metadata.loc.lines.to}`;
        console.log(
          `    - chunk length: ${doc.pageContent.length} characters source: ${source} - loc: ${loc}:`
        );
        // snip
        const snip = doc.pageContent.substring(0, 100).replace(/\n/g, " ");
        console.log(`        ${snip}...`);
      }
    } else if (name == "LLMChain") {
      console.log(`  - Input keys [${Object.keys(inputs).join(", ")}]`);
      for (const [key, value] of Object.entries(inputs)) {
        const snip = value.substring(0, 100).replace(/\n/g, " ");
        console.log(`    - ${key} (${value.length}): ${snip}...`);
      }
    }
  }
  onChainEnd(run) {
    const { id, name, start_time, inputs, outputs } = run;
    console.log(`> Chain (${name}) end`);
    if (name == "RefineDocumentsChain") {
    }
    console.log(`  - Input keys [${Object.keys(inputs).join(", ")}]`);
    // for (const [key, value] of Object.entries(inputs)) {
    //   // output value type only if not string
    //   if (typeof value !== "string") {
    //     console.log(`    - ${key}: ${typeof value}`);
    //     continue;
    //   }
    //   const snip = value.substring(0, 100).replace(/\n/g, " ");
    //   console.log(`    - ${key}: ${snip}...`);
    // }
    console.log(`  - Output keys (${Object.keys(outputs).length})`);
    for (const [key, value] of Object.entries(outputs)) {
      const snip = value.substring(0, 100).replace(/\n/g, " ");
      console.log(`    - ${key} (${value.length}): ${snip}...`);
    }
    // extra tracing for now
    // if text is in outputs, print it
    if (outputs?.text) {
      console.log(`DBG: ---\n${outputs?.text}\n---`);
    }
    // if output_text in outputs, print it
    if (outputs?.output_text) {
      console.log(`DBG: ---\n${outputs?.output_text}\n---`);
    }
  }
}
