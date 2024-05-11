// module.ts

import {
  getTextNodes,
  parseHTML,
} from './dom.ts';
import { getHTML } from './epub.ts';
import {
  createReverseMap,
  match,
  normalizeText,
  validateReverseMap,
} from './match.ts';
import { parseVTT } from './vtt.ts';

export function hello() {
  return "Hello, world!";
}

type HTMLSource = {
  name: string;
  htmlFile: string;
  vttFile: string;
};

type EPubSource = {
  name: string;
  epubFile: string;
  vttFile: string;
};

type Source = HTMLSource | EPubSource;

// Should probably be imported from dom.ts, but then it would need to be exported from there...
type HTMLDocument = ReturnType<typeof parseHTML>;
async function htmlDocForSource(source: Source): Promise<HTMLDocument> {
  if ("htmlFile" in source) {
    // source is an HTMLSource
    console.log(`- htmlFile: ${source.htmlFile}`);
    const html = await Deno.readTextFile(source.htmlFile);
    return parseHTML(html);
  } else if ("epubFile" in source) {
    // source is an EPubSource
    console.log(`- epubFile: ${source.epubFile}`);
    const html = await getHTML(source.epubFile);
    // console.log(`|html|: ${html.length}`);
    // console.log(`html: ${html.slice(0, 1000)}...`);
    await Deno.writeTextFile("output.html", html);
    return parseHTML(html);
  } else {
    throw new Error("Invalid source");
  }
}

export async function main() {
  const sources: Record<string, Source> = {
    road: {
      name: "The Road Not Taken",
      htmlFile: "../audio-reader-html/media/theroadnottaken.html",
      vttFile: "../audio-reader-html/media/theroadnottaken.vtt",
    },
    blade: {
      name: "The Blade Itself",
      epubFile: "../audio-reader-html/media/thebladeitself.epub",
      vttFile: "../audio-reader-html/media/thebladeitself.vtt",
    },
    ruin: {
      name: "Ruin",
      epubFile: "../audio-reader-html/media/ruin.epub",
      vttFile: "../audio-reader-html/media/ruin.vtt",
    },
  };
  // let { epubFile, htmlFile, vttFile } = choices[0];

  const sourceKey = Deno.args[0];
  if (!(sourceKey in sources)) {
    console.error("Invalid choice, must be one of: " + Object.keys(sources));
    Deno.exit(1);
  }
  const source = sources[sourceKey];

  const htmlDoc = await htmlDocForSource(source);
  if (!htmlDoc) {
    console.error("Failed to parse HTML");
    Deno.exit(1);
  }
  const textNodes = getTextNodes(htmlDoc);
  console.log(`- |HTML document text nodes|: ${textNodes.length}`);
  console.log(`- |html.inner|: ${htmlDoc.body.innerHTML.length}`);

  console.log(`- vttFile: ${source.vttFile}`);
  const cues = parseVTT(Deno.readTextFileSync(source.vttFile));
  console.log(`- |VTT Cues|: ${cues.length} cues`);

  const verbose = false;
  {
    // non normalized
    const reverseMap = createReverseMap(htmlDoc.body.textContent, textNodes);
    const ok = validateReverseMap(
      reverseMap,
      htmlDoc.body.textContent,
      textNodes,
      verbose
    );
    if (!ok) {
      console.error("ReverseMap validation (original) failed");
      Deno.exit(1);
    } else {
      console.log("ReverseMap validation (original) passed");
    }
  }
  {
    const normalizedTextContent = normalizeText(htmlDoc.body.textContent);
    const normalizedTextNodes = textNodes
      .map(normalizeText)
      .filter((t) => t.length > 0);

    const reverseMap = createReverseMap(
      normalizedTextContent,
      normalizedTextNodes
    );
    const ok = validateReverseMap(
      reverseMap,
      normalizedTextContent,
      normalizedTextNodes,
      verbose
    );
    if (!ok) {
      console.error("ReverseMap validation (normalized) failed");
      Deno.exit(1);
    } else {
      console.log("ReverseMap validation (normalized) passed");
    }
  }

  Deno.exit(0);

  match(cues, textNodes);
}

// If this module is the main module, then call the main function
if (import.meta.main) {
  await main();
}
