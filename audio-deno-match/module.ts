// module.ts

import { getTextNodes, type HTMLDocument, parseHTML } from "./dom.ts";
import { getHTML } from "./epub.ts";
import {
  createTextRanges,
  matchCuesToTextRanges,
  matchWordSequences,
  normalizeText,
  validateTextRanges,
} from "./match.ts";
import { parseVTT } from "./vtt.ts";

const verboseMemory = false;

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
    throw new Error("Invalid source type");
  }
}

type MakeRangesOptions = {
  normalize: boolean;
  verbose: boolean;
};

function makeRanges(htmlDoc: HTMLDocument, options: MakeRangesOptions) {
  const { normalize, verbose } = options;
  const textContent = normalize
    ? normalizeText(htmlDoc.body.textContent)
    : htmlDoc.body.textContent;
  const tn = getTextNodes(htmlDoc);
  // don;t forget the remove empty text nodes after normalization
  const textNodes = normalize
    ? tn.map(normalizeText).filter((t) => t.length > 0)
    : tn;
  const textRanges = createTextRanges(textContent, textNodes);
  const valid = validateTextRanges(textRanges, textContent, textNodes, verbose);
  return { textContent, textRanges, valid };
}

// Function to log memory usage
function logMemoryUsage(msg: string) {
  if (!verboseMemory) {
    return;
  }
  const { heapUsed } = Deno.memoryUsage();
  const heapUsedMB = (heapUsed / (1024 * 1024)).toFixed(2);

  console.log(`Heap Used (${msg}): ${heapUsedMB} MB`);
}

export async function main() {
  const sources: Record<string, Source> = {
    road: {
      name: "The Road Not Taken",
      // htmlFile: "../audio-reader-html/media/theroadnottaken-original.html",
      epubFile: "../audio-reader-html/media/theroadnottaken.epub",
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
    wrath: {
      name: "Wrath",
      epubFile: "../audio-reader-html/media/wrath.epub",
      vttFile: "../audio-reader-html/media/wrath.tiny.en.vtt",
      // vttFile: "../audio-reader-html/media/wrath.base.en.vtt",
    },
  };

  const sourceKey = Deno.args[0];
  if (!(sourceKey in sources)) {
    console.error("Invalid choice, must be one of: " + Object.keys(sources));
    Deno.exit(1);
  }
  const source = sources[sourceKey];
  logMemoryUsage("start");

  const htmlDoc = await htmlDocForSource(source);
  logMemoryUsage("after htmlDoc");

  console.log(`- vttFile: ${source.vttFile}`);
  const cues = parseVTT(Deno.readTextFileSync(source.vttFile));
  console.log(`- |VTT Cues|: ${cues.length} cues`);
  logMemoryUsage("after cues");

  const verbose = false;
  // no need to use unnormalized text matching any more
  for (const normalize of [true]) {
    const { textContent, textRanges, valid } = makeRanges(htmlDoc, {
      normalize,
      verbose,
    });
    if (!valid) {
      console.error(`TextRange validation (normalized:${normalize}) failed`);
      Deno.exit(1);
    } else {
      if (verbose) {
        console.log(`TextRange validation (normalized:${normalize}) passed`);
      }
    }
    // print the current memory consumption
    logMemoryUsage(`after TextRanges (normalized:${normalize})`);
    matchCuesToTextRanges(cues, textRanges, textContent, {
      normalize,
      verbose,
    });
    logMemoryUsage(`after matchCues (normalized:${normalize})`);
    matchWordSequences(cues, textRanges, textContent, { normalize, verbose });
    logMemoryUsage(`after matchWords (normalized:${normalize})`);
  }

  // loop 10 times to allow for memory profiling
  if (verboseMemory) {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      logMemoryUsage("the end..");
    }
  }
}

// If this module is the main module, then call the main function
if (import.meta.main) {
  await main();
}
