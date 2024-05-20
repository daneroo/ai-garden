ReactDOM.render(<App />, document.getElementById("root"));

function App() {
  const mediaChoices = [
    {
      name: "The Road Not Taken",
      audioFile: "media/theroadnottaken.mp3",
      audioType: "audio/mp3",
      transcriptFile: "media/theroadnottaken.vtt",
      markupFile: "media/theroadnottaken.html",
    },
    {
      name: "The Road Not Taken (orig)",
      audioFile: "media/theroadnottaken.mp3",
      audioType: "audio/mp3",
      transcriptFile: "media/theroadnottaken.vtt",
      markupFile: "media/theroadnottaken-original.html",
    },
    {
      name: "Weapons",
      audioFile: "media/weapons.m4b",
      audioType: "audio/mp4",
      transcriptFile: "media/weapons.base.en.vtt",
      markupFile: "media/weapons.html",
    },
    {
      name: "Wrath",
      audioFile: "media/wrath.m4b",
      audioType: "audio/mp4",
      transcriptFile: "media/wrath.vtt",
      markupFile: "media/wrath.html",
    },
    {
      name: "Ruin",
      audioFile: "media/ruin.m4b",
      audioType: "audio/mp4",
      transcriptFile: "media/ruin.vtt",
      markupFile: "media/ruin.html",
    },
    {
      name: "The Blade Itself",
      audioFile: "media/thebladeitself.m4b",
      audioType: "audio/mp4",
      transcriptFile: "media/thebladeitself.vtt",
      markupFile: "media/thebladeitself.html",
    },
  ];

  const [selectedMediaId, setSelectedMediaId] = React.useState(0);
  const { audioFile, audioType, transcriptFile } =
    mediaChoices[selectedMediaId];

  const audioPlayerRef = React.useRef(null);
  const trackRef = React.useRef(null);

  const [duration, setDuration] = React.useState(100);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [transcript, setTranscript] = React.useState([]);
  const [markupContent, setMarkupContent] = React.useState("");

  const mediaChange = (id) => {
    setSelectedMediaId(id);
  };

  function sliderChange(e) {
    const newTime = e.target.value;
    setCurrentTime(newTime);
    audioPlayerRef.current.currentTime = newTime;
  }

  React.useEffect(() => {
    fetch(mediaChoices[selectedMediaId].markupFile)
      .then((response) => response.text())
      .then((data) => setMarkupContent(data));
  }, [selectedMediaId]);

  React.useEffect(() => {
    function handleMetadataLoaded() {
      const duration = audioPlayerRef.current.duration;
      console.log(`Audion Duration (loaded): ${duration}s`);
      setDuration(duration);
    }

    function handleTimeUpdate() {
      setCurrentTime(audioPlayerRef.current.currentTime);
    }

    function handleTrackLoad() {
      const track = trackRef.current.track;
      const cues = Array.from(track.cues);
      const cueRefs = cues.map(() => React.createRef());
      setTranscript(
        cues.map((cue, index) => ({
          id: `${cue.startTime}-${cue.endTime}`,
          startTime: cue.startTime,
          text: cue.text,
          ref: cueRefs[index],
        }))
      );
    }
    audioPlayerRef.current.addEventListener(
      "loadedmetadata",
      handleMetadataLoaded
    );
    audioPlayerRef.current.ontimeupdate = handleTimeUpdate;

    audioPlayerRef.current.load(); // Reload the audio element to apply new sources

    // Well this line cost me about 5 days of debugging
    // this is disabled by default, which won;t even trigger the loading of cues from the vtt file
    // needs to be set to "showing" or "hidden" to trigger cue loading on iPad/iPhone
    // console.log(`Track mode: ${trackRef.current.track.mode}`);
    trackRef.current.track.mode = "hidden"; // or "showing", as long as it does not remain "disabled"

    trackRef.current.addEventListener("load", handleTrackLoad);

    // Clean up function
    return () => {
      audioPlayerRef.current.removeEventListener(
        "loadedmetadata",
        handleMetadataLoaded
      );
      audioPlayerRef.current.ontimeupdate = null;
      trackRef.current.removeEventListener("load", handleTrackLoad);
    };
  }, [selectedMediaId]);

  // setup the cue enter and exit event handlers
  React.useEffect(() => {
    const track = trackRef.current.track;
    const cues = Array.from(track.cues);

    cues.forEach((cue, index) => {
      function highlightElt(elt) {
        if (!elt) return;
        elt.classList.add("current");
        elt.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      cue.onenter = () => {
        // transcript side
        highlightElt(transcript[index].ref.current);
        // markup side
        const cueId = transcript[index].id;
        const elt = document.getElementById(cueId);
        if (!elt) {
          console.log(`No element found for ${cueId}`);
        }
        highlightElt(elt);
      };
      function unHighlightElt(elt) {
        if (!elt) return;
        elt.classList.remove("current");
      }
      cue.onexit = () => {
        // transcript side
        unHighlightElt(transcript[index].ref.current);
        // markup side
        const cueId = transcript[index].id;
        const elt = document.getElementById(cueId);
        unHighlightElt(elt);
      };
    });

    // Clean up function
    return () => {
      cues.forEach((cue) => {
        cue.onenter = null;
        cue.onexit = null;
      });
    };
  }, [selectedMediaId, transcript, trackRef]);

  // declare state for the markupContentHighlight
  const [markupContentHighlight, setMarkupContentHighlight] =
    React.useState("");

  // setup the highlight-instrumented markup content
  React.useEffect(() => {
    console.log(
      `markupContentHighlight effect |cues|:${transcript.length} |markup|: ${markupContent.length}`
    );
    if (!transcript.length || !markupContent) {
      return;
    }
    if (!transcript.length || !markupContentHighlight) {
      setMarkupContentHighlight(markupContent);
    }
    // here we match the transcript with the markup content
    // transcript: {id:string, text:string}[]
    const highlightedMarkupContent = highlightCuesInMarkupContent(
      transcript,
      markupContent
    );
    setMarkupContentHighlight(highlightedMarkupContent);
    return () => {
      // cleanup
    };
  }, [transcript, markupContent]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "calc(var(--vh) * 100)",
        justifyContent: "space-between",
        gap: "1.2rem",
      }}
    >
      <div>
        {/* Media Selector */}
        <span style={{ fontSize: "1.2rem" }}>Select Media:</span>

        <select
          value={selectedMediaId}
          onChange={(e) => mediaChange(e.target.value)}
          style={{ fontSize: "1.2rem" }}
        >
          {mediaChoices.map((m, index) => (
            <option key={index} value={index}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        {/* Media controls */}
        <audio ref={audioPlayerRef} controls>
          <source src={audioFile} type={audioType} />
          <track
            ref={trackRef}
            src={transcriptFile}
            kind="subtitles"
            srcLang="en"
            default
          />
        </audio>
        <div>
          <span>{formatTime(currentTime)}</span>
          <input
            type="range"
            value={currentTime}
            max={duration}
            onChange={sliderChange}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      {/* Two-Column Layout for Transcript and HTML Content */}
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
          display: "flex",
          gap: "1rem", // Add a gap between the columns
          justifyContent: "space-between", // Add space between the columns
          paddingLeft: "1rem", // Add padding to the left of the container
          paddingRight: "1rem", // Add padding to the right of the container
        }}
      >
        {/* Transcript Column */}
        <div
          style={{
            width: "50%", // half of the container width
            overflowY: "auto",
          }}
        >
          {/* This is where the transcript goes */}
          {transcript.map((cue) => (
            <div
              className={"caption"}
              key={cue.id}
              ref={cue.ref}
              onDoubleClick={() => {
                console.log("dbl click", cue);
                setCurrentTime(cue.startTime);
                audioPlayerRef.current.currentTime = cue.startTime;
              }}
            >
              {cue.text}
            </div>
          ))}
        </div>

        {/* HTML Content Column */}
        <div
          style={{
            width: "50%", // half of the container width
            overflowY: "auto",
          }}
        >
          {/* highlighted content from fuzzy match */}
          <div
            dangerouslySetInnerHTML={{
              // __html: markupContent,
              __html: markupContentHighlight,
            }}
          />
        </div>
      </div>
      <div>
        {/* Reload button  */}
        <button
          onClick={() => location.reload()}
          style={{ fontSize: "1.5rem", padding: "1rem", margin: "1rem" }}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

function stripHTML(text) {
  const div = document.createElement("div");
  div.innerHTML = text;
  return div.textContent || div.innerText || "";
}
function normalizeText(text) {
  // Strip HTML tags from text
  // This RE does not work,
  // const stripRE = /<(?:"[^"]*"['"]*'[^']*'['"]*[^'">])+>/g;
  // const strippedHtml = text.replace(stripRE, "");
  const strippedHtml = stripHTML(text);
  // Normalize text: convert to lowercase, remove non-word characters, collapse spaces
  return strippedHtml
    .toLowerCase()
    .replace(/[\W_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// highligh elements using a linearized text node
function highlightCuesInMarkupContent(cues, markupContent) {
  const start = +new Date();

  const div = document.createElement("div");
  div.innerHTML = markupContent;
  const { normalizedText, reverseMap } = createReverseMap(div);
  console.log(`reverseMap: ${reverseMap.length}`);

  for (const cue of cues) {
    // Short circuit for The Blade Itself
    if (
      cue.text.trim() === "Part 1." || // blade
      cue.text.trim() === "Chapter 3" || // ruin
      cue.text.trim() === "Chapter 4 Corbin" || // wrath
      cue.text.trim() === "Numeral 13" // weapons - XIII
    ) {
      console.log(`-- Early termination: ${cue.text}`);
      break;
    }
    const needle = normalizeText(cue.text);
    console.log(`-- looking for: ${needle}`);
    const needleStartInNormalizedText = normalizedText.indexOf(needle);
    const needleEndInNormalizedText =
      needleStartInNormalizedText + needle.length - 1;

    if (needleStartInNormalizedText < 0) {
      console.error(`Could not find: ${needle}`);
      continue;
    } else {
      console.log(
        `.. found at ${needleStartInNormalizedText} in normalizedText`
      );
      // now find in reverseMap
      // TODO: this is just for the 1:1 case, need to handle multiple matches
      const matches = reverseMap.filter(
        (entry) =>
          needleEndInNormalizedText >= entry.start &&
          needleStartInNormalizedText <= entry.end
      );
      if (matches.length === 0) {
        console.error(`-- no matches for : ${needle}`);
      } else if (matches.length === 1) {
        const match = matches[0];
        console.log(
          `  - match: ${match.start}..${
            match.end
          } parent: ${match.parentNode.textContent.trim()}`
        );
        highlightMatchWithinTextNode(match.parentNode, cue);
      } else if (matches.length > 1) {
        console.warn(`-- reverseMap: multiple matches for : ${needle}`);
        for (const match of matches) {
          console.log(
            `  - match: ${match.start}..${
              match.end
            } parent: ${match.parentNode.textContent.trim()}`
          );
          // not yet multiple match aware/capable
          // highlightMatchWithinTextNode(match.parentNode, cue);
        }
      }
    }
  }
  console.log(
    `Elapsed: ${+new Date() - start}ms for ${cues.length} cues rate: ${(
      (+new Date() - start) /
      cues.length
    ).toFixed(2)}ms/cue (match)`
  );
  return div.innerHTML;
}

/**
 * Finds the startIndex and length of a substring (needle) in a Node (haystack).
 * if the the haystackNode is a not a text node
 *  return the startIndex of the normalized needle in the normalized textContent
 * if the haystackNode is a text node
 *
 * @param {Node} haystackNode - The node in which to search for the substring.
 * @param {string} needle - The substring to search for.
 * @returns {[number, number]} - A tuple containing the start and length indices of the substring in the node's text content.
 */
function findTextInNode(haystackNode, needle) {
  // 1- find normalized text in normalized node.textContent
  const haystack = haystackNode.textContent;
  const nHaystack = normalizeText(haystack);
  const nNeedle = normalizeText(needle);
  const nNeedleStartIndex = nHaystack.indexOf(nNeedle);
  if (nNeedleStartIndex < 0) {
    console.error(
      `Needle not found\n |needle|: ${nNeedle}\n |haystack|: ${nHaystack}`
    );
    return [nNeedleStartIndex, 0];
  }
  console.log(`.. |needle| found at ${nNeedleStartIndex} in |haystack|`);
  if (
    nHaystack.slice(nNeedleStartIndex, nNeedleStartIndex + nNeedle.length) ===
    nNeedle
  ) {
    console.log(`.. |needle| assertion passed (start:${nNeedleStartIndex})`);
  }
  if (haystackNode.nodeType !== Node.TEXT_NODE) {
    console.debug(`.. not a text node: probably the parent node`);
    return [nNeedleStartIndex, nNeedle.length];
  }
  console.log(`.. refining for text node`);

  // if this is a text node, refine start index with original non-normalized text
  const needleStartIndex = haystack.indexOf(needle, 0);

  // exact match
  if (needleStartIndex >= 0) {
    console.log(`.. needle found in node start:${needleStartIndex}`);
    if (
      haystack.slice(needleStartIndex, needleStartIndex + needle.length) ===
      needle
    ) {
      console.log(`.. needle assertion passed (start:${needleStartIndex})`);
    } else {
      console.error(
        `.. needle assertion failed (start:${needleStartIndex})\nhaystack.slice:${haystack.slice(
          needleStartIndex,
          needleStartIndex + needle.length
        )}\nneedle:${needle}`
      );
    }
    return [needleStartIndex, needle.length];
  }
  // So we have an inexact match, let's find the maximal normalized match
  // i.e. let us find a substring of haystack that matches the normalized needle
  // and we know that such a string exists
  // nHaystack.slice(nNeedleStartIndex, nNeedleStartIndex + nNeedle.length) === nNeedle
  // TODO(daneroo): tighten up these bounds
  // ordered to find smallest match: start: descending, length: ascending
  // console.log(
  //   `.. searching for needle: |${nNeedle}| in haystack: |${haystack}|`
  // );
  for (let s = haystack.length - 1; s >= 0; s--) {
    for (let l = 0; l < haystack.length - s; l++) {
      const sub = haystack.slice(s, s + l);
      const nSub = normalizeText(sub);
      // console.log(`  .. considering s: ${s} l: ${l} nSub: |${nSub}|`);
      if (nSub === nNeedle) {
        console.log(
          `.. found a (normalized) match start:${s} length:${l} ${sub}`
        );
        console.log(
          JSON.stringify(
            {
              needle,
              nNeedle,
              sub,
              nSub,
            },
            null,
            2
          )
        );

        return [s, l];
      }
    }
  }
  // should not happen - since we know that a normalized match exists
  console.warn("No normalized match found in text node: SHOULD NOT HAPPEN");
  console.log(`|needle|: |${nNeedle}|\n|haystack|: |${nHaystack}|`);
  console.log(`needle: '${needle}'\nhaystack: '${haystack}'`);
  return [-1, 0];
}

// childNode is a text node
function wrapNeedleInSpan(parentNode, childNode, startIndex, length, spanId) {
  // Step 1: Split the text at the start index of the needle
  const restNode = childNode.splitText(startIndex);

  // Step 2: Split the restNode at the end of the needle to isolate the needle
  /*const needleNode =*/ restNode.splitText(length);

  // Step 3: Create a new span element and move the needle text into it
  // element.innerHTML = `<span id="${cue.id}" class="caption">${element.innerHTML}</span>`;
  const span = document.createElement("span");
  span.id = spanId; // Apply the cue id as the span id
  span.className = "caption"; // Apply any class for styling
  span.textContent = restNode.textContent; // Transfer the needle text to the span
  // span.style.border = "1px solid green";
  // Step 4: Replace the original needle text node with the span
  parentNode.replaceChild(span, restNode);
  // Now the parentNode contains three parts:
  // 1. Original text up to 'foundChildStartIndex'
  // 2. The 'span' containing the needle
  // 3. The rest of the original text after the
}

function highlightMatchWithinTextNode(parentNode, cue) {
  const needle = cue.text;
  const [parentIndex, _length] = findTextInNode(parentNode, needle);
  if (parentIndex < 0) {
    console.error(`Needle not found in parent node`);
    return;
  }
  console.log(`.. needle found in parent (start:${parentIndex})`);

  // now we need to find the start and end offsets in the unnormalized child node
  // we need to find the right child textNode to highlight
  console.log("----- children:");
  let foundChild = null;
  let foundChildStartIndex = -1;
  let foundChildLength = -1;
  for (const child of parentNode.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const [childStartIndex, length] = findTextInNode(child, needle);
      if (childStartIndex >= 0) {
        console.log(`.. found in child (start:${childStartIndex})`);
        foundChild = child;
        foundChildStartIndex = childStartIndex;
        foundChildLength = length;
        break;
      }
    } else {
      console.log(`.. skipping non-text child: ${child.textContent}`);
    }
  }
  if (!foundChild) {
    console.error(`Could not find child node for ${needle}`);
    return;
  }
  console.log(`.. needle found in child start:${foundChildStartIndex}`);
  // split the child (text) node and wrap the needle in a span
  wrapNeedleInSpan(
    parentNode,
    foundChild,
    foundChildStartIndex,
    foundChildLength,
    cue.id
  );
}

// this function returns a normalized text and a reverse map
function createReverseMap(element) {
  const normalizedText = normalizeText(element.textContent);
  let charIndex = 0; // This will keep track of the current position in the normalized text.
  const reverseMap = [];

  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = normalizeText(node.textContent);
      const length = text.length;
      // skip empty text nodes
      if (length > 0) {
        // this is to account for the top level text content, vs joined inner text content and empty space nodes
        const charIndexInOuter = normalizedText.indexOf(text, charIndex);
        if (charIndexInOuter < 0) {
          console.error(`Could not match in outer: ${text}`);
        } else {
          // console.log(`.. off by ${charIndexInOuter - charIndex} chars`);
          charIndex = charIndexInOuter;
        }

        const startIndex = charIndex.toString().padStart(5, "0");
        console.log(` - start:${startIndex} l:${length} text: ${text}`);
        // console.log(
        //   ` - text:${startIndex}/${length} node: ${normalizedText.slice(
        //     charIndex,
        //     charIndex + length
        //   )}`
        // );
        reverseMap.push({
          start: charIndex,
          end: charIndex + length - 1,
          parentNode: node.parentNode,
        });
      }
      charIndex += length; // Update the current position by the length of the text node.
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(traverse); // Recursively handle all children.
    } else if (node.nodeType === Node.COMMENT_NODE) {
      console.log("Skipping comment node");
    } else {
      console.error("Unhandled node type:", node.nodeType);
    }
  }

  traverse(element);
  return { normalizedText, reverseMap };
}

// This is a stub implementation (fake) of the findFuzzyMatch functionality
// it uses fuzzball and is not working well
function highlightCuesInMarkupContentWithFuzzBall(cues, markupContent) {
  const div = document.createElement("div");
  div.innerHTML = markupContent;
  const choiceElements = Array.from(
    div.querySelectorAll("p, .o-poem > *, .c-feature-hd, .c-feature-sub")
  );

  const choices = choicesFromElements(choiceElements);
  const start = +new Date();
  for (const cue of cues) {
    if (cue.text.trim() === "Part 1.") {
      console.log(`-- Early termination: ${cue.text}`);
      break;
    }
    const needle = cue.text;
    console.log(`-- looking for: ${needle}`);
    const matches = fuzzball.extract(needle, choices, {
      scorer: fuzzball.partial_ratio,
      processor: (choice) => choice.text,
      limit: 1, // Max number of top results to return, default: no limit / 0.
      cutoff: 0, // Lowest score to return, default: 0
      unsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
      returnObjects: true,
    });
    if (matches.length > 1) {
      console.warn(`-- multiple matches for : ${needle}`);
    }
    // only use the first match
    for (const match of matches.slice(0, 1)) {
      console.log(
        `  - score:${match.score}: id:${
          match.choice.id
        } ${match.choice.text.slice(0, 80)}`
      );
      const element = match.choice.element;
      console.log("  - element:", element);
      element.innerHTML = `<span id="${cue.id}" class="caption">${element.innerHTML}</span>`;
    }
  }
  console.log(
    `Elapsed: ${+new Date() - start}ms for ${cues.length} cues rate: ${(
      (+new Date() - start) /
      cues.length
    ).toFixed(2)}ms/cue (fuzzball)`
  );
  return div.innerHTML;
}

// extract the fuzzball choices from the markup content
function choicesFromElements(choiceElements) {
  return choiceElements
    .map((p, index) => {
      const element = p;
      const text = normalizeText(p.innerHTML);
      return { id: `k-${index}`, text, element };
    })
    .filter((choice) => choice.text.length > 0);
}
function fuzzTest() {
  // fuzz test
  const corpusLines = `
    The Road Not Taken
  By Robert Frost
  Two roads diverged in a yellow wood,
  And sorry I could not travel both
  And be one traveler, long I stood
  And looked down one as far as I could
  To where it bent in the undergrowth;
  
  Then took the other, as just as fair,
  And having perhaps the better claim,
  Because it was grassy and wanted wear;
  Though as for that the passing there
  Had worn them really about the same,
  
  And both that morning equally lay
  In leaves no step had trodden black.
  Oh, I kept the first for another day!
  Yet knowing how way leads on to way,
  I doubted if I should ever come back.
  
  I shall be telling this with a sigh
  Somewhere ages and ages hence:
  Two roads diverged in a wood, and I—
  I took the one less traveled by,
  And that has made all the difference.`
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.trim().length > 0)
    .map((line) => normalizeText(line))
    .map((line, index) => {
      return { id: `k-${index}`, text: line }; // could keep markup!
    });
  console.log(
    `corpus: ${corpusLines.length}\n${corpusLines
      .map((line) => JSON.stringify(line))
      .join("\n")}`
  );
  // console.log(fuzzball.partial_ratio("test", "testing"));
  const needles = [
    "The road not taken by Robert Frost.",
    "Two roads diverged in a yellow wood,",
  ];
  for (const needle of needles) {
    console.log(`--looking for: ${needle}`);
    const matches = fuzzball.extract(needle, corpusLines, {
      scorer: fuzzball.partial_ratio,
      processor: (choice) => choice.text,
      limit: 3, // Max number of top results to return, default: no limit / 0.
      cutoff: 50, // Lowest score to return, default: 0
      unsorted: false, // Results won't be sorted if true, default: false. If true limit will be ignored.
      returnObjects: true,
    });
    console.log(JSON.stringify(matches, null, 2));
  }
}
function formatTime(secs) {
  if (isNaN(secs)) return "0:00.00";
  const fl = Math.floor;
  const H = 3600;
  const hours = secs >= H ? `${fl(secs / H)}:` : "";
  const minutes = fl((secs % H) / 60)
    .toFixed(0)
    .padStart(2, "0");
  const seconds = (secs % 60).toFixed(2).padStart(5, "0");
  return `${hours}${minutes}:${seconds}`;
}
