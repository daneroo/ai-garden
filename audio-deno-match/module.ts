// module.ts

import { getTextNodes, parseHTML } from "./dom.ts";
import { getHTML } from "./epub.ts";
import { parseVTT } from "./vtt.ts";

export function hello() {
  return "Hello, world!";
}

export async function main() {
  const choices = [
    {
      name: "The Road Not Taken",
      epubFile: "",
      htmlFile: "../audio-reader-html/media/theroadnottaken.html",
      vttFile: "../audio-reader-html/media/theroadnottaken.vtt",
    },
    {
      name: "The Blade Itself",
      epubFile: "../audio-reader-html/media/thebladeitself.epub",
      // htmlFile: "../audio-reader-html/media/thebladeitself.html",
      htmlFile: "",
      vttFile: "../audio-reader-html/media/thebladeitself.vtt",
    },
    {
      name: "Ruin",
      epubFile: "../audio-reader-html/media/ruin.epub",
      htmlFile: "",
      vttFile: "../audio-reader-html/media/ruin.vtt",
    },
  ];
  let { epubFile, htmlFile, vttFile } = choices[1];

  for (let i = 0; i < Deno.args.length; i++) {
    const arg = Deno.args[i];
    if (arg === "--html") {
      htmlFile = Deno.args[i + 1];
      i++;
    } else if (arg === "--epub") {
      epubFile = Deno.args[i + 1];
      i++;
    } else if (arg === "--vtt") {
      vttFile = Deno.args[i + 1];
      i++;
    }
  }

  if (!vttFile || (!htmlFile && !epubFile)) {
    console.error(
      "The --vtt argument is required, and either --html or --epub is required"
    );
    Deno.exit(1);
  }

  let htmlDoc;
  if (htmlFile) {
    console.log(`HTML file: ${htmlFile}`);
    // load the file and parse it
    const htmlContent = Deno.readTextFileSync(htmlFile);
    htmlDoc = parseHTML(htmlContent);
  }
  if (epubFile) {
    console.log(`EPUB file: ${epubFile}`);
    // load the file and parse it
    const html = await getHTML(epubFile);
    console.log(`|html|: ${html.length}`);
    console.log(`html: ${html.slice(0, 1000)}...`);
    await Deno.writeTextFile("output.html", html);
    htmlDoc = parseHTML(html);
  }
  if (!htmlDoc) {
    console.error("Failed to parse HTML");
    Deno.exit(1);
  }
  console.log(`- |HTML document text nodes|: ${getTextNodes(htmlDoc).length}`);

  const cues = parseVTT(Deno.readTextFileSync(vttFile));
  console.log(`VTT file: ${vttFile} has ${cues.length} cues`);
}

// If this module is the main module, then call the main function
if (import.meta.main) {
  await main();
}
