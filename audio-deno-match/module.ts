// module.ts

import { parseHTML } from "./dom.ts";
import { parseVTT } from "./vtt.ts";

export function hello() {
  return "Hello, world!";
}

export function main() {
  // let htmlFile = "../audio-reader-html/media/theroadnottaken.html";
  // let vttFile = "../audio-reader-html/media/theroadnottaken.vtt";
  let htmlFile = "../audio-reader-html/media/thebladeitself.html";
  let vttFile = "../audio-reader-html/media/thebladeitself.vtt";

  for (let i = 0; i < Deno.args.length; i++) {
    const arg = Deno.args[i];
    if (arg === "--html") {
      htmlFile = Deno.args[i + 1];
      i++;
    } else if (arg === "--vtt") {
      vttFile = Deno.args[i + 1];
      i++;
    }
  }

  if (!htmlFile || !vttFile) {
    console.error("Both --html and --vtt arguments are required");
  }

  console.log(`HTML file: ${htmlFile}`);

  // load the file and parse it
  const htmlContent = Deno.readTextFileSync(htmlFile);
  const htmlDoc = parseHTML(htmlContent);

  const cues = parseVTT(Deno.readTextFileSync(vttFile));
  console.log(`VTT file: ${vttFile} has ${cues.length} cues`);
}

// If this module is the main module, then call the main function
if (import.meta.main) {
  main();
}
